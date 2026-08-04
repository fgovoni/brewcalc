// Receitas criadas pelo usuário: construtor, validação e persistência.
//
// Ficam no localStorage, que é o único armazenamento do app — não há conta nem
// servidor. Por isso normalizeCustomRecipe existe: receita salva por uma versão
// antiga precisa continuar abrindo, e migrar em silêncio é melhor do que perder.

import { clicksToGrindLevel, escapeHtml, formatTime, parseTimeToSeconds } from './formato.js';
import { deviceData } from './receitas-dados.js';
import { normalizeCustomRecipe, temMeta } from './receitas.js';
import { clearRecipe } from './timer.js';

// Salvar ou excluir receita muda o que a tela precisa mostrar, mas quem sabe
// redesenhar é o app. Chamar update() daqui criaria import circular entre este
// módulo e o app.js; o callback registrado no início inverte a dependência e
// deixa a direção única: app.js -> receitas-custom.js, nunca de volta.
let aoMudarReceitas = () => {};

function registrarRedesenho(fn) {
    aoMudarReceitas = fn;
}

// ---------- Receitas customizadas (criadas pelo usuário) ----------
let customRecipes = [];

let editingCustomId = null;

function loadCustomRecipes() {
    try {
        const salvas = JSON.parse(localStorage.getItem('brewcalc-custom-recipes')) || [];
        customRecipes = salvas.map(normalizeCustomRecipe);
    } catch (e) {
        customRecipes = [];
    }
}

function saveCustomRecipes() {
    try {
        localStorage.setItem('brewcalc-custom-recipes', JSON.stringify(customRecipes));
    } catch (e) { /* localStorage indisponível — ignora silenciosamente */ }
}

function addCustomStepRow(time, amount, desc) {
    const list = document.getElementById('custom-steps-list');
    const row = document.createElement('div');
    row.className = 'custom-step-row';
    // Cabeçalho é estático, pode ser innerHTML
    row.innerHTML = `
        <div class="custom-step-header">
            <span>Passo</span>
            <button type="button" data-acao="removerPasso" aria-label="Remover passo">Remover</button>
        </div>
    `;

    // Já os valores vêm do usuário ou de um link importado: criados via DOM com
    // .value, nunca interpolados em atributo (uma aspa dupla escapava do value=)
    const criarCampo = (classe, tipo, placeholder, valor) => {
        const input = document.createElement('input');
        input.type = tipo;
        input.className = `text-input ${classe}`;
        input.placeholder = placeholder;
        input.style.marginBottom = '0';
        input.value = valor === undefined || valor === null ? '' : valor;
        return input;
    };

    const grid = document.createElement('div');
    grid.className = 'field-grid';
    grid.style.gap = '8px';
    grid.style.marginBottom = '8px';
    grid.appendChild(criarCampo('step-time-input', 'text', 'Tempo (0:45)', time));
    grid.appendChild(criarCampo('step-amount-input', 'number', 'Meta (g) — opcional', amount));
    row.appendChild(grid);

    row.appendChild(criarCampo('step-desc-input', 'text', 'Descrição (ex: Bloom, despejo circular)', desc));
    list.appendChild(row);
}

function openRecipeBuilder(editData) {
    editingCustomId = editData ? editData.id : null;
    document.getElementById('official-recipe-fields').classList.add('hidden');
    document.getElementById('generate-btn').classList.add('hidden');
    document.getElementById('kasuya-controls').classList.add('hidden');
    document.getElementById('custom-recipe-actions').classList.add('hidden');
    clearRecipe();
    document.getElementById('recipe-builder-card').classList.remove('hidden');
    document.getElementById('custom-recipe-error').classList.add('hidden');

    document.getElementById('custom-steps-list').innerHTML = '';

    if (editData) {
        document.getElementById('custom-name').value = editData.name;
        document.getElementById('custom-ref-coffee').value = editData.refCoffee;
        document.getElementById('custom-ref-water').value = editData.refWater;
        document.getElementById('custom-clicks').value = editData.clicksDefault;
        document.getElementById('custom-temp').value = editData.tempC;
        editData.steps.forEach(s => addCustomStepRow(s.time, temMeta(s.amount) ? Math.round(s.amount) : '', s.desc));
    } else {
        const refWater = parseFloat(document.getElementById('water').value) || 500;
        document.getElementById('custom-name').value = '';
        document.getElementById('custom-ref-coffee').value = document.getElementById('coffee').value || 30;
        document.getElementById('custom-ref-water').value = refWater;
        document.getElementById('custom-clicks').value = 18;
        document.getElementById('custom-temp').value = 93;
        addCustomStepRow('0:00', Math.round(refWater * 0.12), 'Bloom');
        addCustomStepRow('0:45', Math.round(refWater * 0.6), 'Despejo circular');
        addCustomStepRow('1:15', refWater, 'Despejo final');
    }
    onCustomClicksInput();
}

function onCustomClicksInput() {
    document.getElementById('custom-grind-derived').textContent = `(${clicksToGrindLevel(document.getElementById('custom-clicks').value)})`;
}

function closeRecipeBuilder() {
    document.getElementById('recipe-builder-card').classList.add('hidden');
    document.getElementById('official-recipe-fields').classList.remove('hidden');
    document.getElementById('generate-btn').classList.remove('hidden');
}

