// ==========================================
// CONFIGURACIÓN API REST (Render / Neon)
// ==========================================
// Sustituye con tu URL pública de Render (ej. https://campuscare-api.onrender.com/api)
const API_BASE_URL = "https://campuscare-api-hnju.onrender.com/api";

// 1. Mobile Menu Toggle
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');
if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
    });

    // Close mobile menu on link click
    mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => mobileMenu.classList.add('hidden'));
    });
}

// 2. Video Player Integration
const campusVideo = document.getElementById('campusVideo');
const customPlayToggle = document.getElementById('customPlayToggle');
if (customPlayToggle && campusVideo) {
    customPlayToggle.addEventListener('click', () => {
        if (campusVideo.paused) {
            campusVideo.play();
            customPlayToggle.innerHTML = `
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            Pausar Video
          `;
            showToast('Reproduciendo Demo', 'Mostrando interacción de Hardware y CameraX.', 'info');
        } else {
            campusVideo.pause();
            customPlayToggle.innerHTML = `
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
            </svg>
            Reproducir / Pausa
          `;
        }
    });
}

// 3. Before/After Interactive Comparison Slider
const compareWrapper = document.getElementById('compareWrapper');
const compareOverlay = document.getElementById('compareOverlay');
const sliderHandle = document.getElementById('sliderHandle');
let isSliding = false;

function updateComparison(xPos) {
    const rect = compareWrapper.getBoundingClientRect();
    let pos = (xPos - rect.left) / rect.width;
    if (pos < 0.05) pos = 0.05;
    if (pos > 0.95) pos = 0.95;
    const percentage = pos * 100;
    compareOverlay.style.width = percentage + '%';
    sliderHandle.style.left = percentage + '%';
}

if (compareWrapper) {
    compareWrapper.addEventListener('mousedown', (e) => {
        isSliding = true;
        updateComparison(e.clientX);
    });
    window.addEventListener('mouseup', () => { isSliding = false; });
    window.addEventListener('mousemove', (e) => {
        if (!isSliding) return;
        updateComparison(e.clientX);
    });

    // Touch events for mobile phones and tablets
    compareWrapper.addEventListener('touchstart', (e) => {
        isSliding = true;
        if (e.touches[0]) updateComparison(e.touches[0].clientX);
    }, { passive: true });
    window.addEventListener('touchend', () => { isSliding = false; });
    window.addEventListener('touchmove', (e) => {
        if (!isSliding || !e.touches[0]) return;
        updateComparison(e.touches[0].clientX);
    }, { passive: true });
}

// 4. Simulator Logic & State Machine
let currentTicketState = 'ABIERTO';
let currentTicketFolio = 'TCK-2026-0129';

function selectCampusLocation(code, fullName, shortLabel) {
    document.getElementById('simLocationInput').value = fullName;
    showToast('QR Escaneado con Éxito', `Ubicación precargada: [${code}] ${shortLabel}`, 'success');
}

// Emisión de Ticket: conectada a PostgreSQL / Render (con fallback offline)
async function handleEmitTicket() {
    const token = localStorage.getItem('cc_token');
    if (!token) {
        showToast('Acceso Requerido', 'Inicia sesión antes de generar un ticket oficial.', 'error');
        openAuthModal();
        return;
    }

    const location = document.getElementById('simLocationInput').value;
    const category = document.getElementById('simCategory').value;
    const severity = document.getElementById('simSeverity').value;
    const desc = document.getElementById('simDescription').value.trim();

    if (!desc) {
        showToast('Descripción Requerida', 'Ingresa la descripción de la avería observada.', 'error');
        document.getElementById('simDescription').focus();
        return;
    }

    const btnEmitir = document.getElementById('btnEmitirTicket');
    const btnLabel = document.getElementById('btnEmitirTicketLabel');
    if (btnEmitir) btnEmitir.disabled = true;
    if (btnLabel) btnLabel.textContent = 'Guardando en Servidor...';

    try {
        const response = await fetch(`${API_BASE_URL}/tickets`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                ubicacion: location,
                categoria: category,
                severidad: severity,
                descripcion: desc
            })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Error al guardar en el servidor');

        // Folio real devuelto por la base de datos
        currentTicketFolio = data.ticket.folio;

        document.getElementById('simFolioBadge').textContent = currentTicketFolio;
        document.getElementById('dispFolio').textContent = currentTicketFolio;
        document.getElementById('dispLocation').textContent = data.ticket.ubicacion;
        document.getElementById('dispCategory').textContent = data.ticket.categoria;

        advanceTicketState('ABIERTO');
        showToast('Ticket Generado', `Folio ${currentTicketFolio} registrado en base de datos.`, 'success');
        document.getElementById('simDescription').value = '';

    } catch (err) {
        showToast('Error de Conexión', err.message, 'error');
    } finally {
        if (btnEmitir) btnEmitir.disabled = false;
        if (btnLabel) btnLabel.textContent = 'Generar Ticket Oficial con Folio UTP';
    }
}

