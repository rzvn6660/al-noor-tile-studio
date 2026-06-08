# Al-Noor Tile Studio
### *Next-Generation Zero-Gravity 3D Showroom & Advanced AI Generative Design Suite*

Al-Noor Tile Studio is an immersive, high-fidelity 3D material showroom and generative design platform custom-tailored for luxury Middle Eastern architectural finishes. It enables customers to visualize premium tiles, slabs, and wall claddings within an interactive physical space, while empowering administrators with advanced AI ingestion and recommendation tools.

---

## 🌌 Key Highlights & Architectural Features

### 1. Interactive Zero-Gravity 3D Showroom
*   **Three.js Simulation Engine:** Leverages a WebGL-based Three.js rendering pipeline complete with custom PBR materials, multi-point studio lighting, high-gloss floor reflections, and custom starfields / gold dust particle system loops.
*   **Dynamic Physics Controls:** Features standard physics overrides allowing clients to toggle gravity states (hovering / falling), trigger tile explosions, and adjust orbital damping.
*   **Perspective Swatches:** Seamlessly renders procedural veined marble, high-polished granite, and matte slate slabs directly in coordinate space.

### 2. AI Dream Room Studio (Dual-Engine Pipeline)
*   **Generative Room Renderer:** Connects to Hugging Face FLUX.1-Schnell and Stable Diffusion 1.5 endpoints to synthesize photorealistic interior designs based on the customer’s selected tiles and custom text inputs.
*   **Zero-Latency Canvas Cladding Engine:** In constrained network environments, a client-side compositing canvas automatically executes high-fidelity perspective warp maps. Using a `'multiply'` overlay blend mode, it clads floor and wall coordinates with custom marble textures while preserving original lighting, shadows, and ambient occlusion.
*   **Aesthetic Style Presets:** Features curated UAE architectural lighting and grading filters:
    *   🕌 **Al-Noor Palace:** Traditional Arabian luxury arches with glowing golden chandeliers.
    *   🏙️ **Dubai Penthouse:** High-contrast monochromatic night skyscraper skylines.
    *   🌿 **Biophilic Oasis:** Sun-drenched indoor gardens with hanging biophilic ivies.
    *   🧊 **Nordic Minimalist:** Sleek matte slate, clean wood borders, and neutral tones.

### 3. Noor AI Showroom Advisor
*   **Gemini 2.5 Integration:** A conversational assistant powered by Google Gemini 2.5 Flash, trained on local luxury UAE villa layouts, slab dimensions, coverage calculations (+15% wastage factors), and slip ratings.
*   **Real-time Admin Prompts:** Noor's system prompt is dynamically modifiable in the admin dashboard to match active campaigns or seasonal branding.

### 4. Advanced PDF Catalog Ingestion Pipeline
*   **AI PDF Image Extraction:** Instantly parses multi-page product catalogs uploaded as local files or Google Drive share links.
*   **Visual Entity Matching:** Leverages OCR and vision intelligence to extract product names, SKU dimensions, AED prices, and automatically matches extracted tile descriptions with high-quality catalog images for immediate synchronization.

### 5. Glassmorphic Administration Portal
*   **Analytics Control Center:** Real-time metrics tracking catalog counts, hidden inventories, and popular materials.
*   **Customer Sample Requests:** Directly captures physical sample requests and generates instant, pre-filled WhatsApp Business APIs (`wa.me`) for dispatch.

---

## 🛠️ Technology Stack & Dependencies

*   **Backend:** Python 3.10+, Flask, Pillow (PIL), PyMuPDF (fitz), Google Generative AI (Gemini 2.5), Hugging Face Inference API, Supabase Python Client.
*   **Frontend (Interactive):** Three.js (r128), OrbitControls, GSAP (GreenSock), Vanilla JS, CSS Glassmorphic Layouts.
*   **Frontend (Modular React):** React 19, Vite, Zustand, TailwindCSS (for secondary builds).

---

## ⚙️ Environment Variables Setup

Create a `.env` file in the root directory to store credentials securely:

```env
# Google Gemini AI Key
GEMINI_API_KEY=your_gemini_api_key_here

# Hugging Face Inference Key
HF_API_KEY=your_hugging_face_api_key_here

# Supabase Credentials (Optional sync layer)
SUPABASE_URL=https://your-supabase-url.supabase.co
SUPABASE_KEY=your-supabase-anon-key-here

# WhatsApp Business Dispatch
WHATSAPP_NUMBER=**********
```

---

## 🚀 Installation & Launch Guide

Ensure you have **Python 3.10+** and **Node.js v18+** installed.

### 1. Initialize Python Backend
Navigate to the root directory and install dependencies:
```bash
pip install -r requirements.txt
```
*Note: If no `requirements.txt` exists, install dependencies manually via:*
```bash
pip install flask flask-cors pillow pymupdf requests supabase google-generativeai python-dotenv
```

Start the Flask middleware:
```bash
python backend/app.py
```
The server will boot on `http://localhost:5000` serving both the Client Visualizer and the Admin Control Center.

### 2. Initialize React Frontend (Vite)
Open a separate terminal and initialize the Node package manager:
```bash
npm install
npm run dev
```
Open `http://localhost:5173` to view the modular React interface.

---

## 📁 System Architecture & Directory Tree

```
al-noor-tile-studio/
│
├── backend/                      # Python Flask Server & AI Middleware
│   ├── ai/                       # Agentic Intelligence & Generative Pipelines
│   │   ├── catalog_parser.py     # AI catalog parser (Gemini-Vision)
│   │   ├── noor_agent.py         # Customer advisory chatbot (Gemini 2.5)
│   │   └── render_pipeline.py    # Hugging Face room designer pipeline
│   │
│   ├── database/                 # Sync layer & databases
│   │   ├── ai_settings.json      # Dynamic Noor settings
│   │   ├── local_db.json         # Local tile products JSON
│   │   └── tiles_db.py           # Supabase & JSON connector
│   │
│   ├── routes/                   # Flask Router Blueprints
│   │   ├── admin_routes.py       # Catalog uploads, requests, configurations
│   │   └── customer_routes.py    # Chatbots, room visualizer renderer
│   │
│   ├── static/                   # Static browser files
│   │   ├── css/style.css         # Custom premium UAE design styles
│   │   └── js/                   # Three.js & UI modules
│   │       ├── scene.js          # WebGL viewport initialization
│   │       ├── galaxy.js         # Particle drifts & orbits
│   │       ├── room.js           # 3D Furniture slabs & textures
│   │       └── ui.js             # Canvas Cladding Engine & UI controls
│   │
│   └── templates/                # Server-Side HTML layouts
│       ├── admin.html            # Glassmorphic admin control dashboard
│       └── index.html            # Immersive customer visualizer
│
├── src/                          # Modular React Source files
└── package.json                  # Node scripts and dev dependencies
```

---

## 📄 License & Intellectual Property
Designed exclusively for premium building material suppliers in the United Arab Emirates. All assets, 3D modeling scripts, and canvas composites are under strict commercial protection.
