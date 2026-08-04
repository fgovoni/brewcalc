// Cartão para Stories (1080x1920) e gráfico de radar da avaliação — tudo em
// Canvas 2D, sem biblioteca.
//
// O tamanho é fixo em 1080x1920 porque é o formato que o Instagram aceita sem
// recortar. Em receita customizada o cartão embute o QR de importação, então quem
// recebe a imagem consegue abrir a receita — é o que faz o compartilhamento valer.

import { escapeHtml, formatDateBR, clicksToGrindLevel } from './formato.js';
import { buildRecipeShareUrl, generateRecipeQR, roundRectPath, qrDrawSize, drawQRCodeOnCanvas } from './compartilhar.js';
import { getBrewSummary, getCurrentRecipe } from './estado.js';
import { getRatings } from './avaliacao.js';
import { getCurrentCustomRawData } from './receitas-custom.js';

const LEGENDA_QR = 'Aponte a câmera para importar esta receita';

// Largura do painel do QR e corpo da legenda.
//
// O painel era dimensionado só pelo QR (lado + 120). Como o QR encolhe quando
// sobra pouco espaço vertical, a legenda — que tem largura fixa — passava a ser
// mais larga que o quadro e vazava pelas laterais. Agora o painel considera os
// dois, e se nem o canvas inteiro comportar o texto, a fonte cede.
function ajustarLegendaQR(ctx, legenda, ladoQR, larguraCanvas) {
    const margemLateral = 40;   // respiro entre o painel e a borda do cartão
    const padding = 40;         // respiro entre o texto e a borda do painel
    const painelMax = larguraCanvas - margemLateral * 2;

    let fonte = 28;
    const larguraCom = f => {
        ctx.font = `700 ${f}px system-ui, sans-serif`;
        return ctx.measureText(legenda).width;
    };
    while (fonte > 18 && larguraCom(fonte) + padding * 2 > painelMax) fonte -= 1;

    const panelW = Math.min(painelMax,
        Math.max(ladoQR + 120, Math.ceil(larguraCom(fonte)) + padding * 2));
    return { fonte, panelW };
}

// maxLines (opcional): corta o texto com reticências em vez de deixar
// um campo longo empurrar o resto do card para fora do canvas
// Quebra uma palavra que sozinha não cabe na largura, para um nome de café sem
// espaços não vazar para fora do card
function quebrarPalavraLonga(ctx, palavra, maxWidth) {
    if (ctx.measureText(palavra).width <= maxWidth) return [palavra];
    const pedacos = [];
    let atual = '';
    for (const ch of palavra) {
        if (atual && ctx.measureText(atual + ch).width > maxWidth) {
            pedacos.push(atual);
            atual = ch;
        } else {
            atual += ch;
        }
    }
    if (atual) pedacos.push(atual);
    return pedacos;
}

function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
    const words = text.split(' ').flatMap(p => quebrarPalavraLonga(ctx, p, maxWidth));
    let line = '';
    let lines = 0;
    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        if (ctx.measureText(testLine).width > maxWidth && n > 0) {
            if (maxLines && lines === maxLines - 1) {
                ctx.fillText(line.trimEnd() + '…', x, y + lines * lineHeight);
                return y + lines * lineHeight + lineHeight;
            }
            ctx.fillText(line, x, y + lines * lineHeight);
            line = words[n] + ' ';
            lines++;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, x, y + lines * lineHeight);
    return y + lines * lineHeight + lineHeight;
}

