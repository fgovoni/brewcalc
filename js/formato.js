// Formatação e validação: funções puras, sem DOM e sem estado.
//
// São as regras que os testes mais exercitam — o arredondamento da proporção que
// mantém 1:16.7 como 16.7, a ida e volta entre "1:30" e 90 segundos, e o escape que
// segura conteúdo vindo de link compartilhado.

// Nomes de receita e descrições de passo podem vir de um link compartilhado, ou
// seja, são texto controlado por terceiros. Sempre escapar antes de montar HTML.
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Faixa de cliques (referência Timemore C2) por nível de moagem — usada para
// derivar automaticamente o nome da moagem a partir do número de cliques.
function clicksToGrindLevel(clicks) {
    const c = parseFloat(clicks);
    if (isNaN(c)) return '—';
    if (c < 14) return 'Fina';
    if (c < 19) return 'Média-Fina';
    if (c < 23) return 'Média';
    if (c < 27) return 'Média-Grossa';
    return 'Grossa';
}

function numeroValido(v, min, max) {
    return typeof v === 'number' && isFinite(v) && v >= min && v <= max;
}

function textoValido(v, maxLen) {
    return typeof v === 'string' && v.trim().length > 0 && v.length <= maxLen;
}

function formatTime(totalSeconds) {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

// Uma casa decimal, sem ".0" pendurado em proporções redondas
function formatRatio(ratio) {
    return (Math.round(ratio * 10) / 10).toString();
}

// Limita um valor ao min/max declarados no próprio input. Os atributos min/max
// de input[type=number] não impedem valores fora da faixa nem por digitação nem
// por atribuição via JS, então a trava precisa ser explícita.
function clampToInput(input, value) {
    const min = parseFloat(input.min);
    const max = parseFloat(input.max);
    let v = value;
    if (!isNaN(min)) v = Math.max(min, v);
    if (!isNaN(max)) v = Math.min(max, v);
    return v;
}

function parseTimeToSeconds(t) {
    const parts = t.split(':').map(Number);
    return (parts[0] || 0) * 60 + (parts[1] || 0);
}

// ---------- Geração da imagem para Stories (1080x1920) ----------
function formatDateBR(isoDate) {
    if (!isoDate) return '';
    const [y, m, d] = isoDate.split('-');
    return `${d}/${m}/${y}`;
}

export {
    escapeHtml, clicksToGrindLevel, formatTime, parseTimeToSeconds,
    formatRatio, clampToInput, formatDateBR, numeroValido, textoValido,
};
