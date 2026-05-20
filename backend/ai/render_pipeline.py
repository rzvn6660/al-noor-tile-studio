import os
import io
import base64
import requests
from PIL import Image

HF_API_KEY = os.environ.get("VITE_HF_API_KEY") or os.environ.get("HF_API_KEY")

# High-quality preset luxury rooms as immediate visual fallbacks if no key or error
PRESET_ROOM_IMAGES = {
    "bathroom": "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=800&q=80",
    "living": "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80",
    "kitchen": "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80"
}

def generate_photorealistic_render(room_type, floor_tile_name, wall_tile_name, base64_screenshot=None, custom_prompt=None, style_preset=None):
    """
    Generate photorealistic luxury room render using Hugging Face Stable Diffusion.
    If no key or API error, returns a high-quality preset Unsplash architectural photograph.
    """
    style_details = ""
    if style_preset == "palace":
        style_details = "traditional Arabian luxury palace theme, royal gold accents, warm ambient glowing chandeliers, arches, majestic atmosphere"
    elif style_preset == "penthouse":
        style_details = "contemporary Dubai skyscraper penthouse theme, spectacular night skyline view through massive panoramic glass windows, modern LED lighting, high contrast monochromatic styling"
    elif style_preset == "biophilic":
        style_details = "biophilic design, indoor gardens, hanging ivy, lush green potted plants, bright natural sunlight casting soft shadows, organic wood frames"
    elif style_preset == "minimalist":
        style_details = "Scandinavian minimalist zen theme, clean lines, uncluttered layout, matte textures, soft neutral tones, minimal brass fittings"
    else:
        style_details = "modern luxury interior design theme, premium UAE villa architecture"

    imagination_part = f", featuring {custom_prompt}" if custom_prompt else ""

    prompt = (
        f"masterpiece luxury photorealistic interior design, modern {room_type} room with "
        f"exquisite high-gloss {floor_tile_name} marble floor tiles and {wall_tile_name} marble wall tiles, "
        f"{style_details}{imagination_part}, 8k resolution, architectural photography, ultra detailed, premium furniture, stunning volumetric lighting"
    )
    
    if not HF_API_KEY:
        print("HF API Key missing. Returning preset high-end render.")
        return {
            "success": True, 
            "image_url": PRESET_ROOM_IMAGES.get(room_type, PRESET_ROOM_IMAGES["living"]), 
            "is_fallback": True,
            "style_preset": style_preset,
            "custom_prompt": custom_prompt
        }
        
    try:
        # We can use FLUX.1-schnell or stable-diffusion-3-medium
        API_URL = "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell"
        headers = {"Authorization": f"Bearer {HF_API_KEY}"}
        payload = {"inputs": prompt, "parameters": {"guidance_scale": 7.5, "num_inference_steps": 4}}
        
        response = requests.post(API_URL, headers=headers, json=payload, timeout=25)
        
        if response.status_code == 200:
            # Hugging Face returns raw image bytes
            img_bytes = response.content
            # Convert bytes to base64
            encoded_img = base64.b64encode(img_bytes).decode('utf-8')
            return {
                "success": True,
                "image_data": f"data:image/jpeg;base64,{encoded_img}",
                "is_fallback": False,
                "style_preset": style_preset,
                "custom_prompt": custom_prompt
            }
        else:
            print(f"HF API returned status {response.status_code}: {response.text}")
            # Try a quick fallback model (Stable Diffusion 1.5 or 2.1)
            API_URL_SD = "https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5"
            response_sd = requests.post(API_URL_SD, headers=headers, json={"inputs": prompt}, timeout=15)
            if response_sd.status_code == 200:
                encoded_img = base64.b64encode(response_sd.content).decode('utf-8')
                return {
                    "success": True,
                    "image_data": f"data:image/jpeg;base64,{encoded_img}",
                    "is_fallback": False,
                    "style_preset": style_preset,
                    "custom_prompt": custom_prompt
                }
    except Exception as e:
        print(f"Exception in HF rendering pipeline: {e}")
        
    # Return preset Unsplash URL as graceful visual fallback
    return {
        "success": True,
        "image_url": PRESET_ROOM_IMAGES.get(room_type, PRESET_ROOM_IMAGES["living"]),
        "is_fallback": True,
        "style_preset": style_preset,
        "custom_prompt": custom_prompt
    }

