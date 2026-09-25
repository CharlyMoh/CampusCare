// 1. Mobile Menu Toggle
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');
mobileMenuBtn.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
});

// Close mobile menu on link click
mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => mobileMenu.classList.add('hidden'));
});

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

function handleEmitTicket() {
    const location = document.getElementById('simLocationInput').value;
    const category = document.getElementById('simCategory').value;
    const severity = document.getElementById('simSeverity').value;
    const desc = document.getElementById('simDescription').value.trim();

    // Random ticket counter
    const randomId = Math.floor(1000 + Math.random() * 9000);
    currentTicketFolio = `TCK-2026-${randomId}`;

    document.getElementById('simFolioBadge').textContent = currentTicketFolio;
    document.getElementById('dispFolio').textContent = currentTicketFolio;
    document.getElementById('dispLocation').textContent = location;
    document.getElementById('dispCategory').textContent = category;

    // Reset state
    advanceTicketState('ABIERTO');
    showToast('Ticket Generado', `Folio ${currentTicketFolio} registrado en base de datos.`, 'success');
}

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