function cancelCustomRecipeBuilder() {
    closeRecipeBuilder();
    const recipeSelect = document.getElementById('recipe');
    const firstReal = Array.from(recipeSelect.options).find(o => o.value !== '__custom_new__');
    if (firstReal) recipeSelect.value = firstReal.value;
    aoMudarReceitas();
}

function showBuilderError(msg) {
    const el = document.getElementById('custom-recipe-error');
    el.textContent = msg;
    el.classList.remove('hidden');
}

function saveCustomRecipe() {
    const name = document.getElementById('custom-name').value.trim();
    const refCoffee = parseFloat(document.getElementById('custom-ref-coffee').value);
    const refWater = parseFloat(document.getElementById('custom-ref-water').value);
    const clicksDefault = parseInt(document.getElementById('custom-clicks').value);
    const tempC = parseFloat(document.getElementById('custom-temp').value);
    const rows = Array.from(document.querySelectorAll('.custom-step-row'));

    if (!name) { showBuilderError('Dê um nome pra sua receita.'); return; }
    if (!refCoffee || !refWater || refCoffee <= 0 || refWater <= 0) { showBuilderError('Informe café e água de referência maiores que zero.'); return; }
    if (rows.length === 0) { showBuilderError('Adicione pelo menos um passo.'); return; }

    const steps = [];
    for (const row of rows) {
        const time = row.querySelector('.step-time-input').value.trim();
        const metaBruta = row.querySelector('.step-amount-input').value.trim();
        const desc = row.querySelector('.step-desc-input').value.trim();
        if (!/^\d{1,2}:\d{2}$/.test(time)) { showBuilderError(`Tempo inválido: "${time}". Use o formato m:ss, ex: 0:45.`); return; }
        if (!desc) { showBuilderError('Cada passo precisa de uma descrição curta.'); return; }

        // Meta em branco = passo só de instrução, sem despejo (ex: "aguarde a
        // drenagem", "mexa a crosta"). Se informada, precisa ser positiva.
        let amount = null;
        if (metaBruta !== '') {
            amount = parseFloat(metaBruta);
            if (!temMeta(amount)) {
                showBuilderError('Se informar uma meta, ela precisa ser maior que zero — ou deixe em branco para um passo só de instrução.');
                return;
            }
        }
        // Guardado em gramas absolutos: um percentual arredondado perdia precisão
        // justamente ao reescalar a receita para outro volume
        steps.push({ time, amount, desc });
    }

    if (!steps.some(s => temMeta(s.amount))) {
        showBuilderError('Pelo menos um passo precisa de uma meta em gramas, senão a receita não tem o que despejar.');
        return;
    }

    // Os alvos são acumulados na balança, então precisam ser crescentes.
    // Passos sem meta são ignorados aqui: não movem a balança.
    const comMeta = steps.filter(s => temMeta(s.amount));
    for (let i = 1; i < comMeta.length; i += 1) {
        if (comMeta[i].amount < comMeta[i - 1].amount) {
            showBuilderError(`As metas são o total acumulado na balança, então precisam crescer. Uma meta de ${comMeta[i].amount}g vem depois de ${comMeta[i - 1].amount}g.`);
            return;
        }
    }

    const deviceKey = document.getElementById('device').value;
    const id = editingCustomId || `custom-${Date.now()}`;
    const data = { id, device: deviceKey, name, refCoffee, refWater, clicksDefault, tempC, steps };

    const existingIdx = customRecipes.findIndex(r => r.id === id);
    if (existingIdx >= 0) customRecipes[existingIdx] = data; else customRecipes.push(data);
    saveCustomRecipes();

    closeRecipeBuilder();
    aoMudarReceitas(deviceKey, id);
}

function editCustomRecipe() {
    const recipeKey = document.getElementById('recipe').value;
    const data = customRecipes.find(r => r.id === recipeKey);
    if (data) openRecipeBuilder(data);
}

function deleteCustomRecipe() {
    const recipeKey = document.getElementById('recipe').value;
    if (!customRecipes.some(r => r.id === recipeKey)) return; // nada a excluir
    if (!confirm('Excluir esta receita? Essa ação não pode ser desfeita.')) return;
    customRecipes = customRecipes.filter(r => r.id !== recipeKey);
    saveCustomRecipes();
    const deviceKey = document.getElementById('device').value;
    aoMudarReceitas(deviceKey);
}

// Guarda receita vinda de link compartilhado. Existe para o app não precisar mexer
// no array direto: quem conhece o formato salvo e a hora de persistir é este módulo.
function guardarReceitaImportada(data) {
    const existente = customRecipes.findIndex(r => r.id === data.id);
    if (existente >= 0) customRecipes[existente] = data; else customRecipes.push(data);
    saveCustomRecipes();
}

// Dados "crus" da receita customizada (formato salvo no localStorage) —
// usados para gerar o link/QR de compartilhamento. Só existe para receitas
// customizadas; receitas oficiais (Hoffmann, Kasuya etc.) não retornam nada aqui.
function getCurrentCustomRawData() {
    const recipeKey = document.getElementById('recipe').value;
    return customRecipes.find(r => r.id === recipeKey) || null;
}

export {
    registrarRedesenho, customRecipes, loadCustomRecipes, openRecipeBuilder, addCustomStepRow,
    closeRecipeBuilder, onCustomClicksInput, cancelCustomRecipeBuilder, saveCustomRecipe,
    editCustomRecipe, deleteCustomRecipe, getCurrentCustomRawData, guardarReceitaImportada,
};