// Vinculación por EventListener al botón del simulador
document.getElementById('btnEmitirTicket')?.addEventListener('click', handleEmitTicket);

function advanceTicketState(newState) {
    currentTicketState = newState;
    const progressBar = document.getElementById('simProgressBar');
    const dispState = document.getElementById('dispState');
    const feedback = document.getElementById('simulatorFeedback');

    const step1 = document.getElementById('stepLabel1');
    const step2 = document.getElementById('stepLabel2');
    const step3 = document.getElementById('stepLabel3');
    const step4 = document.getElementById('stepLabel4');

    // Reset label colors
    [step1, step2, step3, step4].forEach(el => {
        el.className = 'text-slate-400';
    });

    if (newState === 'ABIERTO') {
        progressBar.style.width = '25%';
        dispState.textContent = 'ABIERTO';
        dispState.className = 'px-2 py-0.5 rounded bg-utp-green-950 text-utp-green-300 font-bold border border-utp-green-800';
        step1.className = 'text-utp-green-400 font-bold';
        feedback.textContent = '✓ Incidencia en cola de triaje. Notificando a jefe de mantenimiento UTP.';
    } else if (newState === 'ASIGNADO') {
        progressBar.style.width = '50%';
        dispState.textContent = 'ASIGNADO';
        dispState.className = 'px-2 py-0.5 rounded bg-utp-green-900 text-utp-green-200 font-bold border border-utp-green-700';
        step1.className = 'text-utp-green-400 font-bold';
        step2.className = 'text-utp-green-400 font-bold';
        feedback.textContent = '✓ Notificación push enviada al smartphone del técnico correspondiente.';
        showToast('Técnico Asignado', 'Orden despachada a especialista UTP.', 'info');
    } else if (newState === 'EN_PROCESO') {
        progressBar.style.width = '75%';
        dispState.textContent = 'EN PROCESO';
        dispState.className = 'px-2 py-0.5 rounded bg-amber-950 text-amber-300 font-bold border border-amber-800';
        step1.className = 'text-utp-green-400 font-bold';
        step2.className = 'text-utp-green-400 font-bold';
        step3.className = 'text-amber-400 font-bold';
        feedback.textContent = '✓ Técnico en aula UTP ejecutando la reparación física e inspección.';
        showToast('Reparación en Sitio', 'Trabajos de campo iniciados.', 'info');
    } else if (newState === 'RESUELTO') {
        progressBar.style.width = '100%';
        dispState.textContent = 'RESUELTO CON EVIDENCIA';
        dispState.className = 'px-2 py-0.5 rounded bg-utp-green-950 text-utp-green-300 font-bold border border-utp-green-600';
        step1.className = 'text-utp-green-400 font-bold';
        step2.className = 'text-utp-green-400 font-bold';
        step3.className = 'text-amber-400 font-bold';
        step4.className = 'text-utp-green-400 font-bold';
        feedback.textContent = '✓ RF-05 Cumplido: Fotografía de solución adjuntada. SLA finalizado.';
        showToast('Ticket Resuelto', 'Fotografía de evidencia validada con éxito.', 'success');
    }
}

