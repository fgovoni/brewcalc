// Compartilhamento de receita customizada: os dados vão embutidos no próprio
// endereço, então não existe servidor no meio e o link funciona offline do outro lado.
//
// A validação em decodeRecipeFromParam não é paranoia: o payload vem de um link que
// qualquer um pode ter montado. Nome, descrição e números são conferidos um a um
// antes de virar receita, e a exibição ainda passa por escapeHtml.

import { qrcode } from './qr.js';
import { numeroValido, textoValido, formatTime, parseTimeToSeconds } from './formato.js';
import { temMeta } from './receitas.js';

// Codifica/decodifica receitas customizadas para compartilhamento via link + QR code
function toBase64Url(str) {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(param) {
    let b64 = param.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder().decode(bytes);
}

function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i += 1) hash = (hash * 31 + str.charCodeAt(i)) | 0;
    return Math.abs(hash).toString(36);
}

function buildRecipeShareUrl(data) {
    const compact = {
        n: data.name,
        dv: data.device,
        rc: data.refCoffee,
        rw: data.refWater,
        ck: data.clicksDefault,
        tc: data.tempC,
        // Gramas absolutos, não percentual: arredondar o percentual para 3 casas
        // fazia 50g em 320ml virar 62,4g (e não 62,5g) ao reescalar para 400ml
        st: data.steps.map(s => [parseTimeToSeconds(s.time), temMeta(s.amount) ? s.amount : null, s.desc])
    };
    const param = toBase64Url(JSON.stringify(compact));
    const base = location.href.split('#')[0];
    return { url: `${base}#r=${param}`, param };
}

// Limites de sanidade para dados que chegam de um link — o conteúdo é controlado
// por quem gerou o QR, então nada aqui pode ser assumido como confiável
const LIMITES_IMPORT = { nome: 60, passos: 20, desc: 60 };

function decodeRecipeFromParam(param) {
    const compact = JSON.parse(fromBase64Url(param));
    const invalido = msg => { throw new Error(msg); };

    if (!textoValido(compact.n, LIMITES_IMPORT.nome)) invalido('nome de receita inválido');
    if (typeof compact.dv !== 'string') invalido('aparelho inválido');
    if (!Array.isArray(compact.st) || compact.st.length === 0 || compact.st.length > LIMITES_IMPORT.passos) {
        invalido('lista de passos inválida');
    }
    if (!numeroValido(compact.rc, 0.1, 1000)) invalido('café de referência inválido');
    if (!numeroValido(compact.rw, 1, 10000)) invalido('água de referência inválida');
    if (!numeroValido(compact.ck, 1, 100)) invalido('cliques inválidos');
    if (!numeroValido(compact.tc, 1, 100)) invalido('temperatura inválida');

    const steps = compact.st.map(passo => {
        if (!Array.isArray(passo) || passo.length !== 3) invalido('passo malformado');
        const [sec, amount, desc] = passo;
        if (!numeroValido(sec, 0, 3600)) invalido('tempo de passo inválido');
        // null = passo só de instrução, sem despejo
        if (amount !== null && !numeroValido(amount, 0, 10000)) invalido('quantidade de passo inválida');
        if (!textoValido(desc, LIMITES_IMPORT.desc)) invalido('descrição de passo inválida');
        return { time: formatTime(Math.round(sec)), amount, desc };
    });

    return {
        id: `custom-${simpleHash(param)}`,
        device: compact.dv,
        name: compact.n,
        refCoffee: compact.rc,
        refWater: compact.rw,
        clicksDefault: compact.ck,
        tempC: compact.tc,
        steps
    };
}

function generateRecipeQR(url) {
    for (let typeNumber = 1; typeNumber <= 20; typeNumber += 1) {
        try {
            const qr = qrcode(typeNumber);
            qr.addData(url);
            qr.make();
            return qr;
        } catch (e) { /* não coube nessa versão — tenta a próxima */ }
    }
    return null; // acima de ~690 bytes (versão 20, nível L) não há mais para onde crescer
}

function roundRectPath(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

const QR_QUIET_MODULES = 4;

// Lado em pixels que o QR vai realmente ocupar: sempre um múltiplo inteiro do
// número de módulos. Com módulo fracionário, arredondar cada quadradinho deforma
// a grade e nenhum leitor consegue ler o código.
function qrDrawSize(qrObj, maxSize) {
    const total = qrObj.getModuleCount() + QR_QUIET_MODULES * 2;
    return Math.max(1, Math.floor(maxSize / total)) * total;
}

function drawQRCodeOnCanvas(ctx, qrObj, x, y, size) {
    const count = qrObj.getModuleCount();
    const moduleSize = size / (count + QR_QUIET_MODULES * 2);
    // Cartão claro com cantos arredondados; a zona silenciosa continua
    // quadrada por dentro, então o arredondamento não atrapalha a leitura
    ctx.fillStyle = '#fdfaf5';
    roundRectPath(ctx, x, y, size, size, 18);
    ctx.fill();
    ctx.fillStyle = '#1b1410';
    for (let row = 0; row < count; row += 1) {
        for (let col = 0; col < count; col += 1) {
            if (qrObj.isDark(row, col)) {
                ctx.fillRect(
                    x + (QR_QUIET_MODULES + col) * moduleSize,
                    y + (QR_QUIET_MODULES + row) * moduleSize,
                    moduleSize, moduleSize
                );
            }
        }
    }
}

export {
    toBase64Url, fromBase64Url, simpleHash, buildRecipeShareUrl,
    LIMITES_IMPORT, decodeRecipeFromParam, generateRecipeQR,
    roundRectPath, qrDrawSize, drawQRCodeOnCanvas,
};
