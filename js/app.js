// Entrada do BrewCalc: liga os controles da tela aos módulos e inicializa.
//
// Este arquivo é a única parte que conhece o HTML por inteiro. Os módulos que ele
// importa não se conhecem entre si mais do que o necessário — quando um precisava
// avisar o app de uma mudança (salvar receita customizada), a dependência foi
// invertida com um callback em vez de virar import circular.

import { qrcode } from './qr.js';
import {
    escapeHtml, clicksToGrindLevel, formatTime, parseTimeToSeconds,
    formatRatio, clampToInput, formatDateBR, numeroValido, textoValido,
} from './formato.js';
import {
    renderRecipeSteps, getDefaultClicks, getRecipeTemp, getDefaultTemp,
    buildCustomRecipeObject, temMeta, normalizeCustomRecipe,
} from './receitas.js';
import { KASUYA_BALANCE, deviceData } from './receitas-dados.js';
import {
    toBase64Url, buildRecipeShareUrl, decodeRecipeFromParam,
    generateRecipeQR, roundRectPath, qrDrawSize, drawQRCodeOnCanvas,
} from './compartilhar.js';
import { initTimerForSteps, toggleTimer, resetTimer, ensureAudioReady, clearRecipe } from './timer.js';
import {
    registrarRedesenho, customRecipes, loadCustomRecipes, openRecipeBuilder,
    closeRecipeBuilder, addCustomStepRow, onCustomClicksInput, cancelCustomRecipeBuilder,
    saveCustomRecipe, editCustomRecipe, deleteCustomRecipe, getCurrentCustomRawData,
    guardarReceitaImportada,
} from './receitas-custom.js';
import {
    getActiveClicks, getActiveTemp, getActiveRatio, getCurrentRecipe, getBrewSummary,
    razaoFoiTocada, marcarRazaoTocada,
} from './estado.js';
import { ratingLabels, buildRatingSliders, onRatingInput, getRatings } from './avaliacao.js';
import { drawRadarChart, generateShareImage, downloadShareImage, shareImage } from './cartao.js';
import { toggleTheme, syncThemeToggleIcon } from './tema.js';








function adjustClicks(amount) {
    const input = document.getElementById('clicks-input');
    const current = parseInt(input.value);
    input.value = clampToInput(input, (isNaN(current) ? 18 : current) + amount);
    onClicksInput();
    saveSettings();
}

function adjustTemp(amount) {
    const input = document.getElementById('temp-input');
    const current = parseInt(input.value);
    input.value = clampToInput(input, (isNaN(current) ? 92 : current) + amount);
    saveSettings();
}

function onClicksInput() {
    document.getElementById('grind-derived').textContent = `(${clicksToGrindLevel(document.getElementById('clicks-input').value)})`;
    saveSettings();
}














function onReviewClicksInput() {
    const val = document.getElementById('review-clicks').value;
    if (val === '') return;
    document.getElementById('review-grind').value = clicksToGrindLevel(val);
}

function adjustReviewClicks(amount) {
    const input = document.getElementById('review-clicks');
    const current = parseInt(input.value);
    input.value = clampToInput(input, (isNaN(current) ? 18 : current) + amount);
    onReviewClicksInput();
}
























function populateRecipeSelect(deviceKey, selectRecipeKey) {
    const recipeSelect = document.getElementById('recipe');
    recipeSelect.innerHTML = '';
    const recipes = deviceData[deviceKey].recipes;
    Object.keys(recipes).forEach(key => {
        const opt = document.createElement('option');
        opt.value = key;
        opt.textContent = recipes[key].label;
        recipeSelect.appendChild(opt);
    });
    customRecipes.filter(r => r.device === deviceKey).forEach(r => {
        const opt = document.createElement('option');
        opt.value = r.id;
        opt.textContent = `⭐ ${r.name}`;
        recipeSelect.appendChild(opt);
    });
    const createOpt = document.createElement('option');
    createOpt.value = '__custom_new__';
    createOpt.textContent = '➕ Criar minha receita';
    recipeSelect.appendChild(createOpt);

    const customMatch = customRecipes.some(r => r.id === selectRecipeKey);
    if (selectRecipeKey && (recipes[selectRecipeKey] || customMatch)) {
        recipeSelect.value = selectRecipeKey;
    }
}

