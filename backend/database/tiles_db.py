# Clean Local & Supabase database sync layer for Al-Noor Tile Studio
import os
import json
import time
from backend.database.tiles_data import DEFAULT_TILES

DB_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(DB_DIR, "local_db.json")
REQUESTS_FILE = os.path.join(DB_DIR, "requests_db.json")
SETTINGS_FILE = os.path.join(DB_DIR, "ai_settings.json")

# Initialize database files
if not os.path.exists(DB_FILE):
    try:
        with open(DB_FILE, "w", encoding="utf-8") as f:
            json.dump(DEFAULT_TILES, f, indent=4)
    except Exception as e:
        print(f"Error: {e}")

if not os.path.exists(REQUESTS_FILE):
    try:
        with open(REQUESTS_FILE, "w", encoding="utf-8") as f:
            json.dump([], f, indent=4)
    except Exception as e:
        print(f"Error: {e}")

DEFAULT_AI_SETTINGS = {
    "system_prompt": "You are Noor, an elegant, warm, and highly professional luxury UAE tile showroom assistant. You help customers with tile calculations (+15% wastage factor), slip-resistance guidelines, AED price quotes, and modern interior layouts.",
    "recommendation_style": "premium"
}

if not os.path.exists(SETTINGS_FILE):
    try:
        with open(SETTINGS_FILE, "w", encoding="utf-8") as f:
            json.dump(DEFAULT_AI_SETTINGS, f, indent=4)
    except Exception as e:
         print(f"Error: {e}")

# Check if Supabase credentials exist
SUPABASE_URL = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY") or os.environ.get("VITE_SUPABASE_ANON_KEY")

supabase_client = None

if SUPABASE_URL and SUPABASE_KEY and SUPABASE_URL.startswith("http"):
    try:
        from supabase import create_client
        supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("DB Client: Connected to Supabase.")
    except Exception as e:
        print(f"DB Client: Supabase initialization error: {e}. Falling back to Local DB.")
else:
    print("DB Client: Supabase not configured/invalid. Using local JSON database.")

# --- TILE CATALOG FUNCTIONS ---

def load_tiles_from_db():
    if supabase_client:
        try:
            res = supabase_client.table("tiles").select("*").execute()
            if res.data and len(res.data) > 0:
                return res.data
        except Exception as e:
            print(f"Error reading from Supabase: {e}. Falling back to local JSON database.")
    try:
        if os.path.exists(DB_FILE):
            with open(DB_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception as e:
        print(f"Error reading local JSON database: {e}")
    return DEFAULT_TILES

def save_tiles_to_db(tiles_list):
    try:
        with open(DB_FILE, "w", encoding="utf-8") as f:
            json.dump(tiles_list, f, indent=4)
    except Exception as e:
        print(f"Error saving local: {e}")

    if supabase_client:
        try:
            for tile in tiles_list:
                row = {
                    "id": str(tile.get("id")),
                    "name": tile.get("name"),
                    "code": tile.get("code", f"AN-{tile.get('id')}-M"),
                    "category": tile.get("category"),
                    "finish": tile.get("finish", "Polished"),
                    "dimensions": tile.get("dimensions", "60x120 cm"),
                    "price_aed": float(tile.get("price_aed") or tile.get("price_aed", 150)),
                    "stock": bool(tile.get("stock", tile.get("in_stock", True))),
                    "visible": bool(tile.get("visible", True)),
                    "image_url": tile.get("image_url", ""),
                    "description": tile.get("description", ""),
                    "hex_color": tile.get("hex_color", "#cccccc"),
                    "roughness": float(tile.get("roughness", 0.1)),
                    "metalness": float(tile.get("metalness", 0.0))
                }
                supabase_client.table("tiles").upsert(row).execute()
        except Exception as e:
            print(f"Error sync with Supabase: {e}")

def update_single_tile(tile_id, updates):
    tiles = load_tiles_from_db()
    updated = False
    for i, tile in enumerate(tiles):
        if str(tile.get("id")) == str(tile_id):
            for key, val in updates.items():
                if key == "in_stock":
                    tile["in_stock"] = val
                    tile["stock"] = val
                else:
                    tile[key] = val
            tiles[i] = tile
            updated = True
            break
    if updated:
        save_tiles_to_db(tiles)
        return True
    return False

def add_new_tiles(new_tiles):
    current_tiles = load_tiles_from_db()
    existing_ids = []
    for t in current_tiles:
        try:
            existing_ids.append(int(t.get("id")))
        except:
            pass
    next_id = max(existing_ids) + 1 if existing_ids else 1
    
    for t in new_tiles:
        t["id"] = str(next_id)
        next_id += 1
        if "in_stock" not in t:
            t["in_stock"] = t.get("stock", True)
        if "stock" not in t:
            t["stock"] = t.get("in_stock", True)
        if "visible" not in t:
            t["visible"] = True
        if "hex_color" not in t:
            t["hex_color"] = t.get("hex_color", "#c9a96e")
        if "roughness" not in t:
            t["roughness"] = 0.1
        if "metalness" not in t:
            t["metalness"] = 0.0
        current_tiles.append(t)
        
    save_tiles_to_db(current_tiles)
    return True

def delete_single_tile(tile_id):
    tiles = load_tiles_from_db()
    filtered_tiles = [t for t in tiles if str(t.get("id")) != str(tile_id)]
    if len(filtered_tiles) != len(tiles):
        save_tiles_to_db(filtered_tiles)
        if supabase_client:
            try:
                supabase_client.table("tiles").delete().eq("id", str(tile_id)).execute()
            except Exception as e:
                print(f"Error deleting: {e}")
        return True
    return False

# --- SAMPLE REQUEST FUNCTIONS ---

def load_sample_requests():
    """Load sample requests from Supabase or local JSON file."""
    if supabase_client:
        try:
            res = supabase_client.table("sample_requests").select("*").execute()
            if res.data:
                return res.data
        except Exception as e:
            print(f"Supabase requests fetch error: {e}. Trying local file.")
            
    try:
        if os.path.exists(REQUESTS_FILE):
            with open(REQUESTS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception as e:
        print(f"Error reading requests file: {e}")
    return []

def save_sample_request(req):
    """Save customer sample request to active database."""
    req["created_at"] = time.strftime("%Y-%m-%d %H:%M:%S")
    
    # Save local
    try:
        current_requests = load_sample_requests()
        # Add auto increment ID
        req["id"] = len(current_requests) + 1
        current_requests.append(req)
        with open(REQUESTS_FILE, "w", encoding="utf-8") as f:
            json.dump(current_requests, f, indent=4)
    except Exception as e:
        print(f"Error saving local request: {e}")

    # Save Supabase
    if supabase_client:
        try:
            supabase_client.table("sample_requests").insert(req).execute()
            print("Successfully saved sample request to Supabase.")
        except Exception as e:
            print(f"Supabase requests insert error: {e}")

# --- AI SETTINGS FUNCTIONS ---

def load_ai_settings():
    """Load Noor AI system prompt behavior settings."""
    try:
        if os.path.exists(SETTINGS_FILE):
            with open(SETTINGS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception as e:
        print(f"Error reading AI settings: {e}")
    return DEFAULT_AI_SETTINGS

def save_ai_settings(settings):
    """Update Noor AI system prompt behavior settings."""
    try:
        with open(SETTINGS_FILE, "w", encoding="utf-8") as f:
            json.dump(settings, f, indent=4)
        return True
    except Exception as e:
        print(f"Error saving AI settings: {e}")
    return False
