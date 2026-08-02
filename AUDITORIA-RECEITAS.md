# Auditoria das receitas — agosto/2026

Motivo: 6 das 8 receitas do app foram inseridas por um assistente de IA sem verificação
humana. Apenas o método 4:6 do Tetsu Kasuya e o V60 do James Hoffmann eram conhecidos
pelo dono do projeto. Como o valor declarado do BrewCalc é fidelidade aos dados, cada
receita foi conferida contra fontes públicas.

**Achado mais grave: uma receita creditava a pessoa errada.**

## Tabela-resumo

| Receita | Campo | No app (antes) | Na fonte | Veredito |
|---|---|---|---|---|
| Kalita | **nome do autor** | *James* McCarthy | **Erin** McCarthy | ❌ **CORRIGIDO** |
| Kalita | campeonato | Brewers Cup 2013 | Brewers Cup 2013 | ✅ bate |
| Kalita | dose | 24g / 380ml | 24g / 380ml | ✅ bate |
| Kalita | bloom | 0:45 | bloom de 45s | ✅ bate |
| Origami | **grafia do nome** | *Jia Ning Du* | **Du Jianing** | ❌ **CORRIGIDO** |
| Origami | campeonato | Brewers Cup 2019 | Brewers Cup 2019 | ✅ bate |
| Origami | dose e temp. | 16g / 240ml, 94°C | 16g / 240ml, 94°C | ✅ bate |
| AeroPress (Merikanto) | campeonato | WAC 2021 | WAC 2021 | ✅ bate |
| AeroPress (Merikanto) | dose e temp. | 18g / 200ml, 80°C | 18g / 200ml, 80°C | ✅ bate |
| AeroPress (Merikanto) | tempos | 0:10 / 0:15 / 0:30 / 0:50 / 1:00 / 1:40 | idênticos | ✅ bate |
| AeroPress (Merikanto) | **filtros** | não mencionava | **dois filtros de papel** | ❌ **CORRIGIDO** |
| Chemex (Hoffmann) | dose, temp., tempos | 30g / 500ml, 95°C, 0:45→300g→500g | idênticos | ✅ bate |
| Chemex (Hoffmann) | proporção | 1:16.**6** | 1:16.**7** | ❌ **CORRIGIDO** |
| V60 (Hoffmann) | proporção | 1:16.**6** | 1:16.**7** | ❌ **CORRIGIDO** |
| Prensa (Hoffmann) | dose e passos | 30g / 500ml, 4min, crosta, 5min, sem prensar | idênticos | ✅ bate |
| AeroPress (Hoffmann) | dose e passos | 11g / 200ml, 2min, giro, 30s, prensa | idênticos | ✅ bate |
| AeroPress (Hoffmann) | temp. torra clara | 95°C | "água fervente" (~100°C) | ⚠️ **DIVERGE** |
| Kasuya 4:6 | dose e proporção | 20g / 300ml (1:15) | 20g / 300ml (1:15) | ✅ bate |
| Todas | cliques Timemore C2 | 4 marcadas como estimadas | nenhum autor especifica | ⚠️ **CORRIGIDO** (todas marcadas) |

---

## Detalhe por receita

### Kalita Wave — Erin McCarthy, Campeonato Mundial de Brewers Cup 2013

O app creditava a receita a **"James" McCarthy**. Quem venceu o World Brewers Cup de 2013
foi **Erin McCarthy**, da Counter Culture Coffee, com um Geisha da Hacienda Esmeralda do
Panamá — o primeiro título mundial de Brewers Cup para os Estados Unidos.

O resto da receita estava correto e foi confirmado: 24g para 380ml, moagem média-grossa
com os finos peneirados, bloom de 45 segundos, despejos pulsados mantendo uma coluna de
água constante sobre a cama de café. Um detalhe distintivo que faltava e foi acrescentado
à nota: **o filtro Wave não é enxaguado**, por ser fino demais para passar gosto de papel.

