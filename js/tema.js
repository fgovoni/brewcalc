// Tema claro/escuro.
//
// O <head> aplica o tema salvo antes do primeiro paint, com um script clássico e
// inline; este módulo cuida da troca depois. São dois lugares de propósito: módulo
// é adiado, e esperar por ele mostraria um flash da cor errada.

// ---------- Tema claro/escuro ----------
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.textContent = theme === 'light' ? '☀️' : '🌙';
    const metaTheme = document.getElementById('theme-color-meta');
    // Precisa ser o --bg real de cada tema; antes o claro mandava #f6efe3, uma cor
    // que não existe na tela, e a barra do navegador no celular destoava
    if (metaTheme) metaTheme.setAttribute('content', theme === 'light' ? '#df7a4e' : '#1b1410');
    try { localStorage.setItem('brewcalc-theme', theme); } catch (e) { /* localStorage indisponível — ignora */ }
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    applyTheme(current === 'dark' ? 'light' : 'dark');
}

function syncThemeToggleIcon() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    applyTheme(current);
}

export { applyTheme, toggleTheme, syncThemeToggleIcon };
