import os
from flask import Blueprint, render_template, jsonify, request
from backend.database.tiles_db import load_tiles_from_db, save_sample_request, load_ai_settings
from backend.ai.noor_agent import get_noor_response
from backend.ai.render_pipeline import generate_photorealistic_render
from backend.utils.whatsapp import generate_whatsapp_link

customer_bp = Blueprint('customer', __name__)

@customer_bp.route("/")
@customer_bp.route("/showroom")
def showroom_portal():
    """Serve the luxury customer zero-gravity 3D showroom page."""
    return render_template("index.html")

@customer_bp.route("/chat")
def customer_chat():
    """Customer chat direct portal view."""
    return render_template("index.html", auto_open_chat=True)

@customer_bp.route("/preview")
def customer_preview():
    """Customer photorealistic render direct portal view."""
    return render_template("index.html", auto_open_render=True)

@customer_bp.route("/api/tiles", methods=["GET"])
def get_customer_tiles():
    """Get the active product list for the 3D customer showroom."""
    tiles = load_tiles_from_db()
    
    # Hide unavailable/hidden tiles from customers automatically!
    visible_only = request.args.get("visible_only", "true").lower() == "true"
    if visible_only:
        tiles = [t for t in tiles if t.get("visible", True) and (t.get("in_stock", True) or t.get("stock", True))]
        
    return jsonify({"success": True, "tiles": tiles})

@customer_bp.route("/api/noor", methods=["POST"])
def noor_chat():
    """Converse with Noor, featuring real-time Admin Custom Prompts."""
    data = request.json or {}
    message = data.get("message", "")
    selected_floor = data.get("selected_floor", {})
    selected_wall = data.get("selected_wall", {})
    
    if not message:
        return jsonify({"success": False, "error": "Message is required"}), 400
        
    # Read dynamic prompt set by Admin in dashboard
    ai_settings = load_ai_settings()
    custom_system_prompt = ai_settings.get("system_prompt", "")
    
    response = get_noor_response(
        message, 
        selected_floor=selected_floor, 
        selected_wall=selected_wall,
        custom_system_prompt=custom_system_prompt
    )
    return jsonify({"success": True, "reply": response})

@customer_bp.route("/api/render", methods=["POST"])
def render_showroom_room():
    """Request Hugging Face FLUX photorealistic room preview."""
    data = request.json or {}
    room_type = data.get("room_type", "living")
    floor_tile = data.get("floor_tile", "Calacatta Gold")
    wall_tile = data.get("wall_tile", "Nero Marquina")
    screenshot = data.get("screenshot")
    custom_prompt = data.get("custom_prompt")
    style_preset = data.get("style_preset")
    
    result = generate_photorealistic_render(
        room_type, 
        floor_tile, 
        wall_tile, 
        base64_screenshot=screenshot,
        custom_prompt=custom_prompt,
        style_preset=style_preset
    )
    return jsonify(result)

@customer_bp.route("/api/sample", methods=["POST"])
def customer_request_sample():
    """Process customer sample request, log it, and return WA link."""
    data = request.json or {}
    name = data.get("name", "Customer")
    phone = data.get("phone", "")
    emirate = data.get("emirate", "Dubai")
    address = data.get("address", "")
    floor_tile = data.get("floor_tile", "None")
    wall_tile = data.get("wall_tile", "None")
    
    if not name or not phone:
         return jsonify({"success": False, "error": "Name and Phone are required."}), 400

    # Save to the active admin database!
    request_log = {
        "name": name,
        "phone": phone,
        "emirate": emirate,
        "address": address,
        "floor_tile": floor_tile,
        "wall_tile": wall_tile
    }
    save_sample_request(request_log)
    
    number = os.environ.get("WHATSAPP_NUMBER") or os.environ.get("VITE_WHATSAPP_NUMBER") or "971501234567"
    wa_link = generate_whatsapp_link(number, name, phone, emirate, address, floor_tile, wall_tile)
    
    return jsonify({"success": True, "whatsapp_link": wa_link})
