// Tema claro/escuro e convite de instalação na tela inicial.
//
// O botão de instalar aparece sempre que o app não está rodando instalado, e não
// só quando o navegador dispara beforeinstallprompt: no Android o preventDefault
// suprime a barra do Chrome, então depender do evento deixava o usuário sem
// nenhum dos dois caminhos. Quando o evento não vem, cai na ajuda por aparelho.

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

// ---------- Convite de instalação ----------
// O caminho nativo é ruim de achar: no Android fica enterrado no menu do Chrome e
// no iOS o Safari não oferece nada. O botão do cabeçalho torna isso visível.
let promptInstalacao = null;

function appJaInstalado() {
    // matchMedia é protegido igual ao script de tema no <head>: esta função roda
    // na inicialização, e uma exceção aqui derrubaria todo o arranque do app
    const standalone = window.matchMedia
        && window.matchMedia('(display-mode: standalone)').matches;
    return !!standalone || navigator.standalone === true;
}

function ehIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function ehAndroid() {
    return /Android/.test(navigator.userAgent);
}

// Cada plataforma esconde a instalação num lugar diferente. Quando não há prompt
// programático disponível, resta apontar onde fica.
function instrucaoDeInstalacao() {
    if (ehIOS()) return {
        titulo: 'Instalar no iPhone',
        texto: 'Toque em <b>Compartilhar</b> na barra do Safari e escolha <b>“Adicionar à Tela de Início”</b>.'
    };
    if (ehAndroid()) return {
        titulo: 'Instalar no Android',
        texto: 'Procure <b>“Instalar app”</b> ou <b>“Adicionar à tela inicial”</b> no menu <b>⋮</b> do navegador.<br><br>Se não aparecer, o navegador ainda não reconheceu o app — <b>recarregue a página</b> e tente de novo. Alguns navegadores só oferecem a instalação a partir da segunda visita.'
    };
    return {
        titulo: 'Instalar no computador',
        texto: 'Clique no ícone de <b>instalar</b> à direita da barra de endereço do navegador.'
    };
}

function mostrarBotaoInstalar(mostrar) {
    const btn = document.getElementById('install-btn');
    if (btn) btn.classList.toggle('hidden', !mostrar);
}

function onInstallClick() {
    if (promptInstalacao) {
        promptInstalacao.prompt();
        promptInstalacao.userChoice.finally(() => {
            // O evento só pode ser usado uma vez; o Chrome dispara outro se couber
            promptInstalacao = null;
            mostrarBotaoInstalar(false);
        });
        return;
    }
    abrirAjudaInstalacao(); // sem prompt programático — resta ensinar o caminho
}

let ajudaFocoAnterior = null;

function abrirAjudaInstalacao() {
    const { titulo, texto } = instrucaoDeInstalacao();
    document.getElementById('install-help-title').textContent = titulo;
    document.getElementById('install-help-desc').innerHTML = texto;
    ajudaFocoAnterior = document.activeElement;
    document.getElementById('install-help-overlay').classList.remove('hidden');
    const ok = document.getElementById('install-help-ok');
    if (ok) ok.focus();
    document.addEventListener('keydown', onAjudaInstalacaoKeydown);
}

function fecharAjudaInstalacao() {
    document.getElementById('install-help-overlay').classList.add('hidden');
    document.removeEventListener('keydown', onAjudaInstalacaoKeydown);
    if (ajudaFocoAnterior && ajudaFocoAnterior.focus) ajudaFocoAnterior.focus();
    ajudaFocoAnterior = null;
}

function onAjudaInstalacaoKeydown(e) {
    if (e.key === 'Escape') { e.preventDefault(); fecharAjudaInstalacao(); }
}

window.addEventListener('beforeinstallprompt', e => {
    // Deliberadamente SEM preventDefault: suprimir a barrinha nativa do Chrome no
    // Android saía caro quando o evento não chegava — o usuário ficava sem a
    // oferta do navegador e sem a nossa. Melhor ter os dois caminhos.
    promptInstalacao = e;
    if (!appJaInstalado()) mostrarBotaoInstalar(true);
});

window.addEventListener('appinstalled', () => {
    promptInstalacao = null;
    mostrarBotaoInstalar(false);
});

// O botão aparece sempre que o app não estiver rodando instalado, mesmo sem
// beforeinstallprompt — ver o comentário no topo do arquivo.
if (!appJaInstalado()) mostrarBotaoInstalar(true);

export {
    applyTheme, toggleTheme, syncThemeToggleIcon,
    appJaInstalado, mostrarBotaoInstalar, onInstallClick, fecharAjudaInstalacao,
};
