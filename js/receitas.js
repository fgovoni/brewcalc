// Motor de receitas: converte o descritor de uma receita em passos concretos.
//
// Tudo aqui é puro — recebe café, água e controles, devolve os passos. É o que
// sustenta a promessa do app: a soma dos despejos fecha exatamente no alvo final,
// em qualquer volume. Sem DOM, para poder ser exercitado à exaustão pelos testes.

import { escapeHtml } from './formato.js';

function getDefaultClicks(recipe, roast) {
    if (recipe.clicksByRoast) return recipe.clicksByRoast[roast];
    if (recipe.clicksDefault) return recipe.clicksDefault;
    return 18;
}

// Temperatura como dado estruturado, não como string de exibição. Antes, uma
// receita que especificava "90°C - 95°C" tinha o número extraído por regex e o
// app ficava sempre com o limite inferior, escondendo a faixa do autor.
// Retorna { value, label, adjusted }:
//   value    — número que alimenta o campo
//   label    — o que a receita de fato especifica (pode ser faixa)
//   adjusted — true quando o valor é ajuste do app por torra, não número do autor
function getRecipeTemp(recipe, roast) {
    const spec = recipe.tempByRoast && recipe.tempByRoast[roast];
    if (spec !== undefined) {
        if (Array.isArray(spec)) return { value: spec[0], label: `${spec[0]}–${spec[1]}°C`, adjusted: false };
        return { value: spec, label: `${spec}°C`, adjusted: false };
    }
    if (recipe.tempBase !== undefined) {
        if (roast === 'light') {
            const v = Math.min(99, recipe.tempBase + 3);
            return { value: v, label: `${v}°C`, adjusted: true };
        }
        if (roast === 'dark') {
            const v = Math.max(78, recipe.tempBase - 5);
            return { value: v, label: `${v}°C`, adjusted: true };
        }
        return { value: recipe.tempBase, label: `${recipe.tempBase}°C`, adjusted: false };
    }
    return { value: 92, label: '92°C', adjusted: true };
}

function getDefaultTemp(recipe, roast) {
    return getRecipeTemp(recipe, roast).value;
}

// ---------- Motor de receitas ----------
// Cada passo é declarado como DADO, não como texto pronto:
//   { time, label, to, hint }  -> despejo, onde `to(coffee, water)` é o ALVO ACUMULADO em gramas
//   { time, desc }             -> instrução sem despejo (mexer, aguardar, prensar)
//
// O arredondamento acontece num lugar só (renderRecipeSteps): os alvos acumulados
// são arredondados e cada despejo é a DIFERENÇA entre alvos consecutivos já
// arredondados. Assim a soma dos despejos fecha exatamente no alvo final, por
// construção — antes, arredondar cada despejo e cada alvo em separado fazia com
// que 250ml em 4 despejos mandasse despejar 252g.
const alvo = fn => (typeof fn === 'function' ? fn : () => fn);

const fracaoDaAgua = f => (c, w) => w * f;

function renderRecipeSteps(descriptors, coffee, water) {
    let anterior = 0;
    return descriptors.map(d => {
        if (d.to === undefined) return { time: d.time, desc: d.desc };
        const target = Math.round(alvo(d.to)(coffee, water));
        const pour = Math.max(0, target - anterior);
        anterior = target;
        const hint = d.hint ? ` ${d.hint}` : '';
        return {
            time: d.time,
            desc: `<b>${d.label}:</b> despeje <b>${pour}g</b> — alvo <b>${target}g</b> na balança.${hint}`,
            pour, target
        };
    });
}

function buildCustomRecipeObject(data) {
    const ratio = data.refWater / data.refCoffee;
    return {
        label: data.name,
        ratio: ratio,
        refDose: { coffee: data.refCoffee, water: data.refWater },
        clicksDefault: data.clicksDefault,
        tempBase: data.tempC,
        note: 'Receita criada por você.',
        hasKasuyaControls: false,
        isCustom: true,
        customId: data.id,
        // O texto do passo vem do usuário (ou de um link importado), então é
        // escapado antes de entrar no HTML montado por renderRecipeSteps.
        // Passo sem meta em gramas vira instrução pura (ex: "aguarde a drenagem"),
        // sem despejo nem alvo.
        buildSteps: () => data.steps.map(s => (
            temMeta(s.amount)
                ? { time: s.time, label: escapeHtml(s.desc), to: fracaoDaAgua(s.amount / data.refWater) }
                : { time: s.time, desc: escapeHtml(s.desc) }
        ))
    };
}

// A meta em gramas é opcional: um passo sem ela é só uma instrução no tempo certo
function temMeta(amount) {
    return typeof amount === 'number' && isFinite(amount) && amount > 0;
}

// Passos passaram a guardar a quantidade absoluta em gramas (exata) em vez de um
// percentual arredondado. Converte o formato antigo já salvo no localStorage,
// preservando os passos sem meta (que valiam pct: null).
function normalizeCustomRecipe(data) {
    if (!data || !Array.isArray(data.steps)) return data;
    data.steps = data.steps.map(s => {
        if (s.amount !== undefined) return s;
        const convertido = temMeta(s.pct) ? s.pct * data.refWater : null;
        return { time: s.time, amount: convertido, desc: s.desc };
    });
    return data;
}

export {
    alvo, fracaoDaAgua, renderRecipeSteps,
    getDefaultClicks, getRecipeTemp, getDefaultTemp,
    buildCustomRecipeObject, temMeta, normalizeCustomRecipe,
};
