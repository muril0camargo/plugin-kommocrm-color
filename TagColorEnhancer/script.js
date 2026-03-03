define(['jquery'], function ($) {
  'use strict';

  return function () {
    var self = this;

    /**
     * Mapeia as tags reconhecidas para as classes CSS do widget.
     */
    var TAG_TO_CLASS = {
      urgente: 'tag-urgente',
      importante: 'tag-importante'
    };

    /**
     * Seletores comuns de cards/listas no Kommo.
     * Mantemos vários seletores para suportar diferentes telas (llist, clist etc.).
     */
    var CARD_SELECTORS = [
      '.pipeline_leads__item',
      '.js-list-rows__item',
      '.card-cf',
      '.feed-note-wrapper',
      '[data-id][class*="lead"]',
      '[class*="list-row"]'
    ];

    /**
     * Remove classes de destaque e aplica uma nova classe quando necessário.
     * @param {jQuery} $card Elemento do card.
     * @param {string|null} className Classe a ser aplicada (ou null para limpar).
     */
    function setCardColorClass($card, className) {
      $card.removeClass('tag-urgente tag-importante');

      if (className) {
        $card.addClass(className);
      }
    }

    /**
     * Detecta quais tags estão presentes em um card.
     * @param {jQuery} $card Elemento do card.
     * @returns {Array<string>} Lista de tags normalizadas (lowercase).
     */
    function getCardTags($card) {
      var tags = [];

      // Elementos de tags variam conforme layout. Coletamos texto de padrões frequentes.
      $card.find('.tag, .js-tag, .tags__item, .multisuggest__list-item, [class*="tag"]').each(function () {
        var text = $(this).text().trim().toLowerCase();

        if (text) {
          tags.push(text);
        }
      });

      return tags;
    }

    /**
     * Decide a cor do card conforme prioridade de tag:
     * 1) urgente
     * 2) importante
     * 3) sem destaque
     * @param {jQuery} $card Elemento do card.
     */
    function paintCardByTag($card) {
      var tags = getCardTags($card);

      if (tags.indexOf('urgente') !== -1) {
        setCardColorClass($card, TAG_TO_CLASS.urgente);
        return;
      }

      if (tags.indexOf('importante') !== -1) {
        setCardColorClass($card, TAG_TO_CLASS.importante);
        return;
      }

      setCardColorClass($card, null);
    }

    /**
     * Percorre todos os cards visíveis e aplica/atualiza o destaque.
     */
    function scanAndPaintAllCards() {
      $(CARD_SELECTORS.join(',')).each(function () {
        paintCardByTag($(this));
      });
    }

    /**
     * Inicia MutationObserver para reagir a mudanças de tags/DOM
     * sem usar eventos DOMNodeInserted (obsoleto).
     */
    function observeDomChanges() {
      var observer = new MutationObserver(function (mutations) {
        var shouldRescan = false;

        for (var i = 0; i < mutations.length; i += 1) {
          var mutation = mutations[i];

          // Mudanças de filhos, texto ou atributos de classe podem indicar atualização de tags/cards.
          if (
            mutation.type === 'childList' ||
            mutation.type === 'characterData' ||
            (mutation.type === 'attributes' && mutation.attributeName === 'class')
          ) {
            shouldRescan = true;
            break;
          }
        }

        if (shouldRescan) {
          scanAndPaintAllCards();
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: ['class']
      });
    }

    /**
     * Callback obrigatório: inicialização do widget.
     */
    this.callbacks = {
      init: function () {
        // Init pode ser usado para setup futuro.
        return true;
      },

      /**
       * Callback obrigatório: bind de ações/eventos.
       */
      bind_actions: function () {
        observeDomChanges();
        return true;
      },

      /**
       * Callback obrigatório: render inicial do widget.
       */
      render: function () {
        scanAndPaintAllCards();
        return true;
      }
    };

    return this;
  };
});
