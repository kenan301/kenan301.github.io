import os
import random
import string
from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
from supabase import create_client, Client

app = Flask(__name__)
CORS(app)

# --- SUPABASE AYARLARI ---
SUPABASE_URL = "https://suxmikpwdztrwztzsctr.supabase.co"
SUPABASE_KEY = "sb_publishable_cnoe7zM-fg-x7CgXx0TFBw_0V26nUgW"
supabase: Client = create_client(url, key)

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def generate_six_digit_code():
    return ''.join(random.choices(string.digits, k=6))

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload():
    if 'file' not in request.files:
        return jsonify({"error": "Fayl yoxdur"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "Fayl secilmiyib"}), 400

    code = generate_six_digit_code()
    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(file_path)

    data = {
        "code": code,
        "filename": file.filename
    }
    try:
        supabase.table("transfers").insert(data).execute()
        return jsonify({"code": code, "filename": file.filename})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/download/<code>')
def download(code):
    try:
        response = supabase.table("transfers").select("filename").eq("code", code).execute()
        
        if response.data and len(response.data) > 0:
            filename = response.data[0]['filename']
            return send_from_directory(UPLOAD_FOLDER, filename)
        else:
            return "Kod tapilmadi!", 404
    except Exception as e:
        return f"Xeta bas verdi: {str(e)}", 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
