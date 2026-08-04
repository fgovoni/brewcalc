// Assistente de extração: contagem regressiva, beep, vibração e tela acesa.
//
// O estado do timer (passo atual, âncora de tempo, contexto de áudio) vive só aqui.
// O timer marca o tempo por timestamp e não por soma de ticks: setInterval atrasa
// quando a aba perde o foco, e num preparo de 3 minutos o desvio seria visível.

import { formatTime, parseTimeToSeconds } from './formato.js';

// ---------- Timer de preparo ----------
let timerSteps = [];

let timerInterval = null;

let timerElapsed = 0;

// Instante (Date.now) correspondente a timerElapsed = 0. O tempo decorrido é sempre
// DERIVADO do relógio, nunca contado somando ticks: setInterval acumula deriva e é
// estrangulado pelo Android/iOS em segundo plano, o que atrasava o preparo inteiro.
let timerAnchor = null;

let timerAudioCtx = null;

let countdownInterval = null;

let isCountingDown = false;

let wakeLock = null;

// Android e iOS entregam o AudioContext suspenso: sem um resume() dentro
// de um gesto do usuário, os beeps ficam mudos (a vibração ainda funciona).
function ensureAudioReady() {
    try {
        if (!timerAudioCtx) {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            if (!Ctx) return;
            timerAudioCtx = new Ctx();
            // Buffer mudo de 1 sample: destrava a saída de áudio no celular
            const src = timerAudioCtx.createBufferSource();
            src.buffer = timerAudioCtx.createBuffer(1, 1, 22050);
            src.connect(timerAudioCtx.destination);
            src.start(0);
        }
        if (timerAudioCtx.state === 'suspended') timerAudioCtx.resume();
    } catch (e) { /* Web Audio indisponível neste navegador — ignora */ }
}

function playBeep(freq, duration, vibratePattern) {
    try {
        ensureAudioReady();
        if (!timerAudioCtx) throw new Error('sem Web Audio');
        const osc = timerAudioCtx.createOscillator();
        const gain = timerAudioCtx.createGain();
        osc.frequency.value = freq;
        osc.connect(gain);
        gain.connect(timerAudioCtx.destination);
        const now = timerAudioCtx.currentTime;
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.3, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        osc.start(now);
        osc.stop(now + duration + 0.05);
    } catch (e) { /* Web Audio indisponível neste navegador — ignora */ }
    if (navigator.vibrate && vibratePattern) navigator.vibrate(vibratePattern);
}

function playTimerBeep() {
    playBeep(880, 0.5, [200, 100, 200]);
}

function playCountdownTick() {
    playBeep(600, 0.15, [80]);
}

function playCountdownGo() {
    playBeep(1046, 0.35, [200]);
}

// ---------- Wake Lock (mantém a tela ligada durante o timer) ----------
async function requestWakeLock() {
    try {
        if ('wakeLock' in navigator) {
            wakeLock = await navigator.wakeLock.request('screen');
            wakeLock.addEventListener('release', () => { wakeLock = null; });
        }
    } catch (e) { /* Wake Lock indisponível ou negado pelo navegador — ignora */ }
}

function releaseWakeLock() {
    if (wakeLock) {
        wakeLock.release().catch(() => {});
        wakeLock = null;
    }
}

function initTimerForSteps(steps) {
    timerSteps = steps.map(s => ({ ...s, seconds: parseTimeToSeconds(s.time) }));
    document.getElementById('timer-panel').classList.remove('hidden');
    resetTimer();
}

function updateTimerHighlight() {
    let activeIdx = -1;
    timerSteps.forEach((s, i) => { if (s.seconds <= timerElapsed) activeIdx = i; });
    document.querySelectorAll('.step-timed').forEach(el => {
        const idx = parseInt(el.dataset.stepIndex);
        el.classList.toggle('step-active', idx === activeIdx);
    });
    const hintEl = document.getElementById('timer-next-hint');
    if (!hintEl) return;
    const next = timerSteps.find(s => s.seconds > timerElapsed);
    if (timerInterval === null && timerElapsed === 0) {
        hintEl.textContent = 'Toque em Iniciar para começar';
    } else if (next) {
        hintEl.textContent = `Próximo passo em ${formatTime(next.seconds - timerElapsed)}`;
    } else {
        hintEl.textContent = 'Última etapa — bom café!';
    }
}

