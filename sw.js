// Service worker do BrewCalc — faz o app abrir sem rede.
//
// Estratégia deliberadamente conservadora quanto à atualização: as receitas e os
// cálculos são o produto, então uma versão velha presa em cache é pior do que uma
// espera de alguns milissegundos. Por isso a navegação vai PRIMEIRO à rede e só cai
// no cache se ela falhar — online você sempre vê a versão publicada; offline, a
// última que funcionou.

const CACHE = 'brewcalc-v1';

// O app inteiro cabe nesta lista: um HTML, o manifesto e os ícones.
// Caminhos relativos para funcionar em qualquer subdiretório do GitHub Pages.
const ARQUIVOS = [
    './',
    './index.html',
    './manifest.webmanifest',
    './icon.svg',
    './icon-192.png',
    './icon-512.png'
];

self.addEventListener('install', evento => {
    evento.waitUntil(
        caches.open(CACHE)
            .then(cache => cache.addAll(ARQUIVOS))
            // Um ícone que falhe não deve impedir o app de ficar disponível offline
            .catch(() => undefined)
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', evento => {
    evento.waitUntil(
        caches.keys()
            .then(nomes => Promise.all(
                nomes.filter(n => n !== CACHE).map(n => caches.delete(n))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', evento => {
    const req = evento.request;

    // Só GET entra em cache
    if (req.method !== 'GET') return;

    // Deixa passar direto o que é de outra origem — sobretudo a contagem de acessos
    // do GoatCounter, que não deve ser cacheada nem enfileirada para depois
    if (new URL(req.url).origin !== self.location.origin) return;

    // Navegação (abrir o app): rede primeiro, cache como rede de segurança
    if (req.mode === 'navigate') {
        evento.respondWith(
            fetch(req)
                .then(resposta => {
                    const copia = resposta.clone();
                    caches.open(CACHE).then(c => c.put('./index.html', copia));
                    return resposta;
                })
                .catch(() => caches.match('./index.html').then(r => r || caches.match('./')))
        );
        return;
    }

    // Demais recursos próprios (ícones, manifesto): responde do cache na hora e
    // atualiza em segundo plano para a próxima abertura
    evento.respondWith(
        caches.match(req).then(cacheada => {
            const daRede = fetch(req)
                .then(resposta => {
                    if (resposta && resposta.ok) {
                        const copia = resposta.clone();
                        caches.open(CACHE).then(c => c.put(req, copia));
                    }
                    return resposta;
                })
                .catch(() => cacheada);
            return cacheada || daRede;
        })
    );
});
