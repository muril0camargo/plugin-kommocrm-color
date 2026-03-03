/**
 * Content script principal da extensão "Kommo Tag Color".
 *
 * Responsabilidades:
 * 1) Encontrar cards visíveis na interface do Kommo.
 * 2) Ler o texto de cada card e procurar as palavras-chave definidas.
 * 3) Aplicar classes CSS para colorir o fundo conforme a tag encontrada.
 * 4) Reaplicar a lógica automaticamente quando a página mudar dinamicamente.
 */

(() => {
  // Seletores genéricos para aumentar a chance de identificar cards no Kommo.
  // Caso a estrutura da UI mude, basta ajustar esta lista.
  const CARD_SELECTORS = [
    '[data-id] .card',
    '[class*="card"]',
    '[class*="Card"]',
    '.pipeline_leads__item',
    '.js-lead-row',
    '[data-entity-id]'
  ];

  const CLASS_URGENTE = 'kommo-tag-color--urgente';
  const CLASS_IMPORTANTE = 'kommo-tag-color--importante';

  /**
   * Verifica se um elemento está visível em tela.
   * Ignora elementos ocultos por display/visibility/opacidade/tamanho.
   */
  function isVisible(element) {
    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();

    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      Number(style.opacity) > 0 &&
      rect.width > 0 &&
      rect.height > 0
    );
  }

  /**
   * Remove classes de cor antigas para evitar conflito.
   */
  function clearColorClasses(card) {
    card.classList.remove(CLASS_URGENTE, CLASS_IMPORTANTE);
  }

  /**
   * Aplica a regra de cores baseada no texto do card.
   * Prioridade: "urgente" (vermelho) > "importante" (amarelo).
   */
  function colorizeCard(card) {
    if (!isVisible(card)) return;

    const text = (card.innerText || card.textContent || '').toLowerCase();

    clearColorClasses(card);

    if (text.includes('urgente')) {
      card.classList.add(CLASS_URGENTE);
      return;
    }

    if (text.includes('importante')) {
      card.classList.add(CLASS_IMPORTANTE);
    }
  }

  /**
   * Busca cards com base nos seletores configurados e aplica coloração.
   */
  function scanAndColorizeCards() {
    const selector = CARD_SELECTORS.join(',');
    const cards = document.querySelectorAll(selector);

    cards.forEach(colorizeCard);
  }

  /**
   * Debounce simples para evitar execuções excessivas em páginas dinâmicas.
   */
  let scanTimeout;
  function scheduleScan() {
    window.clearTimeout(scanTimeout);
    scanTimeout = window.setTimeout(scanAndColorizeCards, 120);
  }

  // Escaneia ao carregar.
  scanAndColorizeCards();

  // Escaneia quando o DOM mudar (Kommo atualiza cards sem recarregar página).
  const observer = new MutationObserver(scheduleScan);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true
  });

  // Escaneia também em eventos comuns de atualização visual.
  window.addEventListener('load', scheduleScan);
  window.addEventListener('scroll', scheduleScan, { passive: true });
})();
