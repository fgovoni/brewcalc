// O que o usuário tem selecionado na tela agora.
//
// Ponte entre os campos do formulário e o motor de receitas: lê os inputs, cai no
// padrão da receita quando o campo está vazio e devolve dado já resolvido. Existe
// como módulo próprio porque tanto o app quanto o cartão de compartilhamento
// precisam da mesma leitura — e o cartão não deveria depender do app para isso.

import { clicksToGrindLevel, formatRatio } from './formato.js';
import { deviceData } from './receitas-dados.js';
import { getDefaultClicks, getDefaultTemp, buildCustomRecipeObject } from './receitas.js';
import { customRecipes } from './receitas-custom.js';

function getActiveClicks(recipe, roast) {
    const val = parseInt(document.getElementById('clicks-input').value);
    return (!isNaN(val) && val > 0) ? val : getDefaultClicks(recipe, roast);
}

function getActiveTemp(recipe, roast) {
    const val = parseInt(document.getElementById('temp-input').value);
    return (!isNaN(val) && val > 0) ? val : getDefaultTemp(recipe, roast);
}

function getCurrentRecipe() {
    const deviceKey = document.getElementById('device').value;
    const recipeKey = document.getElementById('recipe').value;
    if (deviceData[deviceKey].recipes[recipeKey]) return deviceData[deviceKey].recipes[recipeKey];
    const custom = customRecipes.find(r => r.id === recipeKey);
    if (custom) return buildCustomRecipeObject(custom);
    return null;
}

// Marca que o usuário assumiu o controle da proporção. Enquanto for false, trocar
// de receita adota a proporção oficial dela; depois de true, a escolha do usuário
// é preservada e a oficial fica a um toque de distância no botão ao lado.
//
// Mora aqui junto de getActiveRatio, que é quem lê o valor: separar os dois foi o
// que causou a regressão da dose original do autor. Vai com acessores porque
// binding exportado não pode ser reatribuído de fora do módulo.
let ratioTouched = false;

function razaoFoiTocada() {
    return ratioTouched;
}

function marcarRazaoTocada(valor) {
    ratioTouched = !!valor;
}

// A proporção nunca é arredondada para inteiro: é o eixo que o usuário ajusta
// livremente e precisa bater exatamente com a água e o café exibidos.
//
// Enquanto o usuário não mexer, vale a razão EXATA da receita, não o valor
// exibido no campo. O campo mostra uma casa decimal (16.7 para os 16,6667 do
// Hoffmann); calcular a água a partir dele corromperia a dose original do autor
// — 30g/500ml virava 30g/501ml só de trocar de aparelho e voltar.
function getActiveRatio(recipe) {
    if (!ratioTouched) return recipe.ratio;
    const val = parseFloat(document.getElementById('ratio-input').value);
    return (!isNaN(val) && val > 0) ? val : recipe.ratio;
}

function getBrewSummary() {
    const deviceKey = document.getElementById('device').value;
    const recipe = getCurrentRecipe();
    // Sem receita selecionada (ex: construtor aberto) o resumo fica neutro em vez
    // de estourar um TypeError ao acessar recipe.label
    if (!recipe) return { method: '—', dose: '—', settings: '—' };
    const roast = document.getElementById('roast').value;
    const deviceLabel = deviceData[deviceKey].label;
    const shortRecipeLabel = recipe.label.replace(/\s*\([^)]*\)\s*$/, '');
    const ratio = getActiveRatio(recipe);
    const coffee = document.getElementById('coffee').value;
    const water = document.getElementById('water').value;
    const clicks = getActiveClicks(recipe, roast);
    const grindLevel = clicksToGrindLevel(clicks);
    const temp = getActiveTemp(recipe, roast);
    const method = `${deviceLabel} · ${shortRecipeLabel}`;
    const dose = `${coffee}g : ${water}ml (1:${formatRatio(ratio)})`;
    const settings = `${clicks} cliques (${grindLevel}) · ${temp}°C`;
    return { method, dose, settings };
}

export {
    getActiveClicks, getActiveTemp, getActiveRatio, getCurrentRecipe, getBrewSummary,
    razaoFoiTocada, marcarRazaoTocada,
};
