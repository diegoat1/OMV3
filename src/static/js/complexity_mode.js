/* Complexity Mode Renderer: Completo | Proteina | Calorias (Energia) */
(function () {
  const BLOQUE_ENERGIA = 100;
  const MODE_KEY = 'onv2_complexityMode';

  function roundHalf(n) { return Math.round(n * 2) / 2; }
  function num(x) { const n = parseFloat(String(x).replace(',', '.')); return isNaN(n) ? 0 : n; }

  function kcalFromGrams(g) { return (g.p * 4) + (g.g * 9) + (g.c * 4); }
  function kcalGCFromGrams(g) { return (g.g * 9) + (g.c * 4); }

  function getMode() {
    // No seleccionar modo por defecto en primera carga
    return window.complexityMode || 'none';
  }
  function setMode(mode) {
    window.complexityMode = mode;
    localStorage.setItem(MODE_KEY, mode);
  }

  function extractCardGrams(card) {
    // Intenta desde el texto "Gramos originales: P:xxg · G:yyg · C:zzg"
    const infoSmall = card.querySelector('.mt-3 .text-muted, .bg-light .text-muted');
    const text = infoSmall ? infoSmall.textContent : '';
    const m = text && text.match(/P[:=]?\s*([\d.,]+)\s*g.*G[:=]?\s*([\d.,]+)\s*g.*C[:=]?\s*([\d.,]+)\s*g/i);
    if (m) return { p: num(m[1]), g: num(m[2]), c: num(m[3]) };
    // Fallback: tomar los 3 textos de gramos debajo de P/G/C
    const gramsEls = card.querySelectorAll('.row.text-center.small .text-muted');
    if (gramsEls.length >= 3) {
      return { p: num(gramsEls[0].textContent), g: num(gramsEls[1].textContent), c: num(gramsEls[2].textContent) };
    }
    return { p: 0, g: 0, c: 0 };
  }

  function extractCardBloques(card) {
    // Desde el resumen "2P · 2G · 1C"
    const resumenEl = card.querySelector('.text-center h3');
    const t = resumenEl ? resumenEl.textContent : '';
    const m = t && t.match(/([\d.,]+)\s*P.*?([\d.,]+)\s*G.*?([\d.,]+)\s*C/i);
    if (m) return { p: num(m[1]), g: num(m[2]), c: num(m[3]) };
    return { p: 0, g: 0, c: 0 };
  }

  function renderComidaCard(card, mode) {
    const resumenEl = card.querySelector('.text-center h3');
    const row = card.querySelector('.row.text-center.small');
    const infoSmall = card.querySelector('.mt-3 .text-muted, .bg-light .text-muted');

    if (resumenEl && !resumenEl.dataset.resumenOriginal) {
      resumenEl.dataset.resumenOriginal = resumenEl.textContent.trim();
    }
    if (row && !row.dataset.htmlOriginal) {
      row.dataset.htmlOriginal = row.innerHTML;
    }
    if (infoSmall && !infoSmall.dataset.textOriginal) {
      infoSmall.dataset.textOriginal = infoSmall.textContent.trim();
    }

    if (mode === 'completo') {
      if (resumenEl) resumenEl.textContent = resumenEl.dataset.resumenOriginal || resumenEl.textContent;
      if (row && row.dataset.htmlOriginal) row.innerHTML = row.dataset.htmlOriginal;
      if (infoSmall) infoSmall.textContent = infoSmall.dataset.textOriginal || infoSmall.textContent;
      return;
    }

    const grams = extractCardGrams(card);
    const bloques = extractCardBloques(card);
    const kcalTotal = kcalFromGrams(grams);
    const kcalGC = kcalGCFromGrams(grams);
    const eTotal = roundHalf(kcalTotal / BLOQUE_ENERGIA);
    const eGC = roundHalf(kcalGC / BLOQUE_ENERGIA);

    if (mode === 'proteina') {
      if (resumenEl) resumenEl.textContent = `${bloques.p.toFixed(1)}P · ${eGC.toFixed(1)}E`;
      if (row) {
        row.innerHTML = `
          <div class="col-6">
            <div class="badge bg-danger w-100 mb-1">${bloques.p.toFixed(1)}P</div>
            <div class="text-muted">${grams.p.toFixed(2)}g</div>
          </div>
          <div class="col-6">
            <div class="badge bg-secondary w-100 mb-1">${eGC.toFixed(1)}E</div>
            <div class="text-muted">${Math.round(kcalGC)} kcal</div>
          </div>`;
      }
      if (infoSmall) infoSmall.textContent = `E (G+C): ${Math.round(kcalGC)} kcal · 1E = ${BLOQUE_ENERGIA} kcal`;
      return;
    }

    // calorias / energia
    if (resumenEl) resumenEl.textContent = `${eTotal.toFixed(1)}E`;
    if (row) {
      row.innerHTML = `
        <div class="col-12">
          <div class="badge bg-secondary w-100 mb-1">${eTotal.toFixed(1)}E</div>
          <div class="text-muted">${Math.round(kcalTotal)} kcal</div>
        </div>`;
    }
    if (infoSmall) infoSmall.textContent = `E total: ${Math.round(kcalTotal)} kcal · 1E = ${BLOQUE_ENERGIA} kcal`;
  }

  function renderMealCards() {
    const mode = getMode();
    document.querySelectorAll('.comida-card').forEach(card => renderComidaCard(card, mode));
  }

  function renderSuggestionCard(card, mode) {
    const aplicar = card.querySelector('.btn-aplicar-sugerencia');
    if (!aplicar || !aplicar.dataset.sugerencia) return;
    let sug;
    try { sug = JSON.parse(aplicar.dataset.sugerencia); } catch { return; }
    const grams = sug.gramos || { proteina: 0, grasa: 0, carbohidratos: 0 };
    const bloques = sug.bloques || { proteina: 0, grasa: 0, carbohidratos: 0, resumen: '' };
    const p = num(grams.proteina);
    const g = num(grams.grasa);
    const c = num(grams.carbohidratos);
    const kcalTot = (p * 4) + (g * 9) + (c * 4);
    const kcalGC = (g * 9) + (c * 4);
    const eTot = roundHalf(kcalTot / BLOQUE_ENERGIA);
    const eGC = roundHalf(kcalGC / BLOQUE_ENERGIA);

    const h4 = card.querySelector('.text-center h4');
    const small = card.querySelector('.text-center small.text-muted');

    if (h4 && !h4.dataset.resumenOriginal) h4.dataset.resumenOriginal = h4.textContent.trim();
    if (small && !small.dataset.detalleOriginal) small.dataset.detalleOriginal = small.textContent.trim();

    if (mode === 'completo') {
      if (h4) h4.textContent = (bloques.resumen || h4.dataset.resumenOriginal || h4.textContent);
      if (small) small.textContent = (small.dataset.detalleOriginal || `${Math.round(p)}g P · ${Math.round(g)}g G · ${Math.round(c)}g C`);
      return;
    }
    if (mode === 'proteina') {
      if (h4) h4.textContent = `${num(bloques.proteina).toFixed(2)}P · ${eGC.toFixed(1)}E`;
      if (small) small.textContent = `${Math.round(p)}g P · ${Math.round(kcalGC)} kcal (G+C)`;
      return;
    }
    if (h4) h4.textContent = `${eTot.toFixed(1)}E`;
    if (small) small.textContent = `${Math.round(kcalTot)} kcal totales`;
  }

  function renderAllSuggestionCards() {
    const mode = getMode();
    document.querySelectorAll('#sugerencias-tab-content .card.h-100').forEach(card => renderSuggestionCard(card, mode));
    // Biblioteca comunitaria (si comparte markup)
    document.querySelectorAll('#biblioteca-content .card.h-100').forEach(card => renderSuggestionCard(card, mode));
  }

  function toggleMainSections(show) {
    const display = show ? '' : 'none';
    // Comidas
    document.querySelectorAll('.comida-card').forEach(c => { c.style.display = display; });
    // Sugerencias
    const tabs = document.getElementById('sugerencias-tabs');
    if (tabs) tabs.style.display = display;
    const tabContent = document.getElementById('sugerencias-tab-content');
    if (tabContent) tabContent.style.display = display;
    // Sistema de bloques (buscar por título aproximado)
    document.querySelectorAll('.card').forEach(card => {
      const header = card.querySelector('.card-header, h6, h5');
      const text = (header ? header.textContent : card.textContent || '').toLowerCase();
      if (text.includes('sistema de bloques')) {
        card.style.display = display;
      }
    });
  }

  function renderComplexity() {
    const mode = getMode();
    if (mode === 'none') {
      toggleMainSections(false);
      return;
    }
    toggleMainSections(true);
    renderMealCards();
    renderAllSuggestionCards();
  }

  // Exponer helpers globales mínimos
  window.renderComplexity = renderComplexity;
  window.setComplexityMode = setMode;

  document.addEventListener('DOMContentLoaded', function () {
    // Inicializar estado desde localStorage
    const mode = getMode();
    // Sincroniza radios si existen
    document.querySelectorAll('input[name="complexityMode"]').forEach(r => {
      r.checked = (mode !== 'none' && r.value === mode);
      const lab = document.querySelector(`label[for="${r.id}"]`);
      if (lab) lab.classList.toggle('active', r.checked);
      r.addEventListener('change', (e) => {
        setMode(e.target.value);
        // actualizar estilos activos
        document.querySelectorAll('input[name="complexityMode"]').forEach(r2 => {
          const l2 = document.querySelector(`label[for="${r2.id}"]`);
          if (l2) l2.classList.toggle('active', r2.checked);
        });
        renderComplexity();
      });
    });
    renderComplexity();
  });
})();