function onRecipeSelectChange() {
    const val = document.getElementById('recipe').value;
    if (val === '__custom_new__') {
        openRecipeBuilder();
        return;
    }
    closeRecipeBuilder();
    update('recipe');
}

function onDeviceChange() {
    populateRecipeSelect(document.getElementById('device').value);
    closeRecipeBuilder();
    update('device');
}

function adjust(field, amount) {
    const input = document.getElementById(field);
    const current = parseFloat(input.value);
    input.value = Math.max(0, (isNaN(current) ? 0 : current) + amount);
    update(field);
}

function adjustRatio(amount) {
    const input = document.getElementById('ratio-input');
    const current = parseFloat(input.value);
    // Passo de 0,5 preservando o decimal — arredondar para inteiro tornava
    // impossível representar proporções oficiais como 1:16.7 ou 1:15.8
    input.value = formatRatio(clampToInput(input, (isNaN(current) ? 15 : current) + amount));
    marcarRazaoTocada(true);
    update('ratio');
}




function saveSettings() {
    try {
        localStorage.setItem('brewcalc-settings', JSON.stringify({
            device: document.getElementById('device').value,
            recipe: document.getElementById('recipe').value,
            roast: document.getElementById('roast').value,
            ratio: document.getElementById('ratio-input').value,
            clicks: document.getElementById('clicks-input').value,
            temp: document.getElementById('temp-input').value,
            water: document.getElementById('water').value,
            coffee: document.getElementById('coffee').value,
            balance: document.getElementById('balance-slider').value,
            strength: document.getElementById('strength-slider').value,
            ratioTouched: razaoFoiTocada()
        }));
    } catch (e) { /* localStorage indisponível (ex: modo privado) — ignora silenciosamente */ }
}

function loadSettings() {
    try {
        const saved = JSON.parse(localStorage.getItem('brewcalc-settings'));
        if (!saved) { populateRecipeSelect('v60'); return; }
        if (saved.device) document.getElementById('device').value = saved.device;
        populateRecipeSelect(document.getElementById('device').value, saved.recipe);
        if (saved.roast) document.getElementById('roast').value = saved.roast;
        if (saved.ratio) document.getElementById('ratio-input').value = saved.ratio;
        if (saved.clicks) document.getElementById('clicks-input').value = saved.clicks;
        if (saved.temp) document.getElementById('temp-input').value = saved.temp;
        if (saved.water) document.getElementById('water').value = saved.water;
        if (saved.coffee) document.getElementById('coffee').value = saved.coffee;
        if (saved.balance) document.getElementById('balance-slider').value = saved.balance;
        if (saved.strength) document.getElementById('strength-slider').value = saved.strength;
        marcarRazaoTocada(saved.ratioTouched);
    } catch (e) {
        populateRecipeSelect('v60');
    }
}

function updateSliders() {
    const balSlider = document.getElementById('balance-slider');
    const strSlider = document.getElementById('strength-slider');

    document.getElementById('balance-label').innerText = balanceTexts[balSlider.value - 1];
    document.getElementById('strength-label').innerText = strengthTexts[strSlider.value - 1];

    balSlider.style.setProperty('--value', ((balSlider.value - 1) / 4) * 100 + '%');
    strSlider.style.setProperty('--value', ((strSlider.value - 1) / 3) * 100 + '%');

    saveSettings();
}

const balanceTexts = ["Muito Doce", "Mais Doce", "Equilibrado", "Mais Ácido", "Muito Ácido"];
const strengthTexts = ["Baixa (1 Despejo)", "Média-Baixa (2 Despejos)", "Padrão (3 Despejos)", "Alta (4 Despejos)"];

// ---------- Proporção ----------
function onRatioInput() {
    marcarRazaoTocada(true);
    update('ratio');
}

