// As receitas — o produto do app.
//
// Cada entrada foi conferida contra a fonte original do barista; ver
// AUDITORIA-RECEITAS.md. Mexer em número aqui muda o café de alguém: confira a
// fonte antes, e rode os testes depois (eles verificam que a soma dos despejos
// continua fechando no alvo em todos os volumes).

import { alvo, fracaoDaAgua } from './receitas.js';
import { formatTime } from './formato.js';

// Percentuais dos dois primeiros despejos do 4:6 por posição do controle de balanço
const KASUYA_BALANCE = {
    1: [0.12, 0.28], 2: [0.16, 0.24], 3: [0.20, 0.20], 4: [0.24, 0.16], 5: [0.28, 0.12]
};

// As proporções (`ratio`) são sempre a razão exata água:café da dose de referência
// do autor — nunca um valor arredondado. `refDose` guarda essa dose original para
// exibição, e `source` aponta a publicação que sustenta cada receita.
const deviceData = {
    v60: {
        label: 'V60',
        recipes: {
            hoffmann: {
                label: 'James Hoffmann',
                ratio: 500 / 30,
                refDose: { coffee: 30, water: 500 },
                tempBase: 95,
                clicksByRoast: { light: 17, medium: 18, dark: 19 },
                clicksEstimated: true,
                source: 'https://www.youtube.com/watch?v=AI4ynXzkSQo',
                note: 'Receita "Ultimate V60" de James Hoffmann, Campeão Mundial de Barista 2007. Bloom de 2x o peso do café, depois dois despejos até 60% e 100% da água.',
                hasKasuyaControls: false,
                buildSteps: () => [
                    { time: '0:00', label: 'Bloom', to: c => c * 2, hint: 'Balance o V60 suavemente para molhar todo o pó.' },
                    { time: '0:45', label: '1º Despejo', to: (c, w) => w * 0.6, hint: 'Despeje em círculos.' },
                    { time: '1:15', label: '2º Despejo', to: (c, w) => w, hint: 'Despeje lentamente.' },
                    { time: '1:45', desc: 'Dê uma leve mexida com uma colher (1x cada lado) e balance o V60 para planificar a cama de café.' },
                    { time: '3:30', desc: 'Tempo estimado para drenagem total.' }
                ]
            },
            kasuya: {
                label: 'Tetsu Kasuya 4:6 — Campeão Mundial 2016',
                ratio: 15,
                refDose: { coffee: 20, water: 300 },
                tempByRoast: { light: 93, medium: 88, dark: 83 },
                clicksByRoast: { light: 20, medium: 21, dark: 22 },
                clicksEstimated: true,
                source: 'https://www.timer.coffee/recipes/v60/tetsu-kasuya-4-6-method/',
                note: 'Método 4:6 de Tetsu Kasuya, Campeão Mundial de Brewers Cup 2016. Os dois primeiros despejos (40% da água) ajustam doçura/acidez; o restante (60%) ajusta a força.',
                hasKasuyaControls: true,
                buildSteps(coffee, water, balVal, strVal) {
                    const [f1, f2] = KASUYA_BALANCE[balVal] || KASUYA_BALANCE[3];
                    const n = strVal;
                    const steps = [];
                    let frac = 0;
                    let t = 0;

                    frac += f1;
                    steps.push({ time: formatTime(t), label: 'Bloom', to: fracaoDaAgua(frac) });
                    t += 45;

                    frac += f2;
                    steps.push({ time: formatTime(t), label: '2º Despejo', to: fracaoDaAgua(frac) });
                    t += 45;

                    for (let i = 0; i < n; i++) {
                        frac += 0.60 / n;
                        steps.push({ time: formatTime(t), label: `Despejo ${i + 3}`, to: fracaoDaAgua(frac) });
                        t += 45;
                    }

                    steps.push({ time: formatTime(t), desc: 'Fim da extração. Remova o filtro.' });
                    return steps;
                }
            }
        }
    },
    chemex: {
        label: 'Chemex',
        recipes: {
            hoffmann: {
                label: 'James Hoffmann',
                ratio: 500 / 30,
                refDose: { coffee: 30, water: 500 },
                tempBase: 95,
                // Mesmos cliques do V60: a fonte descreve a moagem do Chemex como
                // média-fina e a técnica como praticamente a mesma do V60
                clicksByRoast: { light: 17, medium: 18, dark: 19 },
                clicksEstimated: true,
                source: 'https://www.timer.coffee/recipes/chemex/james-hoffmann-chemex-recipe/',
                note: 'Adaptação de James Hoffmann do método V60 para o Chemex — bloom de 2x o café, despejos até 60% e 100%, com uma sacudida extra ao final.',
                hasKasuyaControls: false,
                buildSteps: () => [
                    { time: '0:00', label: 'Bloom', to: c => c * 2, hint: 'Sature todo o pó.' },
                    { time: '0:10', desc: 'Mexa gentilmente e deixe florescer.' },
                    { time: '0:45', label: '1º Despejo', to: (c, w) => w * 0.6, hint: 'Em círculos, quebrando grumos.' },
                    { time: '1:15', label: '2º Despejo', to: (c, w) => w },
                    { time: '1:45', desc: 'Mexa 1x no sentido horário e 1x no anti-horário com uma colher.' },
                    { time: '2:00', desc: 'Dê uma leve sacudida no Chemex para nivelar a cama de café.' },
                    { time: '2:10', desc: 'Aguarde o gotejamento total (tempo estimado: ~4:10).' }
                ]
            }
        }
    },
    kalita: {
        label: 'Kalita Wave',
        recipes: {
            mccarthy: {
                label: 'Erin McCarthy — Campeonato Mundial 2013',
                ratio: 380 / 24,
                refDose: { coffee: 24, water: 380 },
                tempBase: 96,
                clicksByRoast: { light: 18, medium: 19, dark: 20 },
                clicksEstimated: true,
                source: 'https://sprudge.com/erin-mccarthy-brewers-cup-cham-36235.html',
                note: 'Receita de Erin McCarthy (Counter Culture), vencedora do Campeonato Mundial de Brewers Cup 2013 com o Kalita Wave. 24g para 380ml, moagem média-grossa com os finos peneirados, bloom de 45s e despejos pulsados mantendo uma coluna de água constante. O filtro Wave não é enxaguado.',
                hasKasuyaControls: false,
                buildSteps: () => [
                    { time: '0:00', label: 'Pré-molha', to: c => c * 2, hint: 'Chaleira comum, com a água quase fervente.' },
                    { time: '0:15', desc: 'Deixe florescer.' },
                    { time: '0:45', label: 'Despejo pulsado', to: (c, w) => w * 0.5, hint: 'Mantenha uma coluna de água constante sobre o pó.' },
                    // A troca de chaleira acontece durante a extração e muda a agitação
                    // da cama de café, então entra como passo; já o filtro sem enxaguar
                    // e a moagem são preparo prévio e ficam na nota da receita.
                    { time: '1:15', label: 'Despejo pulsado', to: (c, w) => w, hint: 'Troque para uma chaleira de fluxo restrito, para amortecer a agitação.' },
                    { time: '1:45', desc: 'Aguarde o gotejamento completo (tempo estimado: ~3:30).' }
                ]
            }
        }
    },
    origami: {
        label: 'Origami',
        recipes: {
            jianingdu: {
                label: 'Du Jianing — Campeã Mundial 2019',
                ratio: 240 / 16,
                refDose: { coffee: 16, water: 240 },
                tempBase: 94,
                clicksByRoast: { light: 18, medium: 19, dark: 20 },
                clicksEstimated: true,
                source: 'https://sprudge.com/du-jianing-of-china-is-the-2019-world-brewers-cup-champion-142739.html',
                note: 'Receita vencedora de Du Jianing, Campeã Mundial de Brewers Cup 2019 — primeira competidora da China a vencer um Campeonato Mundial de Café. 16g para 240ml a 94°C no Origami, extração de ~1:40. Na competição ela moía o café duas vezes, peneirando a casca entre as moagens.',
                hasKasuyaControls: false,
                buildSteps: () => [
                    { time: '0:00', label: '1º Despejo', to: (c, w) => w * 0.25 },
                    { time: '0:10', desc: 'Aguarde.' },
                    { time: '0:18', label: '2º Despejo', to: (c, w) => w * 0.5833 },
                    { time: '0:38', desc: 'Aguarde.' },
                    { time: '0:56', label: '3º Despejo', to: (c, w) => w },
                    { time: '1:16', desc: 'Aguarde o gotejamento total (tempo estimado: ~1:46).' }
                ]
            }
        }
    },
    frenchpress: {
        label: 'Prensa Francesa',
        recipes: {
            hoffmann: {
                label: 'James Hoffmann',
                ratio: 500 / 30,
                refDose: { coffee: 30, water: 500 },
                tempBase: 95,
                clicksByRoast: { light: 27, medium: 28, dark: 29 },
                clicksEstimated: true,
                source: 'https://www.youtube.com/watch?v=st571DYYTR8',
                note: 'Técnica "Ultimate French Press" de James Hoffmann: um longo descanso antes de prensar reduz sedimentos e deixa a xícara mais limpa.',
                hasKasuyaControls: false,
                buildSteps: () => [
                    { time: '0:00', label: 'Despejo único', to: (c, w) => w, hint: 'De uma vez, cobrindo todo o pó.' },
                    { time: '0:15', desc: 'Deixe descansar sem mexer.' },
                    { time: '4:15', desc: 'Mexa a crosta que se formou no topo e remova a espuma/partículas flutuantes com uma colher.' },
                    { time: '4:45', desc: 'Deixe descansar por mais 5 minutos, sem mexer, para as partículas assentarem.' },
                    { time: '9:45', desc: 'Encaixe o êmbolo só até a superfície do líquido, sem pressionar, e sirva devagar.' }
                ]
            }
        }
    },
    aeropress: {
        label: 'AeroPress',
        recipes: {
            hoffmann: {
                label: 'James Hoffmann',
                ratio: 200 / 11,
                refDose: { coffee: 11, water: 200 },
                // A fonte manda usar água fervente na torra clara e 90–95°C na média.
                // 97°C é meio-termo: reconhece que a clara pede mais quente sem cravar
                // um número que o autor não deu.
                tempByRoast: { light: 97, medium: [90, 95], dark: [85, 90] },
                clicksByRoast: { light: 14, medium: 15, dark: 16 },
                clicksEstimated: true,
                source: 'https://aeroprecipe.com/recipes/james-hoffmann-aeropress-recipe',
                note: 'Receita padrão de James Hoffmann para AeroPress na posição tradicional (não invertida).',
                hasKasuyaControls: false,
                buildSteps: () => [
                    { time: '0:00', label: 'Despejo único', to: (c, w) => w, hint: 'Molhe todo o café.' },
                    { time: '0:10', desc: 'Encaixe o êmbolo cerca de 1cm no topo do bocal.' },
                    { time: '0:15', desc: 'Aguarde 2 minutos.' },
                    { time: '2:15', desc: 'Segurando o corpo e o êmbolo, gire suavemente o AeroPress.' },
                    { time: '2:25', desc: 'Aguarde 30 segundos.' },
                    { time: '2:55', desc: 'Pressione suavemente até o final (tempo estimado: ~3:25).' }
                ]
            },
            merikanto: {
                label: 'Tuomas Merikanto — Campeão Mundial 2021',
                ratio: 200 / 18,
                refDose: { coffee: 18, water: 200 },
                tempBase: 80,
                clicksByRoast: { light: 12, medium: 13, dark: 14 },
                clicksEstimated: true,
                source: 'https://aeroprecipe.com/recipes/2021-world-aeropress-champion',
                note: 'Receita vencedora do Campeonato Mundial de AeroPress 2021, de Tuomas Merikanto (Finlândia). AeroPress invertido com dois filtros de papel, 18g para 200ml a 80°C.',
                hasKasuyaControls: false,
                buildSteps: () => [
                    { time: '0:00', label: 'Bloom', to: (c, w) => w * 0.25, hint: 'AeroPress invertido, com dois filtros de papel na tampa.' },
                    { time: '0:10', desc: 'Mexa bem suavemente, 3 vezes (ida e volta).' },
                    { time: '0:15', label: 'Despejo final', to: (c, w) => w },
                    { time: '0:30', desc: 'Deixe extrair sem mexer.' },
                    { time: '0:50', desc: 'Mexa bem suavemente mais 3 vezes.' },
                    { time: '1:00', desc: 'Retire o excesso de ar e encaixe a tampa com os filtros.' },
                    { time: '1:35', desc: 'Encaixe o recipiente sobre o AeroPress.' },
                    { time: '1:40', desc: 'Vire para a posição normal e pressione imediatamente, até 2:00.' }
                ]
            }
        }
    }
};

export { KASUYA_BALANCE, deviceData };
