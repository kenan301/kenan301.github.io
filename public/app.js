const socket = io();

// Yetkilendirme Tetikleyicileri
function executeLogin(e) {
    e.preventDefault();
    const username = document.getElementById('aliasInput').value.trim();
    if(username) {
        socket.emit('auth-user', { username: username });
    }
}

function triggerGoogleAuth() {
    // Google ile giriş simülasyonu
    socket.emit('auth-user', { username: "Google_User" });
}

socket.on('auth-success', (user) => {
    document.getElementById('authGate').style.display = 'none';
    document.getElementById('myUid').innerText = user.username;
    document.getElementById('myAv').innerText = user.avatar;
});

// Yazılı Mesaj Akışı
function pushMessage(e) {
    if (e.key === 'Enter') {
        const input = document.getElementById('messageField');
        if (input.value.trim() === '') return;
        socket.emit('msg-send', input.value);
        input.value = '';
    }
}

socket.on('msg-receive', (data) => {
    const stream = document.getElementById('chatStream');
    stream.innerHTML += `
        <div class="msg-row">
            <div class="avatar">${data.avatar}</div>
            <div class="msg-body">
                <h5>${data.username} <span>${data.time}</span></h5>
                <p>${escapeHTML(data.text)}</p>
            </div>
        </div>
    `;
    stream.scrollTop = stream.scrollHeight;
});

// Ses Kanalları Yönetimi
function joinVoice(roomName, elementId) {
    socket.emit('voice-join', roomName);
    document.getElementById('voiceIndicator').style.display = 'flex';
    document.getElementById('currentRoomTag').innerText = roomName;
    
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.getElementById(elementId).classList.add('active');
}

function leaveVoice() {
    socket.emit('voice-leave');
    document.getElementById('voiceIndicator').style.display = 'none';
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.getElementById('voiceUserStack').innerHTML = `<div style="padding:12px; font-size:0.85rem; color:var(--text-dark);">Kanal boş.</div>`;
}

socket.on('voice-room-update', (users) => {
    const stack = document.getElementById('voiceUserStack');
    if(users.length === 0) {
        stack.innerHTML = `<div style="padding:12px; font-size:0.85rem; color:var(--text-dark);">Kanal boş.</div>`;
        return;
    }
    stack.innerHTML = users.map(u => `
        <div class="nav-item" style="color: var(--text-pure)">
            <div class="avatar" style="width:24px; height:24px; font-size:10px;">${u.avatar}</div>
            ${u.username}
        </div>
    `).join('');
});

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}