// Trava nos limites só quando o campo perde o foco / é confirmado, para não
// atrapalhar quem está digitando "1" antes de chegar em "16.7"
function onRatioCommit() {
    const input = document.getElementById('ratio-input');
    const val = parseFloat(input.value);
    if (isNaN(val)) return;
    input.value = formatRatio(clampToInput(input, val));
    update('ratio');
}

function restoreOfficialRatio() {
    const recipe = getCurrentRecipe();
    if (!recipe) return;
    document.getElementById('ratio-input').value = formatRatio(recipe.ratio);
    marcarRazaoTocada(false);
    update('ratio');
}

// Mostra a proporção oficial da receita sempre que a ativa divergir dela,
// funcionando ao mesmo tempo como referência visível e botão de restaurar
function updateOfficialRatioButton(recipe) {
    const btn = document.getElementById('ratio-official-btn');
    const oficial = formatRatio(recipe.ratio);
    const ativa = formatRatio(getActiveRatio(recipe));
    const diverge = oficial !== ativa;
    btn.classList.toggle('hidden', !diverge);
    if (diverge) {
        btn.textContent = `oficial 1:${oficial}`;
        btn.setAttribute('aria-label', `Restaurar a proporção oficial da receita, 1 para ${oficial}`);
    }
}

// Deixa visível a dose em que o autor especificou a receita, para o usuário ver
// o número original enquanto escala para o próprio volume
function updateRefDoseLine(recipe, roast) {
    const el = document.getElementById('recipe-ref-dose');
    const partes = [];
    if (recipe.refDose) {
        partes.push(`Dose original: <b>${recipe.refDose.coffee}g / ${recipe.refDose.water}ml</b> (1:${formatRatio(recipe.ratio)})`);
    }
    const temp = getRecipeTemp(recipe, roast);
    if (temp.adjusted) {
        partes.push(`temperatura ajustada pelo app para esta torra`);
    } else if (temp.label.includes('–')) {
        partes.push(`faixa de temperatura da receita: <b>${temp.label}</b>`);
    }
    el.innerHTML = partes.join(' · ');
    el.classList.toggle('hidden', partes.length === 0);
}

function update(source) {
    if (document.getElementById('recipe').value === '__custom_new__') return;
    clearRecipe();

    const recipe = getCurrentRecipe();
    if (!recipe) return;
    const roast = document.getElementById('roast').value;
    const coffeeInput = document.getElementById('coffee');
    const waterInput = document.getElementById('water');
    const ratioInput = document.getElementById('ratio-input');
    const clicksInput = document.getElementById('clicks-input');
    const tempInput = document.getElementById('temp-input');

    document.getElementById('custom-recipe-actions').classList.toggle('hidden', !recipe.isCustom);

    // Evita valores negativos digitados manualmente no campo
    if (parseFloat(coffeeInput.value) < 0) coffeeInput.value = 0;
    if (parseFloat(waterInput.value) < 0) waterInput.value = 0;

    if (source === 'device' || source === 'recipe') {
        // A proporção ajustada pelo usuário sobrevive à troca de aparelho/receita —
        // antes era descartada em silêncio. O botão "oficial" ao lado restaura.
        if (!razaoFoiTocada()) ratioInput.value = formatRatio(recipe.ratio);
        // A água sai da proporção ATIVA, não de recipe.ratio: usar as duas fontes
        // fazia a receita saltar de 500ml para 510ml ao primeiro clique no café.
        const activeRatio = getActiveRatio(recipe);
        const coffeeVal = parseFloat(coffeeInput.value) || 0;
        waterInput.value = Math.round(coffeeVal * activeRatio);
    } else if (source === 'coffee' || source === 'ratio') {
        const activeRatio = getActiveRatio(recipe);
        const coffeeVal = parseFloat(coffeeInput.value) || 0;
        waterInput.value = Math.round(coffeeVal * activeRatio);
    } else if (source === 'water') {
        const activeRatio = getActiveRatio(recipe);
        const waterVal = parseFloat(waterInput.value) || 0;
        coffeeInput.value = (waterVal / activeRatio).toFixed(1);
    }
    // 'roast' e 'load': não mexem em proporção/água/café, só atualizam os textos abaixo

    // Cliques e temperatura voltam para a sugestão da receita ao trocar aparelho/receita/torra;
    // se o usuário digitou um valor próprio, ele fica intocado nos demais casos.
    if (source === 'device' || source === 'recipe' || source === 'roast') {
        clicksInput.value = getDefaultClicks(recipe, roast);
        tempInput.value = getDefaultTemp(recipe, roast);
    }
    // O sufixo "estimado" existia nos dados (clicksEstimated) mas nunca chegava à
    // tela: o app mostrava palpite e medição com a mesma cara
    const estimado = recipe.clicksEstimated ? ' estimado' : '';
    document.getElementById('grind-derived').textContent = `(${clicksToGrindLevel(clicksInput.value)}${estimado})`;

    const activeRatio = getActiveRatio(recipe);

    document.getElementById('ratio-text').innerText = `Proporção: 1:${formatRatio(activeRatio)}`;
    document.getElementById('recipe-note').innerText = recipe.note;
    updateRefDoseLine(recipe, roast);
    updateOfficialRatioButton(recipe);

    const kasuyaPanel = document.getElementById('kasuya-controls');
    if (recipe.hasKasuyaControls) {
        kasuyaPanel.classList.remove('hidden');
        updateSliders();
    } else {
        kasuyaPanel.classList.add('hidden');
    }

    saveSettings();
}




