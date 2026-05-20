import os
from supabase import create_client, Client
from backend.database.tiles_data import DEFAULT_TILES

SUPABASE_URL = os.environ.get("VITE_SUPABASE_URL") or os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("VITE_SUPABASE_ANON_KEY") or os.environ.get("SUPABASE_KEY")

supabase_client: Client = None

if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("Connected to Supabase successfully.")
    except Exception as e:
        print(f"Error initializing Supabase client: {e}")
else:
    print("Supabase URL or Key not found in environment. Using default local catalog.")

def get_all_tiles():
    """Fetch all tiles from Supabase or fallback to DEFAULT_TILES if offline/not configured."""
    if supabase_client:
        try:
            response = supabase_client.table("tiles").select("*").execute()
            if response.data:
                return response.data
        except Exception as e:
            print(f"Error fetching tiles from Supabase: {e}. Falling back to default list.")
    return DEFAULT_TILES

def get_tile_by_id(tile_id):
    """Retrieve a single tile details."""
    tiles = get_all_tiles()
    for t in tiles:
        if str(t.get("id")) == str(tile_id):
            return t
    return None
