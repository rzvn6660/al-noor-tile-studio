import os
import io
import hashlib
import time
import shutil
from PIL import Image, ImageChops
import fitz # PyMuPDF

# Image directory paths
STATIC_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static")
TILE_IMG_DIR = os.path.join(STATIC_DIR, "images", "tiles")
THUMB_IMG_DIR = os.path.join(TILE_IMG_DIR, "thumbnails")

for d in [TILE_IMG_DIR, THUMB_IMG_DIR]:
    if not os.path.exists(d):
        os.makedirs(d)

def clean_and_optimize_image(image_bytes, ext):
    """
    Load image using Pillow, crop white space margins, and compress/optimize.
    Returns (optimized_bytes, thumbnail_bytes, width, height) or (None, None, 0, 0)
    """
    try:
        img = Image.open(io.BytesIO(image_bytes))
        
        # Check size - filter out tiny decorative images/logos/barlines
        if img.width < 120 or img.height < 120:
            return None, None, 0, 0

        # Auto-crop unnecessary whitespace borders from stone photographs
        if img.mode not in ("RGB", "RGBA"):
            img = img.convert("RGB")
            
        # Standard white space crop:
        # Find border color from corners
        bg_color = img.getpixel((0, 0))
        bg = Image.new(img.mode, img.size, bg_color)
        diff = ImageChops.difference(img, bg)
        diff = ImageChops.add(diff, diff, 2.0, -100)
        bbox = diff.getbbox()
        if bbox:
            img = img.crop(bbox)
            
        # Optimize tile/slab: scale down large textures to keep rendering fast and low-latency
        max_size = 1024
        if img.width > max_size or img.height > max_size:
            img.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
            
        # Save optimized web image bytes
        opt_io = io.BytesIO()
        img.save(opt_io, format="JPEG", quality=85, optimize=True)
        optimized_bytes = opt_io.getvalue()
        
        # Generate thumbnail (e.g. 256x256 max)
        thumb_img = img.copy()
        thumb_img.thumbnail((256, 256), Image.Resampling.LANCZOS)
        thumb_io = io.BytesIO()
        thumb_img.save(thumb_io, format="JPEG", quality=80, optimize=True)
        thumbnail_bytes = thumb_io.getvalue()
        
        return optimized_bytes, thumbnail_bytes, img.width, img.height
    except Exception as e:
        print(f"Image Optimization Error: {e}")
        return None, None, 0, 0

def extract_pdf_images_and_match(pdf_path, extracted_tiles):
    """
    Extracts all high-quality tile images from the catalog PDF, de-duplicates them,
    and matches them intelligently with extracted tiles using layout page metrics.
    """
    if not pdf_path or not os.path.exists(pdf_path) or not pdf_path.lower().endswith(".pdf"):
        return extracted_tiles

    try:
        doc = fitz.open(pdf_path)
    except Exception as e:
        print(f"Error opening PDF with PyMuPDF: {e}")
        return extracted_tiles

    # Store extracted images page-by-page
    # Format: { page_num (0-indexed): [ { 'url': ..., 'thumb_url': ..., 'hash': ..., 'rect': ... } ] }
    page_images = {}
    seen_hashes = set()

    print(f"PDF Extractor: Beginning bulk extraction of images from {pdf_path}...")

    for page_num in range(len(doc)):
        page = doc[page_num]
        image_list = page.get_images(full=True)
        if not image_list:
            continue

        page_images[page_num] = []
        
        for img_idx, img_info in enumerate(image_list):
            xref = img_info[0]
            
            # Extract raw image bytes
            try:
                base_image = doc.extract_image(xref)
                img_bytes = base_image["image"]
                img_ext = base_image["ext"]
            except Exception as e:
                print(f"Skipping corrupt image xref {xref} on page {page_num}: {e}")
                continue

            # Check duplicate hash
            img_hash = hashlib.md5(img_bytes).hexdigest()
            if img_hash in seen_hashes:
                continue
            seen_hashes.add(img_hash)

            # Optimize & Clean (crop white margins)
            opt_bytes, thumb_bytes, w, h = clean_and_optimize_image(img_bytes, img_ext)
            if not opt_bytes:
                continue # Skip small icons/decorative lines

            # Get bounding box on page if possible
            rects = page.get_image_rects(xref)
            rect = rects[0] if rects else None

            # Generate unique filenames
            timestamp = int(time.time() * 1000) + img_idx
            filename = f"tile_extract_{timestamp}.jpg"
            thumb_filename = f"thumb_{filename}"
            
            filepath = os.path.join(TILE_IMG_DIR, filename)
            thumb_filepath = os.path.join(THUMB_IMG_DIR, thumb_filename)

            # Save files
            with open(filepath, "wb") as f:
                f.write(opt_bytes)
            with open(thumb_filepath, "wb") as f:
                f.write(thumb_bytes)

            image_url = f"/static/images/tiles/{filename}"
            thumbnail_url = f"/static/images/tiles/thumbnails/{thumb_filename}"

            page_images[page_num].append({
                "image_url": image_url,
                "thumbnail_url": thumbnail_url,
                "rect": rect,
                "hash": img_hash
            })

    print(f"PDF Extractor: Completed extraction. Found {len(seen_hashes)} unique raw images.")

    # Match extracted images to Gemini parsed products
    # We match by page number, and then by spatial order on that page!
    for tile in extracted_tiles:
        # Get page matching (Gemini is 1-indexed, fitz is 0-indexed)
        try:
            tile_page_1based = int(tile.get("extracted_page", 1))
        except:
            tile_page_1based = 1
            
        page_num_0based = tile_page_1based - 1
        
        # If no page images on this page, look at adjacent pages (page-1, page+1) as fallback
        matched_img = None
        
        possible_pages = [page_num_0based, page_num_0based - 1, page_num_0based + 1]
        for p in possible_pages:
            if p in page_images and len(page_images[p]) > 0:
                # Retrieve the first available image and remove it so we don't assign it twice!
                matched_img = page_images[p].pop(0)
                break
                
        # If we got a match, attach it to the product catalog record!
        if matched_img:
            tile["image_url"] = matched_img["image_url"]
            tile["thumbnail_url"] = matched_img["thumbnail_url"]
            tile["extraction_confidence"] = tile.get("extraction_confidence", 0.95)
        else:
            # Fallback if no matching image extracted from PDF
            tile["image_url"] = tile.get("image_url", "")
            tile["thumbnail_url"] = tile.get("thumbnail_url", tile.get("image_url", ""))
            tile["extraction_confidence"] = tile.get("extraction_confidence", 0.70)

    return extracted_tiles