function updateTimerDisplay() {
    document.getElementById('timer-display').textContent = formatTime(timerElapsed);
    updateTimerHighlight();
}

function tickTimer() {
    if (timerAnchor === null) return;
    const anterior = timerElapsed;
    timerElapsed = Math.max(0, Math.floor((Date.now() - timerAnchor) / 1000));
    if (timerElapsed !== anterior) {
        // Beepa por TODO passo cruzado desde o tick anterior, não só pelo que casa
        // exatamente com o segundo atual: com a aba em segundo plano um tick perdido
        // fazia aquele aviso sumir para sempre. Um beep só, mesmo cruzando vários.
        const cruzouPasso = timerSteps.some((s, i) =>
            i > 0 && s.seconds > anterior && s.seconds <= timerElapsed
        );
        if (cruzouPasso) playTimerBeep();
        updateTimerDisplay();
    }
}

function startTimer() {
    if (timerInterval || timerSteps.length === 0 || isCountingDown) return;
    ensureAudioReady(); // ainda dentro do clique — é aqui que o celular libera o áudio
    isCountingDown = true;
    const startBtn = document.getElementById('timer-start-btn');
    const displayEl = document.getElementById('timer-display');
    const hintEl = document.getElementById('timer-next-hint');
    if (startBtn) startBtn.disabled = true;
    let count = 3;
    if (displayEl) displayEl.textContent = String(count);
    if (hintEl) hintEl.textContent = 'Prepare-se...';
    playCountdownTick();
    countdownInterval = setInterval(() => {
        count--;
        if (count > 0) {
            if (displayEl) displayEl.textContent = String(count);
            playCountdownTick();
        } else {
            clearInterval(countdownInterval);
            countdownInterval = null;
            isCountingDown = false;
            if (startBtn) { startBtn.disabled = false; startBtn.textContent = 'Pausar'; }
            if (displayEl) displayEl.textContent = formatTime(timerElapsed);
            playCountdownGo();
            requestWakeLock();
            // Âncora recuada pelo tempo já decorrido, para o "Continuar" retomar
            // exatamente de onde parou
            timerAnchor = Date.now() - timerElapsed * 1000;
            timerInterval = setInterval(tickTimer, 250);
            updateTimerHighlight();
        }
    }, 1000);
}

function pauseTimer() {
    tickTimer(); // congela no tempo real do instante da pausa
    clearInterval(timerInterval);
    timerInterval = null;
    timerAnchor = null;
    releaseWakeLock();
    const btn = document.getElementById('timer-start-btn');
    if (btn) btn.textContent = 'Continuar';
}

function toggleTimer() {
    if (timerInterval) { pauseTimer(); return; }
    if (isCountingDown) return;
    startTimer();
}

function resetTimer() {
    clearInterval(timerInterval);
    clearInterval(countdownInterval);
    timerInterval = null;
    countdownInterval = null;
    isCountingDown = false;
    timerElapsed = 0;
    timerAnchor = null;
    releaseWakeLock();
    const btn = document.getElementById('timer-start-btn');
    if (btn) { btn.textContent = 'Iniciar'; btn.disabled = false; }
    const displayEl = document.getElementById('timer-display');
    if (displayEl) displayEl.textContent = '0:00';
    document.querySelectorAll('.step-timed').forEach(el => el.classList.remove('step-active'));
    updateTimerHighlight();
}

document.addEventListener('visibilitychange', () => {
    // Reconquista o wake lock e o áudio se o app voltar a ficar visível
    // com o timer rodando — o Android suspende os dois em segundo plano
    if (document.visibilityState === 'visible' && timerInterval) {
        requestWakeLock();
        ensureAudioReady();
        // Ressincroniza na hora: enquanto a aba esteve escondida o navegador pode
        // ter congelado os ticks, mas o café continuou extraindo
        tickTimer();
    }
});

// Encerra o preparo em andamento: esconde a receita já calculada e zera o timer.
// Mora aqui, e não no app, porque quem sabe o que é um preparo em curso é este
// módulo — e assim o construtor de receitas pode cancelar um preparo sem depender
// do app.js.
function clearRecipe() {
    document.getElementById('recipe-container').classList.add('hidden');
    resetTimer();
}

export { initTimerForSteps, toggleTimer, resetTimer, ensureAudioReady, clearRecipe };