// Destrava no primeiro toque em qualquer lugar, antes mesmo de iniciar o timer
document.addEventListener('pointerdown', ensureAudioReady, { once: true, capture: true });
















function generateRecipe() {
    const recipe = getCurrentRecipe();
    const coffee = parseFloat(document.getElementById('coffee').value);
    const water = parseFloat(document.getElementById('water').value);
    const stepsContainer = document.getElementById('steps');
    const errorEl = document.getElementById('form-error');

    if (!recipe) {
        errorEl.textContent = 'Selecione uma receita antes de calcular.';
        errorEl.classList.remove('hidden');
        document.getElementById('recipe-container').classList.add('hidden');
        return;
    }

    if (!coffee || !water || coffee <= 0 || water <= 0) {
        errorEl.textContent = 'Informe valores de café e água maiores que zero.';
        errorEl.classList.remove('hidden');
        document.getElementById('recipe-container').classList.add('hidden');
        return;
    }
    errorEl.classList.add('hidden');

    stepsContainer.innerHTML = '';
    document.getElementById('recipe-container').classList.remove('hidden');

    const activeClicks = document.getElementById('clicks-input').value;
    const activeGrindLevel = clicksToGrindLevel(activeClicks);
    const activeTemp = document.getElementById('temp-input').value;
    const summaryEl = document.createElement('div');
    summaryEl.className = 'step';
    summaryEl.style.borderLeftColor = '#6b7280';
    summaryEl.innerHTML = `
        <div class="step-time">⚙️</div>
        <div class="step-desc">${activeClicks} cliques <b>(${activeGrindLevel})</b> · ${activeTemp}°C</div>
    `;
    stepsContainer.appendChild(summaryEl);

    // buildSteps devolve DESCRITORES (alvos acumulados); renderRecipeSteps faz o
    // arredondamento num lugar só, garantindo que os despejos somem o alvo final
    let descritores;
    if (recipe.hasKasuyaControls) {
        const balVal = parseInt(document.getElementById('balance-slider').value);
        const strVal = parseInt(document.getElementById('strength-slider').value);
        descritores = recipe.buildSteps(coffee, water, balVal, strVal);
    } else {
        descritores = recipe.buildSteps(coffee, water);
    }
    const steps = renderRecipeSteps(descritores, coffee, water);

    steps.forEach((s, i) => {
        const el = document.createElement('div');
        el.className = 'step step-timed';
        el.dataset.stepIndex = i;
        el.innerHTML = `
            <div class="step-time">${s.time}</div>
            <div class="step-desc">${s.desc}</div>
        `;
        stepsContainer.appendChild(el);
    });

    initTimerForSteps(steps);
}

