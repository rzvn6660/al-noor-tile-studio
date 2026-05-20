import os
import sys
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

# Load env variables from root directory .env or backend .env
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))
load_dotenv()

# Add parent directory to path so imports work correctly
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

app = Flask(
    __name__,
    static_folder=os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static'),
    template_folder=os.path.join(os.path.dirname(os.path.abspath(__file__)), 'templates')
)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "al_noor_studio_secret_key_129847")
CORS(app)

# Import modular blueprints
from backend.routes.admin_routes import admin_bp
from backend.routes.customer_routes import customer_bp

# Register Blueprints
app.register_blueprint(admin_bp)
app.register_blueprint(customer_bp)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