Fontes: [Sprudge](https://sprudge.com/erin-mccarthy-brewers-cup-cham-36235.html) ·
[SCA News](https://scanews.coffee/2013/04/15/pete-licata-wins-2013-united-states-barista-championship-and-erin-mccarthy-takes-the-3rd-annual-us-brewers-cup/) ·
[Barista Magazine](https://www.baristamagazine.com/we-heart-u-s-brewers-cup-champ-erin-mccarthy/) ·
[final de 2013 em vídeo](https://www.youtube.com/watch?v=9Vl4gI8LuSo)

### Origami — Du Jianing, Campeã Mundial de Brewers Cup 2019

O nome estava rearranjado como *"Jia Ning Du"*. A grafia usada pelas fontes é
**Du Jianing** (sobrenome Du). Os números batem exatamente: 16g para 240ml a 94°C, com
tempo de extração de ~1:40.

A nota do app dizia "primeira barista chinesa a vencer o título". A conquista registrada
pelas fontes é mais ampla: **primeira competidora da China a vencer um Campeonato Mundial
de Café** (qualquer modalidade). Texto ajustado. Acrescentado também que na competição ela
moía o café duas vezes, peneirando a casca entre as moagens.

Fontes: [Sprudge](https://sprudge.com/du-jianing-of-china-is-the-2019-world-brewers-cup-champion-142739.html) ·
[Barista Magazine](https://www.baristamagazine.com/du-jianing-discusses-her-path-to-world-brewers-cup-victory/)

### AeroPress — Tuomas Merikanto, Campeonato Mundial de AeroPress 2021

A receita mais fiel do conjunto: dose, temperatura e **todos os tempos** batiam com a
fonte (0:10, 0:15, 0:30, 0:50, 1:00, 1:40).

Duas correções: a receita vencedora usa **dois filtros de papel**, o que o app não
mencionava; e o passo final estava impreciso — a fonte descreve prensar de 1:40 a 2:00,
com o recipiente encaixado em 1:35, enquanto o app dizia "gire suavemente para resfriar"
em 2:00, algo que não consta da receita original.

Não transportável para o app: ele usava água mineralizada Third Wave Water no perfil
espresso e moagem 7.0 num Macap Labo 70D — sem equivalência em cliques de Timemore.

Fonte: [aeroprecipe](https://aeroprecipe.com/recipes/2021-world-aeropress-champion) ·
[European Coffee Trip](https://europeancoffeetrip.com/winning-aeropress-recipe-2021/)

### Chemex, Prensa Francesa e AeroPress — James Hoffmann

As três conferem integralmente com as fontes.

- **Chemex**: 30g/500ml a 95°C, bloom até 45s, despejo circular até 300g, até 500g, mexida
  horária e anti-horária, sacudida, gotejamento ~4:10. A fonte confirma a proporção como
  **1:16.7** — o app declarava 1:16.6 no V60 e no Chemex, mas 1:16.7 na prensa, com a
  mesma razão 500/30. Contradição interna corrigida.
- **Prensa Francesa**: 30g/500ml, 4 minutos sem tocar, quebra da crosta, retirada da
  espuma com duas colheres, mais 5+ minutos de descanso e êmbolo apenas até a superfície,
  sem prensar. Total de 10–12 minutos.
- **AeroPress**: 11g/200ml na posição normal, êmbolo encaixado ~1cm para vedar, 2 minutos
  de espera, giro suave, 30 segundos de descanso e prensagem lenta.

Fontes: [Chemex](https://www.timer.coffee/recipes/chemex/james-hoffmann-chemex-recipe/) ·
[AeroPress](https://aeroprecipe.com/recipes/james-hoffmann-aeropress-recipe) ·
[Prensa](https://www.fluentincoffee.com/james-hoffmann-french-press/)

### V60 Hoffmann e Kasuya 4:6

Conhecidas e validadas pelo dono do projeto; conferidas apenas quanto à proporção.
Kasuya: 20g/300ml, 1:15 exato. Hoffmann V60: 30g/500ml → 1:16.7 (não 1:16.6).

---

## Divergências que ainda exigem sua decisão

Estas **não** foram alteradas, por dependerem de julgamento seu:

1. **Temperatura da torra clara no AeroPress do Hoffmann.** O app usa 95°C. A fonte diz
   para usar **água fervente** com torras claras (~100°C), reservando 90–95°C para as
   médias — faixa que o app já traz corretamente. Alterar para 100 é defensável, mas
   "fervente" é uma instrução, não um número cravado pelo autor, e o campo do app tem
   máximo de 100. **Decisão sua.**

2. **Moagem do Chemex.** A fonte descreve a moagem do Hoffmann para Chemex como
   *média-fina*, mas os cliques do app (20–22) caem em "Média/Média-Grossa" — mais grossos
   que os do V60 (17–19), quando deveriam ser semelhantes. Sugiro aproximar dos valores do
   V60, mas isso é calibração de moedor, não dado do autor.

3. **Todos os números de clique são estimativa.** Nenhum dos autores especifica cliques de
   Timemore C2 — cada um descreve a moagem em palavras ou no próprio moedor de competição.
   O app marcava apenas 4 receitas com `clicksEstimated`, o que dava a entender que as
   outras 4 tinham sido medidas. **Todas as 8 foram marcadas como estimadas.** Se você
   calibrar alguma no seu C2, remova a marca daquela receita.

4. **Detalhes de competição não representáveis.** Erin McCarthy trocava de chaleira no meio
   do preparo (comum para bico de fluxo restrito) e não enxaguava o filtro; Du Jianing usava
   funil e agulha para soltar a cama de café. Estão registrados nas notas em texto, mas não
   viram passos do timer. Vale avaliar se algum merece virar passo.

---

## Observação de método

Toda receita agora carrega um campo `source` com a URL que a sustenta, e as notas
descrevem a dose original do autor. O comentário anterior no código — *"conferidas contra
fontes primárias em jul/2026"* — afirmava uma verificação que não era auditável e que, no
caso do McCarthy, não tinha acontecido.

Boa parte das fontes acima é secundária (Sprudge, Barista Magazine, agregadores de
receita), não a publicação do próprio autor. Para as atribuições de campeonato isso é
suficiente, por serem fatos amplamente documentados. Para os parâmetros finos de preparo,
o ideal seria conferir contra o vídeo ou texto original de cada autor.