function copyRecipe() {
    const recipe = getCurrentRecipe();
    if (!recipe) return;
    const btn = document.querySelector('[aria-label="Copiar receita"]');
    const stepsContainer = document.getElementById('steps');
    const lines = Array.from(stepsContainer.children).map(el => {
        const time = el.querySelector('.step-time').innerText;
        const desc = el.querySelector('.step-desc').innerText;
        return `${time}  ${desc}`;
    });
    const text = `BrewCalc — ${recipe.label}\n${lines.join('\n')}`;

    // Antes, sem clipboard API ou com a promessa rejeitada o botão não fazia
    // absolutamente nada — o usuário não tinha como saber que falhou
    const feedback = msg => {
        if (!btn) return;
        const original = btn.dataset.rotulo || btn.textContent;
        btn.dataset.rotulo = original;
        btn.textContent = msg;
        setTimeout(() => { btn.textContent = btn.dataset.rotulo; }, 1800);
    };

    if (!navigator.clipboard) {
        feedback('Indisponível');
        return;
    }
    navigator.clipboard.writeText(text)
        .then(() => feedback('Copiado!'))
        .catch(() => feedback('Falhou'));
}

// ---------- Abas ----------
function switchTab(tab) {
    const calcBtn = document.getElementById('tab-btn-calc');
    const reviewBtn = document.getElementById('tab-btn-review');
    const calcPanel = document.getElementById('tab-calc');
    const reviewPanel = document.getElementById('tab-review');

    const goingToReview = tab === 'review';
    calcBtn.classList.toggle('active', !goingToReview);
    reviewBtn.classList.toggle('active', goingToReview);
    calcBtn.setAttribute('aria-selected', String(!goingToReview));
    reviewBtn.setAttribute('aria-selected', String(goingToReview));
    calcPanel.classList.toggle('hidden', goingToReview);
    reviewPanel.classList.toggle('hidden', !goingToReview);

    if (goingToReview) {
        // Preenche temperatura/cliques com o que está na calculadora, só se estiver vazio
        const tempField = document.getElementById('review-temp');
        if (!tempField.value) tempField.value = document.getElementById('temp-input').value;
        const clicksField = document.getElementById('review-clicks');
        if (!clicksField.value) clicksField.value = document.getElementById('clicks-input').value;
        onReviewClicksInput();
        updateBrewSummary();
    }
}


function updateBrewSummary() {
    const { method, dose, settings } = getBrewSummary();
    // `method` carrega o nome da receita, que em receita importada é texto de terceiro
    document.getElementById('brew-summary').innerHTML =
        `Preparado com: <b>${escapeHtml(method)}</b><br>${escapeHtml(dose)} · ${escapeHtml(settings)}`;
}






function onRoastDateChange() {
    const input = document.getElementById('roast-date');
    const display = document.getElementById('roast-date-display');
    const formatted = formatDateBR(input.value);
    if (formatted) {
        display.textContent = formatted;
        display.classList.remove('placeholder');
    } else {
        display.textContent = 'dd/mm/aaaa';
        display.classList.add('placeholder');
    }
}








// ---------- Importar receita recebida via QR / link ----------
let pendingImportData = null;

function checkImportFromUrl() {
    const hash = location.hash;
    if (!hash || hash.indexOf('#r=') !== 0) return;
    const param = hash.slice(3);
    let data;
    try {
        data = decodeRecipeFromParam(param);
    } catch (e) {
        history.replaceState(null, '', location.pathname + location.search);
        return;
    }
    if (!deviceData[data.device]) {
        history.replaceState(null, '', location.pathname + location.search);
        return;
    }
    pendingImportData = data;
    const deviceLabel = deviceData[data.device].label;

    // Montado por DOM com textContent: este bloco recebe o nome da receita vindo
    // do link e rodava ANTES de qualquer clique do usuário, então um innerHTML
    // aqui executava JS só por abrir o QR.
    const descEl = document.getElementById('import-recipe-desc');
    descEl.textContent = '';
    const nome = document.createElement('b');
    nome.textContent = data.name;
    descEl.appendChild(nome);
    descEl.appendChild(document.createElement('br'));
    descEl.appendChild(document.createTextNode(`${deviceLabel} · ${data.steps.length} passo(s) de despejo`));

    openImportOverlay();
}

