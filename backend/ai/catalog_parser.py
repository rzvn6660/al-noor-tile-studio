import os
import json
import base64
import requests
from backend.ai.noor_agent import GEMINI_API_KEY, HAS_GENAI_SDK

# Fallback system if SDK import works
if HAS_GENAI_SDK:
    try:
        from google import genai
        from google.genai import types
    except ImportError:
        HAS_GENAI_SDK = False

PARSER_SYSTEM_INSTRUCTION = """
You are a luxury building materials AI catalog data extractor. 
You can extract tile information from catalog text or direct catalog/tile photographs using visual intelligence.
Read the provided unstructured catalog text or image, identify all tiles, marbles, or granite products present, and extract a structured JSON list.

You must follow these rules strictly:
1. Output MUST be a valid JSON array of objects with the exact schema below.
2. If prices are missing or unreadable, generate realistic pricing in AED per square meter (e.g. 180 to 650 AED) based on material quality.
3. Classify each product category strictly into one of: 'floor', 'wall', or 'accent'.
4. Generate a highly accurate hex_color code (e.g., #eae2cf for Cream Travertine, #1e1e1e for Nero Marquina black) corresponding to the material photo/description.
5. Generate physical PBR values:
   - roughness: between 0.02 (highly polished mirror) and 0.50 (rustic slate/lava stone).
   - metalness: between 0.0 (non-metallic) and 0.6 (metallic gold/silver crystal veins like Sahara Noir).
6. Shorten descriptions into premium showroom sales pitches (under 20 words).
7. Extract the page number (1-based integer, default to 1 if not readable or single page) where the product is found in the catalog text context, and estimate a confidence score (between 0.85 and 0.98).

Output Schema (JSON Array):
[
  {
    "name": "Calacatta Gold",
    "code": "CG-120",
    "category": "floor",
    "finish": "Polished",
    "dimensions": "60x120 cm",
    "price_aed": 320,
    "description": "Exquisite Italian white marble with rich golden sweeping veining.",
    "hex_color": "#f8f6f0",
    "roughness": 0.06,
    "metalness": 0.15,
    "extracted_page": 1,
    "extraction_confidence": 0.95
  }
]

Return ONLY raw JSON. No markdown tags, no ```json formatting, no explanation. Just the raw array.
"""

def clean_gemini_json(text):
    """Strip markdown backticks if Gemini includes them despite instructions."""
    text = text.strip()
    if text.startswith("```json"):
        text = text[7:]
    if text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()

def parse_catalog_text(catalog_text):
    """
    Send raw catalog text to Gemini 2.5 Flash to extract high-fidelity structured tile data.
    """
    prompt = f"Analyze this unstructured tile catalog text and extract structural products:\n\n{catalog_text[:8000]}"
    
    if not GEMINI_API_KEY:
        print("GEMINI_API_KEY missing. Cannot parse catalog via AI. Returning mock parsed list.")
        return generate_mock_parsed_data(catalog_text)

    # 1. Official Client
    if HAS_GENAI_SDK:
        try:
            client = genai.Client(api_key=GEMINI_API_KEY)
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=PARSER_SYSTEM_INSTRUCTION,
                    temperature=0.2,
                    response_mime_type="application/json"
                )
            )
            cleaned = clean_gemini_json(response.text)
            return json.loads(cleaned)
        except Exception as e:
            print(f"Error parsing catalog via google-genai SDK: {e}. Trying REST API.")

    # 2. REST API Direct Call
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
        headers = {"Content-Type": "application/json"}
        payload = {
            "contents": [
                {"role": "user", "parts": [{"text": prompt}]}
            ],
            "systemInstruction": {
                "parts": [{"text": PARSER_SYSTEM_INSTRUCTION}]
            },
            "generationConfig": {
                "temperature": 0.2,
                "responseMimeType": "application/json"
            }
        }
        res = requests.post(url, headers=headers, json=payload, timeout=20)
        if res.status_code == 200:
            data = res.json()
            raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
            cleaned = clean_gemini_json(raw_text)
            return json.loads(cleaned)
        else:
            print(f"Gemini Catalog REST API returned status {res.status_code}")
    except Exception as e:
        print(f"Error parsing catalog via REST API: {e}")

    return generate_mock_parsed_data(catalog_text)

