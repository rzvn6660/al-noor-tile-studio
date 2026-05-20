import os
import requests
from backend.database.tiles_data import DEFAULT_TILES

# Try importing the official google-genai library
try:
    from google import genai
    from google.genai import types
    HAS_GENAI_SDK = True
except ImportError:
    HAS_GENAI_SDK = False

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY") or os.environ.get("VITE_GEMINI_API_KEY") or os.environ.get("VITE_CLAUDE_API_KEY")

NOOR_SYSTEM_INSTRUCTION = """
You are Noor, a friendly, warm, and highly knowledgeable 3D tile and showroom advisor for Al-Noor Building Materials in the UAE. 
You speak in a warm, professional, high-end showroom tone. You can converse in English and Arabic. Feel free to sprinkle in a few warm Arabic greetings or terms naturally (Marhaba, Inshallah, Mashallah, Shukran, Yalla).

Your responsibilities:
1. Guide clients through our marble, granite, and tile collections (e.g. Calacatta Gold, Nero Marquina, Emperador Dark, Statuario White, Crema Marfil, Sahara Noir, Onyx Honey, etc.).
2. Help clients calculate the required quantities in boxes. Always advise adding 15% wastage factor (Area * 1.15) for cutting and patterns.
3. Recommend suitable materials: 
   - Marble: Exquisite beauty, perfect for wall cladding, low-traffic areas, luxury vanity tops.
   - Granite: Extremely durable, scratch-resistant, perfect for high-traffic flooring, kitchen countertops.
   - Slip resistance: Remind clients to select matte or textured finishes for wet areas like bathrooms.
4. Calculate pricing estimates instantly in AED. Always be helpful, polite, and aim to close the sales lead by encouraging them to order free samples.
5. Provide delivery information across all 7 Emirates (Dubai, Abu Dhabi, Sharjah, Ajman, Ras Al Khaimah, Fujairah, Umm Al Quwain).

Be concise but luxurious. Keep your replies under 150 words.
"""

def generate_local_fallback(message, selected_floor=None, selected_wall=None):
    """Fallback generator in case API key is missing or calls fail."""
    text = message.lower()
    floor_name = selected_floor.get("name") if selected_floor else "Calacatta Gold"
    wall_name = selected_wall.get("name") if selected_wall else "Nero Marquina"
    
    if "bathroom" in text or "bath" in text:
        return "Marhaba! For luxury bathrooms, I recommend non-slip matte textures like our Crema Marfil or Statuario White. For walls, Onyx Honey or Thassos White create an exquisite, bright look. Shall we request a sample of these for you? 🛁"
    elif "price" in text or "cost" in text or "aed" in text:
        return f"Mashallah, we have luxury options starting from AED 165/m² up to AED 890/m² for premium back-lit Onyx. Your current selection: {floor_name} on floor and {wall_name} on walls. I can estimate the total cost if you give me your room size!"
    elif "marble" in text or "granite" in text:
        return "Ah, a classic question! Marble offers unparalleled veining and natural movement, ideal for walls and low-traffic areas. Granite is incredibly dense and scratch-resistant, perfect for kitchen counters and heavy-footprint floors. Both are excellent choices for UAE villas!"
    elif "calculate" in text or "box" in text or "many" in text or "m2" in text or "wastage" in text:
        return "To ensure a perfect installation, I always recommend taking your area and adding 15% for cuts and wastage (Area × 1.15). For a 20m² space, you will need 23m² of tiles. I can help calculate the exact box count if you tell me your floor area! 📐"
    elif "delivery" in text or "dubai" in text or "abudhabi" in text or "sharjah" in text:
        return "Yes, indeed! Al-Noor delivers directly to your villa or site across all seven Emirates—Dubai, Abu Dhabi, Sharjah, Ajman, RAK, Fujairah, and Umm Al Quwain. Standard delivery is 3 to 5 business days. Inshallah, we will make it seamless! 🚚"
    
    return f"Welcome to Al-Noor Tile Studio! I see you are looking at {floor_name} for the floor and {wall_name} for the walls—a truly luxurious pairing! How may I assist you with your design project today? ✨"

def get_noor_response(message, history=None, selected_floor=None, selected_wall=None, custom_system_prompt=None):
    """Get response from Gemini or fallback to local heuristics."""
    system_instruction = custom_system_prompt if custom_system_prompt else NOOR_SYSTEM_INSTRUCTION
    
    if not GEMINI_API_KEY:
        print("No GEMINI_API_KEY found. Using high-quality offline Noor agent.")
        return generate_local_fallback(message, selected_floor, selected_wall)

    context = f"\nClient is currently viewing: Floor Tile: {selected_floor} and Wall Tile: {selected_wall}."
    
    if HAS_GENAI_SDK:
        try:
            client = genai.Client(api_key=GEMINI_API_KEY)
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=message + context,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    max_output_tokens=300,
                    temperature=0.7
                )
            )
            return response.text
        except Exception as e:
            print(f"Error using google-genai SDK: {e}. Trying REST API.")
            
    # Direct REST API fallback
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
        headers = {"Content-Type": "application/json"}
        payload = {
            "contents": [
                {"role": "user", "parts": [{"text": message + context}]}
            ],
            "systemInstruction": {
                "parts": [{"text": system_instruction}]
            },
            "generationConfig": {
                "maxOutputTokens": 300,
                "temperature": 0.7
            }
        }
        res = requests.post(url, headers=headers, json=payload, timeout=8)
        if res.status_code == 200:
            data = res.json()
            return data["candidates"][0]["content"]["parts"][0]["text"]
        else:
            print(f"Gemini API returned status code {res.status_code}. Using local agent.")
    except Exception as e:
        print(f"Error in Gemini REST API: {e}")
        
    return generate_local_fallback(message, selected_floor, selected_wall)