// ---------- Diálogo de importação (modal acessível) ----------
let importFocoAnterior = null;

function openImportOverlay() {
    importFocoAnterior = document.activeElement;
    document.getElementById('import-overlay').classList.remove('hidden');
    const btn = document.getElementById('import-confirm-btn');
    if (btn) btn.focus();
    document.addEventListener('keydown', onImportKeydown);
}

function closeImportOverlay() {
    document.getElementById('import-overlay').classList.add('hidden');
    document.removeEventListener('keydown', onImportKeydown);
    if (importFocoAnterior && importFocoAnterior.focus) importFocoAnterior.focus();
    importFocoAnterior = null;
}

// Esc fecha e Tab fica preso dentro do diálogo — sem isso o teclado passeia
// pela página atrás do overlay, que continua visível e clicável
function onImportKeydown(e) {
    if (e.key === 'Escape') { e.preventDefault(); dismissImport(); return; }
    if (e.key !== 'Tab') return;
    const foco = document.getElementById('import-overlay').querySelectorAll('button');
    if (foco.length === 0) return;
    const primeiro = foco[0];
    const ultimo = foco[foco.length - 1];
    if (e.shiftKey && document.activeElement === primeiro) {
        e.preventDefault();
        ultimo.focus();
    } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primeiro.focus();
    }
}

function dismissImport() {
    pendingImportData = null;
    closeImportOverlay();
    history.replaceState(null, '', location.pathname + location.search);
}

function confirmImport() {
    if (!pendingImportData) return;
    const data = pendingImportData;
    guardarReceitaImportada(data);

    closeImportOverlay();
    history.replaceState(null, '', location.pathname + location.search);

    document.getElementById('device').value = data.device;
    populateRecipeSelect(data.device, data.id);
    closeRecipeBuilder();
    update('recipe');

    pendingImportData = null;
}
















// ---------- Ligação dos controles ----------
// Cada controle do HTML declara o nome de uma ação (data-acao / data-entrada /
// data-mudanca) e três listeners delegados no document resolvem esse nome aqui.
// Duas razões para não usar onclick inline: handler em atributo não sobrevive a
// módulo ES (o escopo do módulo não é visível pelo HTML), e não dá para enumerar
// — com o mapa, um teste percorre todo [data-acao] do HTML e confirma que existe
// função correspondente, cobrindo os ~40 controles de uma vez.
//
// Cada ação recebe o elemento que disparou, o que atende os controles criados
// dinamicamente: a linha de passo customizado e os sete sliders de avaliação,
// que nascem de template string e antes precisavam carregar o handler embutido.
const ACOES = {
    // Cabeçalho e abas
    alternarTema: () => toggleTheme(),
    abaCalculadora: () => switchTab('calc'),
    abaAvaliacao: () => switchTab('review'),

    // Seleção de receita
    aparelho: () => onDeviceChange(),
    receita: () => onRecipeSelectChange(),
    torra: () => update('roast'),
    editarReceita: () => editCustomRecipe(),
    excluirReceita: () => deleteCustomRecipe(),

    // Temperatura e moagem
    tempMenos: () => adjustTemp(-1),
    tempMais: () => adjustTemp(1),
    tempManual: () => saveSettings(),
    cliquesMenos: () => adjustClicks(-1),
    cliquesMais: () => adjustClicks(1),
    cliquesManual: () => onClicksInput(),

    // Proporção, água e café
    razaoMenos: () => adjustRatio(-0.5),
    razaoMais: () => adjustRatio(0.5),
    razaoOficial: () => restoreOfficialRatio(),
    razaoDigitada: () => onRatioInput(),
    razaoConfirmada: () => onRatioCommit(),
    aguaMenos: () => adjust('water', -10),
    aguaMais: () => adjust('water', 10),
    aguaDigitada: () => update('water'),
    cafeMenos: () => adjust('coffee', -1),
    cafeMais: () => adjust('coffee', 1),
    cafeDigitado: () => update('coffee'),

    // Construtor de receita customizada
    adicionarPasso: () => addCustomStepRow(),
    removerPasso: el => el.closest('.custom-step-row').remove(),
    cliquesReceitaCustom: () => onCustomClicksInput(),
    cancelarReceita: () => cancelCustomRecipeBuilder(),
    salvarReceita: () => saveCustomRecipe(),

    // Kasuya: força e balanço
    kasuyaSlider: () => { updateSliders(); clearRecipe(); },

    // Receita e timer
    calcularReceita: () => generateRecipe(),
    copiarReceita: () => copyRecipe(),
    alternarTimer: () => toggleTimer(),
    zerarTimer: () => resetTimer(),

    // Avaliação sensorial
    dataTorra: () => onRoastDateChange(),
    avaliacaoCliquesMenos: () => adjustReviewClicks(-1),
    avaliacaoCliquesMais: () => adjustReviewClicks(1),
    avaliacaoCliquesManual: () => onReviewClicksInput(),
    avaliacaoNota: el => onRatingInput(el.id),

    // Compartilhamento e overlays
    gerarImagem: () => generateShareImage(),
    baixarImagem: () => downloadShareImage(),
    compartilharImagem: () => shareImage(),
    ignorarImportacao: () => dismissImport(),
    confirmarImportacao: () => confirmImport(),
};