// 5. Toast Notification System (No Alert)
function showToast(title, message, type = 'info') {
    const toast = document.getElementById('toastNotification');
    const toastTitle = document.getElementById('toastTitle');
    const toastBody = document.getElementById('toastBody');
    const toastIcon = document.getElementById('toastIcon');

    toastTitle.textContent = title;
    toastBody.textContent = message;

    if (type === 'success') {
        toastIcon.className = 'w-7 h-7 rounded-lg bg-utp-green-600 text-white flex items-center justify-center font-bold';
        toastIcon.textContent = '✓';
    } else if (type === 'error') {
        toastIcon.className = 'w-7 h-7 rounded-lg bg-utp-terracotta-600 text-white flex items-center justify-center font-bold';
        toastIcon.textContent = '✕';
    } else {
        toastIcon.className = 'w-7 h-7 rounded-lg bg-utp-terracotta-600 text-white flex items-center justify-center font-bold';
        toastIcon.textContent = 'ℹ';
    }

    toast.classList.remove('translate-y-24', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');

    setTimeout(() => {
        toast.classList.add('translate-y-24', 'opacity-0');
        toast.classList.remove('translate-y-0', 'opacity-100');
    }, 3500);
}

// ==========================================
// 6. CONTROL DEL MODAL DE ACCESO (LOGIN / REGISTRO)
// ==========================================
const authModal = document.getElementById('authModal');
const loginView = document.getElementById('loginView');
const registerView = document.getElementById('registerView');
const profileView = document.getElementById('profileView');

function openAuthModal() {
    if (!authModal) return;
    const user = JSON.parse(localStorage.getItem('cc_user') || 'null');
    authModal.classList.remove('hidden');

    if (user) {
        if (loginView) loginView.classList.add('hidden');
        if (registerView) registerView.classList.add('hidden');
        if (profileView) profileView.classList.remove('hidden');
        document.getElementById('profileName').textContent = user.nombre;
        document.getElementById('profileEmail').textContent = user.email;
        document.getElementById('profileAvatarLetter').textContent = user.nombre.charAt(0).toUpperCase();
    } else {
        if (profileView) profileView.classList.add('hidden');
        if (registerView) registerView.classList.add('hidden');
        if (loginView) loginView.classList.remove('hidden');
    }
}

function updateNavAuthUI() {
    const user = JSON.parse(localStorage.getItem('cc_user') || 'null');
    const label = document.getElementById('navAuthLabel');
    if (label) {
        label.textContent = user ? `Perfil (${user.nombre.split(' ')[0]})` : 'Iniciar Sesión';
    }
}

document.getElementById('navAuthBtn')?.addEventListener('click', openAuthModal);
document.getElementById('mobileAuthBtn')?.addEventListener('click', () => {
    mobileMenu?.classList.add('hidden');
    openAuthModal();
});

document.getElementById('closeAuthModal')?.addEventListener('click', () => {
    authModal?.classList.add('hidden');
});

document.getElementById('toggleToRegister')?.addEventListener('click', (e) => {
    e.preventDefault();
    loginView?.classList.add('hidden');
    registerView?.classList.remove('hidden');
});

document.getElementById('toggleToLogin')?.addEventListener('click', (e) => {
    e.preventDefault();
    registerView?.classList.add('hidden');
    loginView?.classList.remove('hidden');
});

// Evento: Registro de nuevo usuario
document.getElementById('btnDoRegister')?.addEventListener('click', async () => {
    const nombre = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPass').value;

    if (!nombre || !email || !password) {
        showToast('Campos Incompletos', 'Completa todos los campos para el registro.', 'error');
        return;
    }

    try {
        const res = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error en el registro');

        showToast('Registro Exitoso', 'Tu usuario fue creado. Inicia sesión ahora.', 'success');
        document.getElementById('toggleToLogin').click();
    } catch (err) {
        showToast('Fallo de Registro', err.message, 'error');
    }
});

// Evento: Login
document.getElementById('btnDoLogin')?.addEventListener('click', async () => {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPass').value;

    if (!email || !password) {
        showToast('Credenciales Faltantes', 'Ingresa tu correo y contraseña.', 'error');
        return;
    }

    try {
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Credenciales inválidas');

        localStorage.setItem('cc_token', data.token);
        localStorage.setItem('cc_user', JSON.stringify(data.user));

        authModal.classList.add('hidden');
        updateNavAuthUI();
        showToast('Sesión Iniciada', `Bienvenido, ${data.user.nombre}.`, 'success');
    } catch (err) {
        showToast('Error de Acceso', err.message, 'error');
    }
});

// Evento: Logout
document.getElementById('btnLogout')?.addEventListener('click', () => {
    localStorage.removeItem('cc_token');
    localStorage.removeItem('cc_user');
    authModal.classList.add('hidden');
    updateNavAuthUI();
    showToast('Sesión Cerrada', 'Has cerrado sesión exitosamente.', 'info');
});

// Inicializar el estado de sesión al cargar
updateNavAuthUI();

// ==========================================
// 7. REGISTRO DE SERVICE WORKER (PWA)
// ==========================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register('./serviceWorker.js', { scope: './' })
            .then((reg) => console.log('Service Worker activo con alcance:', reg.scope))
            .catch((err) => console.error('Error al registrar Service Worker:', err));
    });
}