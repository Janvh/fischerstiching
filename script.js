/**
 * Fischerstiching 2029 - Event Countdown
 *
 * Ablauf:
 * 1. Video laden, Ladebildschirm zeigen
 * 2. Video starten, Titel unten einblenden
 * 3. Datum einblenden (kurz nach Titel)
 * 4. Ca. 1 Sek vor Video-Ende: Countdown oben einblenden
 * 5. Video stoppt am Ende, Reload-Button erscheint
 */

// ========================================
// Konfiguration
// ========================================

const CONFIG = {
    // Event-Datum: 06. Oktober 2029, 12:00 Uhr Mittags deutscher Zeit
    eventDate: new Date(Date.UTC(2029, 9, 6, 11, 0, 0)),

    // Timing für Einblendungen (in Sekunden nach Video-Start)
    titleShowDelay: 0.5,        // Titel nach 0.5 Sek einblenden
    countdownShowBefore: 1.0,   // Countdown 1 Sek vor Video-Ende einblenden
};

// ========================================
// DOM-Elemente
// ========================================

const elements = {
    video: document.getElementById('event-video'),
    loadingScreen: document.getElementById('loading-screen'),
    footer: document.getElementById('footer'),
    countdownSection: document.getElementById('countdown-section'),
    reloadButton: document.getElementById('reload-button'),
    days: document.getElementById('days'),
    hours: document.getElementById('hours'),
    minutes: document.getElementById('minutes'),
    seconds: document.getElementById('seconds'),
};

// ========================================
// Status-Variablen
// ========================================

let titleShown = false;
let countdownShown = false;
let videoDuration = 0;
let videoEnded = false;

// ========================================
// Countdown-Timer
// ========================================

/**
 * Aktualisiert den Countdown-Timer
 */
function updateCountdown() {
    const now = new Date();
    const difference = CONFIG.eventDate - now;

    // Falls das Event bereits vorbei ist
    if (difference <= 0) {
        elements.days.textContent = '000';
        elements.hours.textContent = '00';
        elements.minutes.textContent = '00';
        elements.seconds.textContent = '00';
        return;
    }

    // Zeitberechnung
    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    // Werte mit führenden Nullen formatieren
    elements.days.textContent = String(days).padStart(3, '0');
    elements.hours.textContent = String(hours).padStart(2, '0');
    elements.minutes.textContent = String(minutes).padStart(2, '0');
    elements.seconds.textContent = String(seconds).padStart(2, '0');
}

// Countdown jede Sekunde aktualisieren
setInterval(updateCountdown, 1000);
updateCountdown();

// ========================================
// Video-Steuerung
// ========================================

/**
 * Wird aufgerufen wenn das Video geladen ist
 */
function onVideoReady() {
    videoDuration = elements.video.duration;
    console.log('Video bereit. Dauer:', videoDuration, 'Sekunden');

    // Ladebildschirm ausblenden
    elements.loadingScreen.classList.add('hidden');

    // Video starten
    elements.video.play().then(() => {
        console.log('Video gestartet');
    }).catch(err => {
        console.warn('Autoplay blockiert:', err);
        // Bei blockiertem Autoplay trotzdem UI zeigen
        showTitle();
        showCountdown();
        showReloadButton();
    });
}

/**
 * Zeigt den Titel (Footer) an
 */
function showTitle() {
    if (titleShown) return;
    titleShown = true;
    elements.footer.classList.add('visible');
    console.log('Titel eingeblendet');
}

/**
 * Zeigt den Countdown an
 */
function showCountdown() {
    if (countdownShown) return;
    countdownShown = true;
    elements.countdownSection.classList.add('visible');
    console.log('Countdown eingeblendet');
}

/**
 * Zeigt den Reload-Button an
 */
function showReloadButton() {
    elements.reloadButton.classList.add('visible');
    console.log('Reload-Button eingeblendet');
}

/**
 * Wird bei jedem Video-Frame aufgerufen
 */
function onVideoTimeUpdate() {
    if (videoEnded) return;

    const currentTime = elements.video.currentTime;

    // Titel einblenden nach kurzer Verzögerung
    if (!titleShown && currentTime >= CONFIG.titleShowDelay) {
        showTitle();
    }

    // Countdown einblenden kurz vor Video-Ende
    const timeUntilEnd = videoDuration - currentTime;
    if (!countdownShown && videoDuration > 0 && timeUntilEnd <= CONFIG.countdownShowBefore) {
        showCountdown();
    }
}

/**
 * Wird aufgerufen wenn das Video endet
 */
function onVideoEnded() {
    videoEnded = true;
    console.log('Video beendet');

    // Sicherstellen, dass alles sichtbar ist
    showTitle();
    showCountdown();

    // Reload-Button einblenden
    showReloadButton();
}

/**
 * Startet alles von vorne
 */
function restartExperience() {
    console.log('Neustart...');

    // Status zurücksetzen
    titleShown = false;
    countdownShown = false;
    videoEnded = false;

    // UI zurücksetzen
    elements.footer.classList.remove('visible');
    elements.countdownSection.classList.remove('visible');
    elements.reloadButton.classList.remove('visible');

    // Video zurücksetzen und starten
    elements.video.currentTime = 0;
    elements.video.play().then(() => {
        console.log('Video neu gestartet');
    }).catch(err => {
        console.warn('Wiedergabe fehlgeschlagen:', err);
    });
}

// ========================================
// Event-Listener
// ========================================

// Video ist bereit zum Abspielen
elements.video.addEventListener('canplaythrough', onVideoReady, { once: true });

// Fallback falls canplaythrough nicht feuert
elements.video.addEventListener('loadeddata', () => {
    setTimeout(() => {
        if (!elements.loadingScreen.classList.contains('hidden')) {
            onVideoReady();
        }
    }, 500);
});

// Error-Handler falls Video nicht laden kann
elements.video.addEventListener('error', (e) => {
    console.warn('Video-Ladefehler:', e);
    forceShowContent();
});

// Stalled-Handler für iOS (Video-Download hängt)
elements.video.addEventListener('stalled', () => {
    console.warn('Video stalled - möglicherweise Netzwerkproblem');
    setTimeout(() => {
        if (!elements.loadingScreen.classList.contains('hidden')) {
            forceShowContent();
        }
    }, 3000);
});

// Ultimativer Timeout-Fallback (5 Sekunden)
setTimeout(() => {
    if (!elements.loadingScreen.classList.contains('hidden')) {
        console.warn('Timeout: Video lädt nicht, zeige Inhalt trotzdem');
        forceShowContent();
    }
}, 5000);

/**
 * Zeigt den Inhalt auch wenn das Video nicht funktioniert
 */
function forceShowContent() {
    elements.loadingScreen.classList.add('hidden');
    showTitle();
    showCountdown();
    showReloadButton();
}

// Video-Zeitupdate für Einblendungen
elements.video.addEventListener('timeupdate', onVideoTimeUpdate);

// Video ist zu Ende
elements.video.addEventListener('ended', onVideoEnded);

// Reload-Button Klick
elements.reloadButton.addEventListener('click', restartExperience);

// ========================================
// Initialisierung
// ========================================

console.log('Fischerstiching 2029 - Website geladen');
console.log('Event-Datum:', CONFIG.eventDate.toLocaleDateString('de-DE'));