def parse_catalog_image(image_path):
    """
    Feed catalog image or tile photograph directly to Gemini 2.5 Flash Multimodal Vision API.
    Extracts structured JSON tile entries containing names, categories, and dynamic PBR values.
    """
    if not os.path.exists(image_path):
        print(f"Catalog Parser: Image file not found: {image_path}")
        return generate_mock_parsed_data("image")

    if not GEMINI_API_KEY:
        print("GEMINI_API_KEY missing. Cannot parse catalog image via Vision AI.")
        return generate_mock_parsed_data("image")

    # Determine correct mime type
    mime = "image/jpeg"
    if image_path.lower().endswith(".png"):
        mime = "image/png"
    elif image_path.lower().endswith(".webp"):
        mime = "image/webp"

    # 1. Official SDK Multimodal
    if HAS_GENAI_SDK:
        try:
            client = genai.Client(api_key=GEMINI_API_KEY)
            with open(image_path, "rb") as f:
                image_bytes = f.read()

            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=[
                    types.Part.from_bytes(data=image_bytes, mime_type=mime),
                    "Identify all tile, marble, or granite materials present in this catalog photograph and extract their details."
                ],
                config=types.GenerateContentConfig(
                    system_instruction=PARSER_SYSTEM_INSTRUCTION,
                    temperature=0.2,
                    response_mime_type="application/json"
                )
            )
            cleaned = clean_gemini_json(response.text)
            return json.loads(cleaned)
        except Exception as e:
            print(f"Error parsing catalog image via SDK: {e}. Trying REST API fallback.")

    # 2. REST API Direct Call (Base64)
    try:
        with open(image_path, "rb") as f:
            image_bytes = f.read()
        base64_image = base64.b64encode(image_bytes).decode('utf-8')

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
        headers = {"Content-Type": "application/json"}
        payload = {
            "contents": [
                {
                    "parts": [
                        {
                            "inlineData": {
                                "mimeType": mime,
                                "data": base64_image
                            }
                        },
                        {
                            "text": "Identify all tile, marble, or granite materials present in this catalog photograph and extract their details into JSON."
                        }
                    ]
                }
            ],
            "systemInstruction": {
                "parts": [{"text": PARSER_SYSTEM_INSTRUCTION}]
            },
            "generationConfig": {
                "temperature": 0.2,
                "responseMimeType": "application/json"
            }
        }
        res = requests.post(url, headers=headers, json=payload, timeout=25)
        if res.status_code == 200:
            data = res.json()
            raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
            cleaned = clean_gemini_json(raw_text)
            return json.loads(cleaned)
        else:
             print(f"Gemini Vision REST API returned status code {res.status_code}")
    except Exception as e:
         print(f"Error parsing image via Vision REST API: {e}")

    return generate_mock_parsed_data("image")

def generate_mock_parsed_data(catalog_text):
    """Graceful mock tile generator if Gemini key is offline."""
    print("Catalog Parser: Generating high-end mockup tiles based on catalog name hints.")
    text = catalog_text.lower()
    
    mock_list = []
    
    if "travertine" in text or "image" in text:
        mock_list.append({
            "name": "Classic Travertine",
            "code": "TRA-01",
            "category": "floor",
            "finish": "Honed",
            "dimensions": "60x60 cm",
            "price_aed": 190,
            "description": "Authentic Turkish travertine with natural textured surface pores.",
            "hex_color": "#d9c3b0",
            "roughness": 0.35,
            "metalness": 0.0
        })
    if "onyx" in text or "lux" in text or "image" in text:
        mock_list.append({
            "name": "Onyx Verde",
            "code": "ONX-VE",
            "category": "accent",
            "finish": "Polished",
            "dimensions": "80x80 cm",
            "price_aed": 750,
            "description": "Luminous light green onyx with translucent amber sweeping waves.",
            "hex_color": "#a8c3a0",
            "roughness": 0.03,
            "metalness": 0.2
        })
        
    mock_list.extend([
        {
            "name": "Royal Beige Marble",
            "code": "RBM-612",
            "category": "floor",
            "finish": "Polished",
            "dimensions": "60x120 cm",
            "price_aed": 145,
            "description": "Premium beige Turkish marble with sweeping pearl cream veining.",
            "hex_color": "#decfa6",
            "roughness": 0.10,
            "metalness": 0.0
        },
        {
            "name": "Starlight Black",
            "code": "STB-30",
            "category": "wall",
            "finish": "Glossy",
            "dimensions": "30x90 cm",
            "price_aed": 220,
            "description": "Pure black ceramic wall tile embedded with micro silver metallic flecks.",
            "hex_color": "#111111",
            "roughness": 0.08,
            "metalness": 0.45
        }
    ])
    
    return mock_list
