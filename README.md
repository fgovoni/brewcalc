# BrewCalc

![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=flat-square&logo=javascript&logoColor=%23F7DF1E)

Uma calculadora interativa e aplicativo de avaliação para receitas de café coado, baseada em métodos de baristas campeões mundiais.

## 🚀 Funcionalidades

- **Calculadora de Preparo**: Suporte para V60, Chemex, Kalita Wave, Origami, Prensa Francesa e AeroPress. Cada passo mostra **quanto despejar e qual o alvo acumulado na balança** — e a soma dos despejos sempre fecha exatamente no total, em qualquer volume.
- **Escala fiel**: parta da dose original do autor e ajuste água, café ou proporção; os três permanecem coerentes entre si. A proporção aceita decimais (1:16.7 é 1:16.7, não 1:17) e a que você escolher sobrevive à troca de receita, com a oficial a um toque de distância.
- **Receitas de Campeões**: Inclui métodos consagrados como o 4:6 de Tetsu Kasuya (com controles dedicados de força e balanço) e as técnicas de James Hoffmann.
- **Receitas Customizadas**: Crie, edite e salve (via LocalStorage) suas próprias receitas e passos de extração.
- **Assistente de Extração (Timer)**: Acompanhamento passo a passo de cada despejo, com contagem regressiva de 3 segundos antes da largada, beep e vibração a cada etapa e tela mantida acesa durante todo o preparo.
- **Avaliação Sensorial**: Registre notas de prova (Aroma, Doçura, Acidez, Amargor, Sabor, Corpo, Retrogosto) gerando um gráfico de radar interativo, junto de temperatura, moagem e cliques do moedor.
- **Compartilhamento por QR Code**: Receitas customizadas viram um link com os dados embutidos no próprio endereço. Quem abre vê uma confirmação com nome, método e número de passos antes de importar — nenhum servidor no meio.
- **Exportação para Stories**: Gere e baixe imagens otimizadas para Instagram Stories (1080x1920) com os detalhes do preparo, do café e o gráfico de avaliação. Em receitas customizadas o card já sai com o QR de importação.
- **Interface**: Design responsivo, minimalista e com alternância entre Tema Claro e Escuro.
- **Funciona offline**: instalável na tela inicial do celular e abre sem rede — pensado para o uso real, com o aparelho ao lado da balança na cozinha.

## 🛠️ Tecnologias Utilizadas

- **HTML5 & CSS3**: Layout limpo usando variáveis CSS e design responsivo, sem dependência de bibliotecas externas.
- **JavaScript Vanilla em módulos ES**: Toda a lógica de cálculo, manipulação de áudio, geração de canvas (gráficos) e salvamento local.
- **APIs do navegador**: Web Audio API para os beeps, Vibration API no celular, Screen Wake Lock API para manter a tela acesa durante o preparo e Canvas 2D para o gráfico de radar e o card de compartilhamento.
- **Gerador de QR próprio**: Implementado no próprio projeto, sem CDN nem pacote externo.

Nenhuma biblioteca, CDN ou fonte remota — e **nenhuma etapa de build**: os módulos ES são carregados direto pelo navegador.

### Organização

`index.html` é só a estrutura da tela. Cada controle declara o que faz (`data-acao`, `data-entrada`, `data-mudanca`) e o `js/app.js` resolve esses nomes contra um mapa de ações — não há handler embutido no HTML.

| Arquivo | Responsabilidade |
| --- | --- |
| `js/app.js` | Liga os controles aos módulos e inicializa. É o único que conhece o HTML inteiro. |
| `js/receitas-dados.js` | As receitas. Conferidas contra a fonte de cada barista — ver `AUDITORIA-RECEITAS.md`. |
| `js/receitas.js` | Motor: transforma o descritor de uma receita em passos concretos. Puro. |
| `js/formato.js` | Formatação e validação (proporção, tempo, escape). Puro. |
| `js/estado.js` | O que o usuário tem selecionado agora: lê os campos e resolve contra a receita. |
| `js/timer.js` | Assistente de extração: contagem, beep, vibração e tela acesa. |
| `js/cartao.js` | Cartão 1080x1920 e gráfico de radar, em Canvas 2D. |
| `js/compartilhar.js` | Link com a receita embutida no endereço, e o QR correspondente. |
| `js/receitas-custom.js` | Construtor, validação e persistência das receitas do usuário. |
| `js/avaliacao.js` | Os sete atributos de prova e seus sliders. |
| `js/tema.js` | Tema claro/escuro. |
| `js/qr.js` | Gerador de QR vendorizado. Tratar como dependência: trocar o bloco inteiro. |

O único recurso externo é o script de contagem de acessos do [GoatCounter](https://www.goatcounter.com/) — sem cookies e sem dados pessoais. Ele é assíncrono, então o app funciona normalmente se for bloqueado ou falhar; para desligar a analytics, basta remover aquela linha do `<head>`. Fora essa chamada, a página não faz nenhuma requisição depois de carregada.

## 📦 Como Executar

O projeto é 100% *client-side* e não tem etapa de build. Precisa apenas ser **servido por http(s)** — é assim que roda no GitHub Pages, e localmente basta:

```
python3 -m http.server 8000
```

Abrir o `index.html` direto do disco (`file://`) não funciona: os navegadores recusam módulos ES, service worker e Wake Lock fora de contexto seguro.

### Instalar no celular

Abra o site e use "Adicionar à tela de início" (Android: menu do Chrome; iOS: botão de compartilhar no Safari). O app passa a abrir em tela cheia, sem barra de navegador, e **funciona sem rede** — o service worker (`sw.js`) mantém a página em cache.

A atualização é automática: quando há rede, o app busca sempre a versão publicada e só recorre ao cache se a rede falhar. Assim uma correção de receita nunca fica presa numa cópia velha.

## 🧪 Testes

`tests.html` roda no navegador, sem build nem dependências — sirva a pasta e abra o arquivo. São 870 testes em duas camadas:

- **Lógica pura**, importada direto dos módulos: a soma dos despejos fechando no alvo em todas as receitas e volumes, o arredondamento da proporção, a escala das doses, a ida e volta do link de compartilhamento e a rejeição de payloads de importação malformados.
- **Tela**, contra o `index.html` real num iframe: que todo `data-acao` declarado no HTML resolve para uma função (e o inverso, que não há ação órfã no mapa), que um clique de verdade atravessa a delegação e chega ao efeito esperado, e a regressão da dose original do autor ao trocar de aparelho.
