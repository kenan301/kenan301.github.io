// 1. PREMIERE PRO YÜKLƏMƏ FUNKSİYASI
function downloadPremiere() {
    window.location.href = "setup.exe"; // Sənin dediyin o setup faylı
}

// 2. FAYL TRANSFER SİSTEMİ (6 RƏQƏMLİ KOD VƏ QR)
function startTransfer() {
    const fileInput = document.getElementById('fileInput');
    const btn = document.getElementById('sendBtn');
    
    if (fileInput.files.length === 0) {
        alert("Fayl seçin!");
        return;
    }

    btn.disabled = true;
    btn.innerText = "Gözləyin...";

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    // Python Flask serverinə sorğu
    fetch('https://c3ab08e42f49e3b1-158-181-46-82.serveousercontent.com
', {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        // Nəticəni göstər
        document.getElementById('result').style.display = 'block';
        document.getElementById('codeDisplay').innerText = data.code;
        
        // QR Kod (Təmiz və xətasız)
        const qrContainer = document.getElementById('qrcode');
        qrContainer.innerHTML = ""; 
        new QRCode(qrContainer, {
            text: window.location.origin + "/download/" + data.code,
            width: 150,
            height: 150
        });

        btn.innerText = "Hazırdır!";
    })
    .catch(err => {
        console.error("Xəta:", err);
        alert("Serverlə əlaqə kəsildi!");
        btn.disabled = false;
        btn.innerText = "Yenidən yoxla";
    });
}
