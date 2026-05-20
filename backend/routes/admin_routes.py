import os
from flask import Blueprint, render_template, jsonify, request
from backend.database.tiles_db import (
    load_tiles_from_db, 
    save_tiles_to_db, 
    add_new_tiles, 
    delete_single_tile, 
    load_sample_requests,
    load_ai_settings,
    save_ai_settings
)
from backend.utils.catalog_ingestion import download_gdrive_pdf, extract_text_from_pdf, clean_temp_file, TEMP_DIR
from backend.ai.catalog_parser import parse_catalog_text, parse_catalog_image

admin_bp = Blueprint('admin', __name__, url_prefix='/admin')

@admin_bp.route("/")
@admin_bp.route("/dashboard")
def dashboard_view():
    """Serve the complete glassmorphic Admin portal."""
    return render_template("admin.html")

@admin_bp.route("/products")
def products_view():
    """Specific Products route."""
    return render_template("admin.html", active_tab="products")

@admin_bp.route("/import")
def import_view():
    """Specific Import tab view."""
    return render_template("admin.html", active_tab="import")

@admin_bp.route("/settings")
def settings_view():
    """Specific settings view."""
    return render_template("admin.html", active_tab="settings")

# --- ADMIN REST API ENDPOINTS ---

@admin_bp.route("/api/stats", methods=["GET"])
def get_admin_stats():
    """API endpoint to get real-time catalog & request metrics."""
    tiles = load_tiles_from_db()
    requests = load_sample_requests()
    
    total_products = len(tiles)
    visible_products = len([t for t in tiles if t.get("visible", True)])
    hidden_products = total_products - visible_products
    
    # Calculate popular categories count
    cats = [t.get("category", "floor") for t in tiles]
    popular_tiles = [
        {"name": "Floor Tiles", "count": cats.count("floor")},
        {"name": "Wall Cladding", "count": cats.count("wall")},
        {"name": "Accent Tiles", "count": cats.count("accent")}
    ]
    
    return jsonify({
        "success": True,
        "stats": {
            "total_products": total_products,
            "visible_products": visible_products,
            "hidden_products": hidden_products,
            "requests_count": len(requests),
            "popular_tiles": popular_tiles,
            "recent_uploads": ["catalog_may_2026.pdf", "granite_slabs_v2.pdf"]
        }
    })

@admin_bp.route("/api/requests", methods=["GET"])
def get_sample_requests():
    """Retrieve logged customer sample requests for admin dashboard."""
    requests = load_sample_requests()
    # Sort requests reverse chronological
    requests.reverse()
    return jsonify({"success": True, "requests": requests})

@admin_bp.route("/api/settings", methods=["GET", "POST"])
def manage_ai_settings():
    """Retrieve or modify dynamic Noor AI Prompt settings."""
    if request.method == "POST":
        data = request.json or {}
        new_prompt = data.get("system_prompt", "").strip()
        new_style = data.get("recommendation_style", "premium").strip()
        
        if not new_prompt:
            return jsonify({"success": False, "error": "System prompt cannot be empty"}), 400
            
        success = save_ai_settings({
            "system_prompt": new_prompt,
            "recommendation_style": new_style
        })
        if success:
             return jsonify({"success": True, "message": "Noor AI behavior prompt updated successfully! 🤖"})
        return jsonify({"success": False, "error": "Failed to save AI configuration settings"}), 500
        
    settings = load_ai_settings()
    return jsonify({"success": True, "settings": settings})

