const API_BASE = '/api/files';

// State
let currentFileId = localStorage.getItem('lastFileId') || '';

// DOM Elements
const uploadForm = document.getElementById('upload-form');
const actionForm = document.getElementById('action-form');
const fileIdInput = document.getElementById('file-id-input');
const responseArea = document.getElementById('response-area');
const fileInput = document.getElementById('file-input');
const responseContent = document.getElementById('response-content');

// Init
if (currentFileId) {
    fileIdInput.value = currentFileId;
}

// Helpers
function log(data, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const entry = document.createElement('div');
    entry.className = type === 'error' ? 'error' : 'success';
    entry.innerHTML = `<strong>[${timestamp}]</strong> ${JSON.stringify(data, null, 2)}`;
    responseContent.innerHTML = '';
    responseContent.appendChild(entry);
    console.log(data);
}

function updateFileId(id) {
    currentFileId = id;
    localStorage.setItem('lastFileId', id);
    fileIdInput.value = id;
}

// Event Listeners
uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const file = fileInput.files[0];
    if (!file) return alert('Selecciona un archivo primero');

    const formData = new FormData();
    formData.append('file', file);

    try {
        const res = await fetch(API_BASE, {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        if (res.ok) {
            log(data, 'success');
            if (data.file && data.file.id) { // Adjust based on actual API response structure
                updateFileId(data.file.id);
            } else if (data.id) {
                updateFileId(data.id);
            }
        } else {
            log(data, 'error');
        }
    } catch (err) {
        log({ error: err.message }, 'error');
    }
});

async function getFileInfo() {
    const id = fileIdInput.value;
    if (!id) return alert('Ingresa un ID de archivo');

    try {
        // Since there isn't a direct "get metadata" endpoint in standard REST usually without /download, 
        // we might rely on listing versions or just trying to download.
        // Let's assume we want to see versions as "Info".
        const res = await fetch(`${API_BASE}/${id}/versions`);
        const data = await res.json();

        if (res.ok) {
            log(data, 'success');
        } else {
            log(data, 'error');
        }
    } catch (err) {
        log({ error: err.message }, 'error');
    }
}

async function executeAction(action) {
    const id = fileIdInput.value;
    if (!id) return alert('Ingresa un ID de archivo');

    const targetPath = document.getElementById('target-path').value;
    // For now assuming storageType is optional or fixed, or we add input for it.
    // Simulating simplified input for move/copy

    if (!targetPath && (action === 'move' || action === 'copy')) {
        return alert('Para mover o copiar necesitas un Target Path (simulado en este UI como un string simple, ajusta según tu API)');
    }

    const body = {
        targetPath: targetPath, // This matches the "storage abstraction" needs likely
        storageType: 'local' // Defaulting for testing
    };

    try {
        const res = await fetch(`${API_BASE}/${id}/${action}`, {
            method: action === 'move' ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await res.json();

        if (res.ok) {
            log(data, 'success');
        } else {
            log(data, 'error');
        }
    } catch (err) {
        log({ error: err.message }, 'error');
    }
}

async function viewImage() {
    const id = fileIdInput.value;
    if (!id) return alert('Ingresa un ID de archivo');

    const previewContainer = document.getElementById('image-preview-container');
    const previewImage = document.getElementById('image-preview');

    try {
        const res = await fetch(`${API_BASE}/${id}`);

        if (res.ok) {
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            previewImage.src = url;
            previewContainer.classList.remove('hidden');
            log({ message: 'Imagen cargada en vista previa' }, 'success');
        } else {
            const data = await res.json();
            log(data, 'error');
            previewContainer.classList.add('hidden');
        }
    } catch (err) {
        log({ error: err.message }, 'error');
        previewContainer.classList.add('hidden');
    }
}

// Make functions available globally for HTML onclicks
window.getFileInfo = getFileInfo;
window.executeAction = executeAction;
window.viewImage = viewImage;