function drawRadarChart(ctx, cx, cy, radius, ratings) {
    const n = ratings.length;
    const angleStep = (Math.PI * 2) / n;
    const startAngle = -Math.PI / 2;

    // Grades de fundo (1 a 5)
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 2;
    for (let level = 1; level <= 5; level++) {
        const r = (level / 5) * radius;
        ctx.beginPath();
        for (let i = 0; i <= n; i++) {
            const angle = startAngle + i * angleStep;
            const x = cx + r * Math.cos(angle);
            const y = cy + r * Math.sin(angle);
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
    }

    // Eixos + rótulos
    ctx.fillStyle = '#d1d5db';
    ctx.font = '600 30px system-ui, sans-serif';
    for (let i = 0; i < n; i++) {
        const angle = startAngle + i * angleStep;
        const x = cx + radius * Math.cos(angle);
        const y = cy + radius * Math.sin(angle);
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(x, y);
        ctx.stroke();

        const labelR = radius + 55;
        const lx = cx + labelR * Math.cos(angle);
        const ly = cy + labelR * Math.sin(angle);
        ctx.textAlign = Math.abs(Math.cos(angle)) < 0.2 ? 'center' : (Math.cos(angle) > 0 ? 'left' : 'right');
        ctx.textBaseline = Math.abs(Math.sin(angle)) < 0.2 ? 'middle' : (Math.sin(angle) > 0 ? 'top' : 'bottom');
        ctx.fillText(ratings[i].label, lx, ly);
    }

    // Polígono de valores
    ctx.beginPath();
    ratings.forEach((r, i) => {
        const angle = startAngle + i * angleStep;
        const rad = (r.value / 5) * radius;
        const x = cx + rad * Math.cos(angle);
        const y = cy + rad * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = 'rgba(217, 164, 65, 0.35)';
    ctx.fill();
    ctx.strokeStyle = '#e8be6e';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Pontos nos vértices
    ratings.forEach((r, i) => {
        const angle = startAngle + i * angleStep;
        const rad = (r.value / 5) * radius;
        const x = cx + rad * Math.cos(angle);
        const y = cy + rad * Math.sin(angle);
        ctx.beginPath();
        ctx.arc(x, y, 9, 0, Math.PI * 2);
        ctx.fillStyle = '#d9a441';
        ctx.fill();
    });
}

function generateShareImage() {
    const recipe = getCurrentRecipe();
    if (!recipe) {
        alert('Selecione uma receita na aba Calculadora antes de gerar a imagem.');
        return;
    }
    const canvas = document.getElementById('share-canvas');
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;

    // Fundo
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#241a13');
    bg.addColorStop(1, '#140e0a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const coffeeName = document.getElementById('coffee-name').value || 'Café sem nome';
    const roasteryName = document.getElementById('roastery-name').value;
    const roastDate = formatDateBR(document.getElementById('roast-date').value);
    const region = document.getElementById('region').value;
    const roast = document.getElementById('review-roast').value;
    const process = document.getElementById('review-process').value;
    const variety = document.getElementById('variety').value;
    const temp = document.getElementById('review-temp').value;
    const grind = document.getElementById('review-grind').value;
    const notes = document.getElementById('review-notes').value;
    const ratings = getRatings();
    const brew = getBrewSummary();

    // Marca d'água / nome do app
    ctx.fillStyle = '#c9a876';
    ctx.font = "700 42px ui-serif, Georgia, 'Times New Roman', serif";
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('☕ BrewCalc', 60, 90);

    // Nome do café
    ctx.fillStyle = '#f3e9dd';
    ctx.font = "700 64px ui-serif, Georgia, 'Times New Roman', serif";
    ctx.textAlign = 'center';
    let y = wrapCanvasText(ctx, coffeeName, W / 2, 200, W - 140, 68);

    // Torrefação
    if (roasteryName) {
        ctx.fillStyle = '#a08b76';
        ctx.font = '500 34px system-ui, sans-serif';
        ctx.fillText(roasteryName, W / 2, y + 10);
        y += 60;
    } else {
        y += 10;
    }

    // Método de preparo (aparelho + receita/barista)
    ctx.fillStyle = '#e8be6e';
    ctx.font = '600 28px system-ui, sans-serif';
    ctx.textAlign = 'center';
    y = wrapCanvasText(ctx, brew.method, W / 2, y + 20, W - 140, 36) + 6;

    // Duas colunas: café (esquerda) e receita (direita, com notas no final)
    const leftDetails = [
        ['Torra', roast], ['Data da torra', roastDate || '—'],
        ['Processo', process], ['Região', region || '—'],
        ['Variedade', variety || '—']
    ].filter(([, v]) => v);

    const clicksVal = document.getElementById('review-clicks').value;
    const rightDetails = [
        ['Dose', brew.dose], ['Água', temp ? `${temp}°C` : '—'],
        ['Moagem', grind], ['Cliques', clicksVal ? `${clicksVal} cliques` : '—']
    ].filter(([, v]) => v);

    ctx.textAlign = 'left';
    const colW = (W - 120) / 2;
    const leftX = 60;
    const rightX = 60 + colW;
    const dy = y + 40;

    function renderDetailColumn(items, x, startY) {
        items.forEach(([label, value], idx) => {
            const py = startY + idx * 78;
            ctx.fillStyle = '#8a7360';
            ctx.font = '600 24px system-ui, sans-serif';
            ctx.fillText(label.toUpperCase(), x, py);
            ctx.fillStyle = '#e5d8c8';
            ctx.font = '600 34px system-ui, sans-serif';
            ctx.fillText(value, x, py + 38);
        });
        return startY + items.length * 78;
    }

    const leftBottomY = renderDetailColumn(leftDetails, leftX, dy);
    let rightBottomY = renderDetailColumn(rightDetails, rightX, dy);

    // Notas sensoriais — no final da coluna da receita
    if (notes) {
        ctx.fillStyle = '#8a7360';
        ctx.font = '600 24px system-ui, sans-serif';
        ctx.fillText('NOTAS SENSORIAIS', rightX, rightBottomY);
        ctx.fillStyle = '#e8be6e';
        ctx.font = 'italic 400 28px system-ui, sans-serif';
        rightBottomY = wrapCanvasText(ctx, notes, rightX, rightBottomY + 36, colW - 20, 34, 4) + 6;
    }

    let chartY = Math.max(leftBottomY, rightBottomY) + 30;

    // QR de importação: só faz sentido para receitas customizadas — as oficiais
    // (Hoffmann, Kasuya etc.) já vêm embutidas em qualquer instalação do app.
    const isCustomRecipe = !!recipe.isCustom;

    // Gera o QR antes de medir: o painel só é reservado se ele realmente existir
    let qrObj = null;
    let rawData = null;
    if (isCustomRecipe) {
        rawData = getCurrentCustomRawData();
        if (rawData) {
            try { qrObj = generateRecipeQR(buildRecipeShareUrl(rawData).url); }
            catch (e) { qrObj = null; }
        }
    }

    const footerY = H - 55;
    // labelPad cobre os rótulos, que ficam a radius+55 do centro mais a altura da fonte
    const labelPad = 88;
    const raioMin = 125;
    const alturaLegendaQR = 96;

    // Reparte o espaço abaixo dos detalhes entre o radar e o painel do QR.
    // O QR tem prioridade: abaixo de ~4 pixels por módulo nenhuma câmera o lê,
    // enquanto o radar continua compreensível menor. Antes o radar tinha a
    // preferência e era empurrado para cima, invadindo o bloco de detalhes.
    const espacoLivre = footerY - 40 - chartY;
    const radarMinimo = raioMin * 2 + labelPad * 2;
    const tetoQR = Math.max(0, espacoLivre - radarMinimo - 46 - alturaLegendaQR);
    const ladoQR = qrObj ? qrDrawSize(qrObj, Math.min(430, tetoQR)) : 0;
    const qrPanelH = qrObj ? ladoQR + alturaLegendaQR : 0;
    // Espaço reservado embaixo: painel do QR, ou só o aviso de receita longa demais
    const reservado = qrObj ? qrPanelH + 46 : (rawData ? 86 : 0);
    const chartBottom = footerY - 40 - reservado;

    // O radar usa o que sobrou, sem nunca subir para cima dos detalhes
    const chartRadius = Math.max(raioMin, Math.min(340, Math.floor((chartBottom - chartY - labelPad * 2) / 2)));
    const chartCenterY = chartY + labelPad + chartRadius;
    drawRadarChart(ctx, W / 2, chartCenterY, chartRadius, ratings);

    // Nota média
    const avg = (ratings.reduce((s, r) => s + r.value, 0) / ratings.length).toFixed(1);
    ctx.fillStyle = '#f3e9dd';
    ctx.font = '700 56px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(avg, W / 2, chartCenterY - 10);
    ctx.fillStyle = '#a08b76';
    ctx.font = '500 22px system-ui, sans-serif';
    ctx.fillText('MÉDIA', W / 2, chartCenterY + 24);

    if (qrObj) {
        // QR centralizado com a chamada embaixo: o código precisa ser grande o
        // bastante para ser lido, e é ele que manda no layout do painel.
        const legenda = ajustarLegendaQR(ctx, LEGENDA_QR, ladoQR, W);
        const panelW = legenda.panelW;
        const panelX = Math.round((W - panelW) / 2);
        const panelY = footerY - 40 - qrPanelH;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.045)';
        roundRectPath(ctx, panelX, panelY, panelW, qrPanelH, 30);
        ctx.fill();
        ctx.strokeStyle = 'rgba(201, 168, 118, 0.32)';
        ctx.lineWidth = 2;
        ctx.stroke();

        const qrX = Math.round((W - ladoQR) / 2);
        const qrY = panelY + 24;
        drawQRCodeOnCanvas(ctx, qrObj, qrX, qrY, ladoQR);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = '#e8be6e';
        ctx.font = `700 ${legenda.fonte}px system-ui, sans-serif`;
        ctx.fillText(LEGENDA_QR, W / 2, qrY + ladoQR + 46);
    } else if (rawData) {
        ctx.fillStyle = '#8a7360';
        ctx.font = '500 24px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        wrapCanvasText(ctx, 'Receita longa demais para gerar o QR de importação', W / 2, footerY - 70, W - 200, 30);
    }

    // Rodapé — URL do site, sempre ancorado na base do canvas
    ctx.fillStyle = '#8a7360';
    ctx.font = '500 28px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('fgovoni.github.io/brewcalc', W / 2, footerY);

    document.getElementById('share-preview').classList.remove('hidden');
    document.getElementById('share-preview').scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    if (navigator.share && navigator.canShare) {
        document.getElementById('share-btn').classList.remove('hidden');
    }
}

function canvasToBlob(canvas) {
    return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
}

async function downloadShareImage() {
    const canvas = document.getElementById('share-canvas');
    const blob = await canvasToBlob(canvas);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const coffeeName = (document.getElementById('coffee-name').value || 'cafe').trim().replace(/\s+/g, '-').toLowerCase();
    a.href = url;
    a.download = `brewcalc-${coffeeName}.png`;
    a.click();
    // Revogar na linha seguinte ao click() cancelava o download no Firefox,
    // que ainda não tinha lido o blob
    setTimeout(() => URL.revokeObjectURL(url), 60000);
}

async function shareImage() {
    const canvas = document.getElementById('share-canvas');
    const blob = await canvasToBlob(canvas);
    const coffeeName = document.getElementById('coffee-name').value || 'Café';
    const file = new File([blob], 'brewcalc.png', { type: 'image/png' });
    try {
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: coffeeName });
        } else {
            downloadShareImage();
        }
    } catch (e) { /* usuário cancelou o compartilhamento — nada a fazer */ }
}

export {
    drawRadarChart, wrapCanvasText, generateShareImage, downloadShareImage, shareImage,
    ajustarLegendaQR, LEGENDA_QR,
};