// click precisa de closest (o alvo pode ser um filho do botão); input e change
// nascem no próprio campo, então basta olhar o alvo.
document.addEventListener('click', e => {
    const el = e.target.closest('[data-acao]');
    if (el) ACOES[el.dataset.acao](el, e);
});
document.addEventListener('input', e => {
    const nome = e.target.dataset.entrada;
    if (nome) ACOES[nome](e.target, e);
});
document.addEventListener('change', e => {
    const nome = e.target.dataset.mudanca;
    if (nome) ACOES[nome](e.target, e);
});

// Superfície declarada para os testes alcançarem o app de dentro do iframe.
// Necessária porque escopo de módulo não é acessível de fora.
//
// Só o que precisa da tela viva entra aqui: a lógica pura o tests.html importa
// direto dos módulos, que é onde ela deve ser exercitada. ACOES é o que permite
// varrer todo [data-acao] do HTML e conferir que cada controle resolve.
window.BrewCalc = { ACOES, onDeviceChange };

// ---------- Service worker: faz o app abrir sem rede ----------
// Só registra em contexto seguro (https ou localhost); em file:// os navegadores
// recusam, então a ausência de service worker é esperada e não é erro.
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(() => {
            /* sem service worker o app funciona igual, só não abre offline */
        });
    });
}

// Salvar, excluir ou cancelar uma receita customizada muda o que a tela precisa
// mostrar, mas quem sabe redesenhar é este arquivo. Sem este registro o módulo de
// receitas fica com o callback vazio: a receita é gravada no localStorage e não
// aparece no seletor até recarregar a página.
registrarRedesenho((deviceKey, recipeKey) => {
    // Cancelar não mexeu na lista, só na seleção — aí não há o que repopular.
    if (deviceKey) populateRecipeSelect(deviceKey, recipeKey);
    update('recipe');
});

syncThemeToggleIcon();
buildRatingSliders();
loadCustomRecipes();
loadSettings();
update('load');
checkImportFromUrl();

// A URL do QR muda só o fragmento (#r=...). Se o app já estiver aberto na aba que
// o navegador reaproveita — o caso comum no Android, em que o leitor de QR manda o
// link para uma aba existente — a página NÃO recarrega, e a importação, que só
// rodava na inicialização, nunca acontecia: o app abria e ignorava a receita.
window.addEventListener('hashchange', checkImportFromUrl);