@admin_bp.route("/api/catalog/upload-pdf", methods=["POST"])
def upload_pdf_catalog():
    """Upload catalog PDFs or catalog photos directly to parse tile entities using Gemini."""
    if 'file' not in request.files:
        return jsonify({"success": False, "error": "No file uploaded"}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({"success": False, "error": "Empty filename"}), 400
        
    ext = file.filename.lower().split('.')[-1]
    if ext not in ['pdf', 'png', 'jpg', 'jpeg', 'webp']:
        return jsonify({"success": False, "error": "Supported formats: PDF, PNG, JPG, JPEG, WEBP catalog image files."}), 400
        
    # Set up static images directory for persistent tile textures
    STATIC_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static")
    TILE_IMG_DIR = os.path.join(STATIC_DIR, "images", "tiles")
    if not os.path.exists(TILE_IMG_DIR):
        os.makedirs(TILE_IMG_DIR)

    temp_path = os.path.join(TEMP_DIR, f"upload_{file.filename}")
    
    try:
        file.save(temp_path)
        
        # Check if we should use Vision API or Text PDF Parser
        if ext in ['png', 'jpg', 'jpeg', 'webp']:
            print(f"Admin Route: Processing uploaded image catalog using Gemini Vision: {temp_path}")
            
            # Save persistently in our static images folder
            import shutil
            import time
            unique_filename = f"tile_{int(time.time())}_{file.filename}"
            persistent_path = os.path.join(TILE_IMG_DIR, unique_filename)
            shutil.copy(temp_path, persistent_path)
            image_web_url = f"/static/images/tiles/{unique_filename}"
            
            extracted_tiles = parse_catalog_image(temp_path)
            
            # Map the actual uploaded image URL to the extracted tiles so they use real textures!
            for tile in extracted_tiles:
                tile["image_url"] = image_web_url
        else:
            print(f"Admin Route: Processing uploaded PDF catalog: {temp_path}")
            raw_text = extract_text_from_pdf(temp_path)
            if not raw_text or len(raw_text.strip()) < 10:
                return jsonify({"success": False, "error": "Could not extract readable text from PDF catalog."}), 400
            extracted_tiles = parse_catalog_text(raw_text)
            
            # Advanced image extraction & matching pipeline!
            from backend.utils.pdf_extractor import extract_pdf_images_and_match
            extracted_tiles = extract_pdf_images_and_match(temp_path, extracted_tiles)
            
        clean_temp_file(temp_path)
        return jsonify({"success": True, "extracted_tiles": extracted_tiles})
        
    except Exception as e:
        clean_temp_file(temp_path)
        print(f"Error processing upload: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@admin_bp.route("/api/catalog/import-gdrive", methods=["POST"])
def import_gdrive_catalog():
    """Import and parse catalog PDF from Google Drive share link."""
    data = request.json or {}
    url = data.get("url", "")
    
    if not url:
        return jsonify({"success": False, "error": "Google Drive URL is required"}), 400
        
    temp_path = None
    try:
        temp_path = download_gdrive_pdf(url)
        if not temp_path or not os.path.exists(temp_path):
             return jsonify({"success": False, "error": "Failed to download catalog PDF from Google Drive. Ensure link has 'Anyone with link can view' permissions."}), 400
            
        raw_text = extract_text_from_pdf(temp_path)
        if not raw_text or len(raw_text.strip()) < 10:
             return jsonify({"success": False, "error": "Downloaded file did not contain extractable plain text."}), 400
            
        extracted_tiles = parse_catalog_text(raw_text)
        
        # Advanced image extraction & matching pipeline!
        from backend.utils.pdf_extractor import extract_pdf_images_and_match
        extracted_tiles = extract_pdf_images_and_match(temp_path, extracted_tiles)
        
        clean_temp_file(temp_path)
        return jsonify({"success": True, "extracted_tiles": extracted_tiles})
        
    except Exception as e:
        if temp_path:
            clean_temp_file(temp_path)
        print(f"Error processing Google Drive catalog: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@admin_bp.route("/api/catalog/sync", methods=["POST"])
def sync_catalog_changes():
    data = request.json or {}
    tiles = data.get("tiles", [])
    try:
        save_tiles_to_db(tiles)
        return jsonify({"success": True, "message": "Catalog grid successfully synchronized."})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@admin_bp.route("/api/catalog/sync-extracted", methods=["POST"])
def commit_new_extracted_tiles():
    data = request.json or {}
    tiles = data.get("tiles", [])
    try:
        add_new_tiles(tiles)
        return jsonify({"success": True, "message": "Ingested catalog tiles successfully appended."})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@admin_bp.route("/api/catalog/delete-tile", methods=["POST"])
def delete_catalog_tile():
    data = request.json or {}
    tile_id = data.get("tile_id")
    if not tile_id:
        return jsonify({"success": False, "error": "Tile ID is required"}), 400
    try:
        deleted = delete_single_tile(tile_id)
        if deleted:
            return jsonify({"success": True, "message": "Product successfully deleted from catalog."})
        return jsonify({"success": False, "error": "Product not found"}), 404
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
