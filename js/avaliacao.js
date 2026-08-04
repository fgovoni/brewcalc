// Avaliação sensorial: os sete atributos de prova e seus sliders.
//
// Os sliders são criados em runtime a partir de ratingLabels, então a ação deles
// (data-entrada="avaliacaoNota") é resolvida pela delegação no app — não há handler
// embutido no HTML gerado.

// ---------- Avaliação sensorial ----------
const ratingLabels = ['Aroma', 'Doçura', 'Acidez', 'Amargor', 'Sabor', 'Corpo', 'Retrogosto'];

const ratingIcons = [
    '<svg class="rating-icon" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M8 21c0-2 2-2 2-4s-2-2-2-4 2-2 2-4"/><path d="M14 21c0-2 2-2 2-4s-2-2-2-4 2-2 2-4"/></svg>', // Aroma — linhas de vapor/aroma
    '<svg class="rating-icon" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect x="5" y="5" width="14" height="14" rx="2"/><path d="M5 12h14M12 5v14"/></svg>', // Doçura — cubo de açúcar
    '<svg class="rating-icon" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 3v18M4.8 7.2l14.4 9.6M4.8 16.8l14.4-9.6"/></svg>', // Acidez — gomo cítrico
    '<svg class="rating-icon" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 000 18z" fill="currentColor" stroke="none"/></svg>', // Amargor — contraste claro/escuro
    '<svg class="rating-icon" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M4 15c2-5 4-5 6 0s4 5 6 0 4-5 4 0"/></svg>', // Sabor — onda de sabor
    '<svg class="rating-icon" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M12 3c4 5 7 8.5 7 12a7 7 0 01-14 0c0-3.5 3-7 7-12z"/></svg>', // Corpo — gota (viscosidade)
    '<svg class="rating-icon" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M6 3h12M6 21h12M7 3c0 4 3 6 5 8-2 2-5 4-5 8M17 3c0 4-3 6-5 8 2 2 5 4 5 8"/></svg>' // Retrogosto — ampulheta
];

function buildRatingSliders() {
    const container = document.getElementById('rating-sliders');
    ratingLabels.forEach((label, i) => {
        const id = `rating-${i}`;
        const row = document.createElement('div');
        row.className = 'rating-row';
        row.innerHTML = `
            <div class="rating-row-header">
                <span>${ratingIcons[i]} ${label}</span>
                <span class="rating-value" id="${id}-value">3</span>
            </div>
            <input type="range" class="rating-slider" id="${id}" min="1" max="5" value="3" step="1" data-entrada="avaliacaoNota">
        `;
        container.appendChild(row);
    });
    ratingLabels.forEach((_, i) => onRatingInput(`rating-${i}`));

    // Solta o foco de qualquer campo de texto (ex: notas) antes do slider assumir o toque,
    // evitando que o teclado do celular "prenda" o foco no campo anterior
    container.addEventListener('touchstart', () => {
        const active = document.activeElement;
        if (active && (active.tagName === 'TEXTAREA' || active.tagName === 'INPUT')) {
            active.blur();
        }
    }, { passive: true });
}

function onRatingInput(id) {
    const slider = document.getElementById(id);
    document.getElementById(`${id}-value`).innerText = slider.value;
    slider.style.setProperty('--value', ((slider.value - 1) / 4) * 100 + '%');
}

function getRatings() {
    return ratingLabels.map((label, i) => ({
        label,
        value: parseInt(document.getElementById(`rating-${i}`).value)
    }));
}

export { ratingLabels, buildRatingSliders, onRatingInput, getRatings };
