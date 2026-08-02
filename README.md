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

## 🛠️ Tecnologias Utilizadas

- **HTML5 & CSS3**: Layout limpo usando variáveis CSS e design responsivo, sem dependência de bibliotecas externas.
- **JavaScript Vanilla**: Toda a lógica de cálculo, manipulação de áudio, geração de canvas (gráficos) e salvamento local.
- **APIs do navegador**: Web Audio API para os beeps, Vibration API no celular, Screen Wake Lock API para manter a tela acesa durante o preparo e Canvas 2D para o gráfico de radar e o card de compartilhamento.
- **Gerador de QR próprio**: Implementado no próprio arquivo, sem CDN nem pacote externo.

Tudo vive em um único `index.html`, sem etapa de build e **sem nenhuma requisição externa** — nenhum CDN, fonte remota, script de analytics ou chamada de rede. Depois de carregada, a página funciona inteiramente offline.

## 📦 Como Executar

O projeto é 100% *client-side*. Não há necessidade de build ou servidor.
Basta fazer o download do código e abrir o arquivo `index.html` em qualquer navegador web moderno (desktop ou mobile).

Duas ressalvas para quem abrir direto do disco (`file://`): o compartilhamento por QR depende de um endereço `http(s)` para gerar links que funcionem em outro aparelho, e a trava de tela (Wake Lock) só é liberada pelos navegadores em contexto seguro (`https` ou `localhost`). Servido pelo GitHub Pages, ambos funcionam normalmente.

## 🧪 Testes

`tests.html` roda no navegador, sem build nem dependências — basta abrir o arquivo. Cobre as regras de cálculo que sustentam a fidelidade do app: a soma dos despejos fechando no alvo em todas as receitas e volumes, o arredondamento da proporção, a escala das doses, a ida e volta do link de compartilhamento e a rejeição de payloads de importação malformados.
