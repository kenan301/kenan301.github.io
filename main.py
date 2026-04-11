from flask import Flask, render_template, request, send_from_directory, jsonify
import os
import random
import string
import threading
import time
import requests
from datetime import datetime

app = Flask(__name__)
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Müvəqqəti məlumat bazası (Kod -> Fayl Adı)
transfers = {}

def generate_six_digit_code():
    return ''.join(random.choices(string.digits, k=6))

# --- PİNG SİSTEMİ (Render-in yuxuya getməməsi üçün) ---
def keep_alive():
    # DİQQƏT: Bura Render-in sənə verdiyi real sayt linkini yaz!
    url = "https://senin-app-linkin.onrender.com" 
    
    # Serverin tam işə düşməsini gözləyirik (məsələn 30 saniyə)
    time.sleep(30)
    
    while True:
        try:
            response = requests.get(url)
            current_time = datetime.now().strftime("%H:%M:%S")
            print(f"[{current_time}] Ping uğurlu! Status: {response.status_code}")
        except Exception as e:
            print(f"Ping zamanı xəta: {e}")
        
        # 5 dəqiqədən bir dümsükləyirik
        time.sleep(300)

# Ping sistemini arxa planda başladırıq
t = threading.Thread(target=keep_alive, daemon=True)
t.start()
# -----------------------------------------------------

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload():
    if 'file' not in request.files:
        return jsonify({"error": "Fayl yoxdur"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "Fayl seçilməyib"}), 400

    code = generate_six_digit_code()
    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(file_path)
    
    # Kodu yadda saxlayırıq
    transfers[code] = file.filename
    
    return jsonify({"code": code, "filename": file.filename})

@app.route('/download/<code>')
def download(code):
    filename = transfers.get(code)
    if filename:
        return send_from_directory(UPLOAD_FOLDER, filename)
    return "Kod səhvdir və ya vaxtı bitib!", 404

if __name__ == '__main__':
    # Render-də işləməsi üçün portu dinamik təyin edirik
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host='0.0.0.0', port=port)
