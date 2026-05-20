import urllib.parse

def generate_whatsapp_link(number, name, phone, emirate, address, floor_tile, wall_tile):
    """
    Generate pre-filled wa.me links for UAE customer sample requests.
    """
    # Sanitize phone number (strip whitespace, +, non-digits)
    clean_number = "".join(filter(str.isdigit, str(number)))
    if not clean_number:
        clean_number = "971501234567" # default UAE mock number
        
    text = (
        f"Hi Al-Noor! 🌟 I would like to request free tile samples:\n\n"
        f"🪨 Floor Tile: {floor_tile}\n"
        f"🧱 Wall Tile: {wall_tile}\n\n"
        f"📋 My Details:\n"
        f"Name: {name}\n"
        f"Phone: {phone}\n"
        f"Emirate: {emirate}\n"
        f"Address: {address}\n\n"
        f"Please confirm availability and delivery time. Shukran! 🙏"
    )
    
    encoded_text = urllib.parse.quote(text)
    return f"https://wa.me/{clean_number}?text={encoded_text}"
