# Ingestion module to download PDFs (files/folders) and extract text for AI parsing
import os
import re
import shutil
import requests
import gdown
import pdfplumber
import fitz # PyMuPDF

TEMP_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "temp")

if not os.path.exists(TEMP_DIR):
    os.makedirs(TEMP_DIR)

def extract_gdrive_id(url):
    """
    Extract Google Drive File or Folder ID from standard sharing URLs.
    """
    # Pattern for folder links: /folders/FOLDER_ID
    match_folder = re.search(r'/folders/([a-zA-Z0-9_-]+)', url)
    if match_folder:
        return match_folder.group(1), True
        
    # Pattern for file links: /file/d/FILE_ID
    match_d = re.search(r'/file/d/([a-zA-Z0-9_-]+)', url)
    if match_d:
        return match_d.group(1), False
        
    # Pattern for id=FILE_ID
    match_id = re.search(r'id=([a-zA-Z0-9_-]+)', url)
    if match_id:
        return match_id.group(1), False
        
    return None, False

def download_gdrive_pdf(url):
    """
    Download PDF or all PDFs inside a Google Drive folder link.
    Returns path to downloaded file (or a consolidated text file path if it was a folder), or None on failure.
    """
    gdrive_id, is_folder = extract_gdrive_id(url)
    if not gdrive_id:
        print(f"Ingestion: Invalid Google Drive link: {url}")
        return None

    if is_folder:
        # Create folder destination
        folder_dest = os.path.join(TEMP_DIR, f"gdrive_folder_{gdrive_id}")
        if os.path.exists(folder_dest):
            shutil.rmtree(folder_dest)
        os.makedirs(folder_dest)
        
        print(f"Ingestion: Detected Google Drive FOLDER ID: {gdrive_id}. Downloading folder files...")
        try:
            # Download folder recursively using gdown
            gdown.download_folder(url=url, output=folder_dest, quiet=True, remaining_ok=True)
            
            # Find and parse all PDFs in the folder, consolidate text
            consolidated_text = ""
            pdf_count = 0
            for root, dirs, files in os.walk(folder_dest):
                for f in files:
                    if f.lower().endswith('.pdf'):
                        pdf_path = os.path.join(root, f)
                        print(f"Ingestion: Parsing folder PDF: {pdf_path}")
                        pdf_text = extract_text_from_pdf(pdf_path)
                        if pdf_text:
                            consolidated_text += f"\n--- CATALOG FILE: {f} ---\n" + pdf_text
                            pdf_count += 1
            
            # Clean folder
            shutil.rmtree(folder_dest)
            
            if consolidated_text:
                # Save consolidated text to temp file and return it
                text_file_path = os.path.join(TEMP_DIR, f"folder_consolidated_{gdrive_id}.txt")
                with open(text_file_path, "w", encoding="utf-8") as tf:
                    tf.write(consolidated_text)
                print(f"Ingestion: Consolidated text from {pdf_count} PDFs inside folder successfully.")
                return text_file_path
                
        except Exception as e:
            print(f"Ingestion: Google Drive folder download failed: {e}")
            if os.path.exists(folder_dest):
                 shutil.rmtree(folder_dest)
        return None

    # Single File Download Flow
    download_url = f"https://drive.google.com/uc?export=download&id={gdrive_id}"
    dest_path = os.path.join(TEMP_DIR, f"gdrive_{gdrive_id}.pdf")
    
    print(f"Ingestion: Attempting single file download: {gdrive_id}")
    try:
        output = gdown.download(download_url, dest_path, quiet=True, fuzzy=True)
        if output and os.path.exists(dest_path):
            print(f"Ingestion: Successfully downloaded PDF via gdown to {dest_path}")
            return dest_path
    except Exception as e:
        print(f"Ingestion: gdown failed: {e}. Trying requests fallback...")

    # Direct Request Fallback
    try:
        res = requests.get(download_url, stream=True, timeout=30)
        if res.status_code == 200:
            with open(dest_path, 'wb') as f:
                for chunk in res.iter_content(chunk_size=8192):
                    f.write(chunk)
            if os.path.exists(dest_path) and os.path.getsize(dest_path) > 1024:
                return dest_path
    except Exception as e:
        print(f"Ingestion: Direct request failed: {e}")
        
    return None

def extract_text_from_pdf(pdf_path):
    """
    Extract raw text from PDF or if it's already a consolidated text file, return it directly.
    """
    if not pdf_path or not os.path.exists(pdf_path):
        return ""
        
    # Check if it's already a consolidated text file from a folder
    if pdf_path.endswith('.txt'):
        try:
            with open(pdf_path, 'r', encoding='utf-8') as f:
                return f.read()
        except Exception as e:
            print(f"Ingestion: Error reading txt file: {e}")
            return ""

    extracted_text = ""
    # 1. Try PyMuPDF (fitz)
    try:
        doc = fitz.open(pdf_path)
        pages_text = []
        max_pages = min(len(doc), 10)
        for i in range(max_pages):
            pages_text.append(doc[i].get_text())
        extracted_text = "\n".join(pages_text)
        if len(extracted_text.strip()) > 100:
            return extracted_text
    except Exception as e:
        print(f"Ingestion: PyMuPDF failed: {e}")

    # 2. Try pdfplumber
    try:
        with pdfplumber.open(pdf_path) as pdf:
            pages_text = []
            max_pages = min(len(pdf.pages), 10)
            for i in range(max_pages):
                pages_text.append(pdf.pages[i].extract_text() or "")
            extracted_text = "\n".join(pages_text)
            if len(extracted_text.strip()) > 100:
                return extracted_text
    except Exception as e:
        print(f"Ingestion: pdfplumber failed: {e}")

    return extracted_text

def clean_temp_file(file_path):
    """Clean up downloaded temp file or folder text."""
    if file_path and os.path.exists(file_path):
        try:
            os.remove(file_path)
        except Exception as e:
            print(f"Ingestion: Error removing file {file_path}: {e}")
