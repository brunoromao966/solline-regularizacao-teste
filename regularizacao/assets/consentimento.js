/* Preferências exclusivas de /regularizacao/. Não altera o contêiner compartilhado. */
(function () {
  'use strict';
  const KEY = 'solline.regularizacao.consentimento.v1';
  const CONTAINER = 'GTM-K6K2ZRN';
  const DENIED = {
    ad_storage: 'denied', analytics_storage: 'denied',
    ad_user_data: 'denied', ad_personalization: 'denied'
  };
  let loaded = false;
  let choice = null;
  let storageAvailable = true;

  // Enfileirar o padrão ANTES de qualquer carregamento do Google.
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag('consent', 'default', Object.assign({}, DENIED));
  window.gtag('set', 'ads_data_redaction', true);
  window.gtag('set', 'url_passthrough', false);

  function readChoice() {
    try {
      const saved = JSON.parse(sessionStorage.getItem(KEY));
      return saved && saved.version === 1 && typeof saved.measurement === 'boolean'
        ? saved.measurement : null;
    } catch (_) { return null; }
  }

  function loadMeasurement() {
    // Cópias locais e GitHub Pages nunca enviam medição desta implementação.
    if (loaded || location.hostname !== 'sollinearq.com.br' ||
        !/^\/regularizacao\/?$/.test(location.pathname)) return;
    loaded = true;
    window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    const script = document.createElement('script');
    script.id = 'solline-reg-gtm';
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtm.js?id=' + CONTAINER;
    document.head.appendChild(script);
  }

  function updateSignals(allowed) {
    window.gtag('consent', 'update', Object.assign({}, DENIED, {
      ad_storage: allowed ? 'granted' : 'denied',
      ad_user_data: allowed ? 'granted' : 'denied'
    }));
  }

  choice = readChoice();
  if (choice === true) { updateSignals(true); loadMeasurement(); }

  function init() {
    const ui = document.createElement('div');
    ui.id = 'solline-privacy';
    ui.innerHTML = `
      <section class="reg-consent-banner" aria-labelledby="reg-consent-title" hidden>
        <div class="reg-consent-inner">
          <h2 id="reg-consent-title">Sua privacidade é importante</h2>
          <p>Com sua autorização, usamos cookies para entender as visitas ao site e oferecer uma comunicação mais relevante para você.</p>
          <div class="reg-consent-actions">
            <button type="button" data-reg-choice="accept">Aceitar todos</button>
            <button type="button" data-reg-choice="reject">Rejeitar opcionais</button>
          </div>
          <div class="reg-consent-footer"><button type="button" data-reg-choice="customize">Personalizar</button><a class="reg-consent-policy" href="privacidade.html">Política de Privacidade</a></div>
        </div>
      </section>
      <button class="reg-consent-launcher" type="button" data-reg-choice="customize" aria-controls="reg-preferences" aria-haspopup="dialog" hidden>Privacidade <span>Escolher cookies</span></button>
      <dialog id="reg-preferences" class="reg-consent-dialog" aria-labelledby="reg-preferences-title" aria-describedby="reg-preferences-intro">
        <button class="reg-consent-close" type="button" data-reg-choice="close" aria-label="Fechar sem alterar"><span aria-hidden="true">×</span></button>
        <h2 id="reg-preferences-title" tabindex="-1" autofocus>Suas preferências</h2>
        <p id="reg-preferences-intro">Você decide sobre a medição opcional. O WhatsApp funciona com qualquer escolha.</p>
        <div class="reg-consent-necessary"><h3>Funcionamento da página <span>Necessário</span></h3><p>Recursos locais para exibir a página e lembrar sua escolha nesta aba.</p></div>
        <div class="reg-consent-category"><label><input id="reg-measurement" type="checkbox" aria-describedby="reg-measurement-description"> Medição de campanhas e interações</label><p id="reg-measurement-description">Usa Google Tag Manager e Google Ads para medir visitas e cliques para abrir o WhatsApp. Um clique não comprova mensagem ou contratação.</p></div>
        <p class="reg-consent-scope">“Aceitar todos” autoriza somente essa medição. Não autoriza personalização de anúncios nem acesso ao conteúdo das conversas.</p>
        <details class="reg-consent-details"><summary>Sobre os dados e sua escolha</summary><p>Com sua autorização, o Google pode usar cookies e receber dados técnicos, identificadores publicitários e informações da interação. A configuração mantém analytics_storage e ad_personalization negados; não envia dados de formulários para conversões otimizadas.</p><p>A preferência vale para a área de regularização durante a sessão desta aba. Ela não configura outras abas, o site institucional nem o WhatsApp. Em uma nova sessão, o aviso poderá reaparecer.</p><p>Ao revogar na landing page, a página será recarregada para interromper as tags carregadas. A atualização do consentimento poderá ser comunicada ao Google. Cookies anteriores não são apagados automaticamente. Nesta política, a escolha será considerada no retorno à landing page na mesma aba.</p></details>
        <a class="reg-consent-policy" href="privacidade.html">Política de Privacidade</a>
        <div class="reg-consent-actions">
          <button type="button" data-reg-choice="accept">Aceitar todos</button>
          <button type="button" data-reg-choice="reject">Rejeitar opcionais</button>
          <button type="button" data-reg-choice="save">Salvar preferências</button>
        </div>
      </dialog>
      <p class="reg-consent-status" role="status" aria-live="polite"></p>`;
    document.body.prepend(ui);
    const banner = ui.querySelector('.reg-consent-banner');
    const launcher = ui.querySelector('.reg-consent-launcher');
    const dialog = ui.querySelector('dialog');
    const checkbox = ui.querySelector('#reg-measurement');
    const status = ui.querySelector('[role="status"]');
    const preferenceButtons = document.querySelectorAll('[data-reg-preferences]');
    let previousFocus;
    // Procurar espaço livre sem mover a página nem cobrir seus links de contato.
    // No desktop, preferir a base do WhatsApp; preservar o enquadramento mobile.
    function placeBanner() {
      if (choice !== null || dialog.open) return;
      banner.hidden = false;
      launcher.hidden = true;
      banner.style.left = '';
      banner.style.top = '';
      banner.style.bottom = '';
      const preferred = banner.getBoundingClientRect();
      const width = preferred.width, height = preferred.height;
      const desktop = window.innerWidth >= 1024;
      const floatingLink = desktop && document.querySelector('.whatsapp-float');
      const floatingRect = floatingLink && floatingLink.getBoundingClientRect();
      const desiredLeft = floatingRect ? Math.max(16, floatingRect.left - width - 12) : preferred.left;
      const desiredTop = floatingRect ? floatingRect.bottom - height : window.innerHeight - height - (window.innerWidth <= 600 ? 100 : 24);
      const protectedRects = Array.from(document.querySelectorAll(desktop ? '[data-contact-id], .header, h1, #panel-title' : '[data-contact-id], .header, h1')).map(function (element) {
        const rect = element.getBoundingClientRect();
        // As seções existentes entram com translateY de 18px. Reservar todo
        // esse trajeto evita que um CTA animado alcance o cartão após o scroll.
        const animatedParent = element.closest('.priority-card, .service-card, .analysis-section .image-split > *, .steps article, .process-image-row > *, .portfolio-row');
        if (!animatedParent) return rect;
        const transform = getComputedStyle(animatedParent).transform;
        const offset = transform === 'none' ? 0 : new DOMMatrixReadOnly(transform).m42;
        return {width:rect.width, height:rect.height, left:rect.left, right:rect.right,
          top:rect.top - offset, bottom:rect.bottom - offset + 18};
      }).filter(function (rect) {
        return rect.width && rect.height && rect.bottom > 0 && rect.top < window.innerHeight;
      });
      const xs = [preferred.left, Math.max(16, window.innerWidth - width - 16)];
      if (desktop) {
        xs.unshift(desiredLeft);
        protectedRects.forEach(function (rect) { xs.push(rect.left - width - 8, rect.right + 8); });
      }
      const ys = [desiredTop, 16];
      protectedRects.forEach(function (rect) { ys.push(rect.top - height - 8, rect.bottom + 8); });
      const positions = [];
      xs.forEach(function (left) { ys.forEach(function (top) {
        if (top < 16 || top + height > window.innerHeight - 16 || left < 16 || left + width > window.innerWidth - 16) return;
        if (protectedRects.some(function (rect) {
          return left < rect.right + 8 && left + width > rect.left - 8 && top < rect.bottom + 8 && top + height > rect.top - 8;
        })) return;
        positions.push({left:left, top:top, distance:desktop
          ? Math.abs(left - desiredLeft) + Math.abs(top - desiredTop) * 3
          : Math.abs(left - preferred.left) * 1.5 + Math.abs(top - ys[0])});
      }); });
      positions.sort(function (a, b) { return a.distance - b.distance; });
      if (positions.length) {
        banner.style.left = positions[0].left + 'px';
        banner.style.top = positions[0].top + 'px';
        banner.style.bottom = 'auto';
      } else {
        // Sem espaço para o cartão, oferecer o painel sem encobrir os CTAs.
        // Recolher a interface nunca altera consentimento ou armazenamento.
        banner.hidden = true;
        launcher.hidden = false;
        launcher.style.left = '';
        launcher.style.top = '';
        launcher.style.bottom = '';
        const small = launcher.getBoundingClientRect();
        const smallYs = [window.innerHeight - small.height - 24, 16];
        protectedRects.forEach(function (rect) { smallYs.push(rect.top - small.height - 8, rect.bottom + 8); });
        const smallPositions = [];
        [small.left, window.innerWidth - small.width - 16].forEach(function (left) {
          smallYs.forEach(function (top) {
            if (top < 16 || top + small.height > window.innerHeight - 16) return;
            if (protectedRects.some(function (rect) {
              return left < rect.right + 8 && left + small.width > rect.left - 8 && top < rect.bottom + 8 && top + small.height > rect.top - 8;
            })) return;
            smallPositions.push({left:left, top:top, distance:Math.abs(left - small.left) * 1.5 + Math.abs(top - smallYs[0])});
          });
        });
        smallPositions.sort(function (a, b) { return a.distance - b.distance; });
        if (smallPositions.length) {
          launcher.style.left = smallPositions[0].left + 'px';
          launcher.style.top = smallPositions[0].top + 'px';
          launcher.style.bottom = 'auto';
        }
      }
    }
    // A espera é somente visual. O padrão denied já foi definido acima.
    // Na política, o painel é aberto somente a pedido do visitante.
    const isLandingPage = /\/regularizacao(?:\/(?:index\.html)?)?$/.test(location.pathname);
    banner.hidden = true;
    if (isLandingPage && choice === null) {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          setTimeout(function () {
            if (choice === null && !dialog.open) { banner.hidden = false; placeBanner(); }
          }, 1000);
        });
      });
    }
    let placementFrame = false;
    function queuePlacement() {
      if (placementFrame || (banner.hidden && launcher.hidden)) return;
      placementFrame = true;
      requestAnimationFrame(function () { placementFrame = false; placeBanner(); });
    }
    window.addEventListener('resize', queuePlacement);
    window.addEventListener('scroll', queuePlacement, { passive: true });

    function closeDialog() {
      if (dialog.open) dialog.close();
    }
    function openDialog() {
      previousFocus = document.activeElement;
      checkbox.checked = choice === true;
      banner.hidden = true;
      launcher.hidden = true;
      dialog.showModal();
      dialog.scrollTop = 0;
      ui.querySelector('#reg-preferences-title').focus({ preventScroll: true });
    }
    dialog.addEventListener('keydown', function (event) {
      if (event.key !== 'Tab') return;
      const controls = Array.from(dialog.querySelectorAll('button:not([disabled]), input:not([disabled]), a[href], summary'))
        .filter(function (element) { return element.getClientRects().length > 0; });
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement.id === 'reg-preferences-title')) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus();
      }
    });
    dialog.addEventListener('close', function () {
      if (isLandingPage && choice === null) { banner.hidden = false; placeBanner(); }
      if (previousFocus && previousFocus.isConnected && !previousFocus.closest('[hidden]')) {
        previousFocus.focus({ preventScroll: true });
      }
    });
    function save(allowed) {
      // Sem armazenamento acessível, permanecer conservador. Nunca carregar tags
      // que não poderão ser desativadas de forma persistente após recarregar.
      try {
        sessionStorage.setItem(KEY, JSON.stringify({ version: 1, measurement: allowed }));
        storageAvailable = sessionStorage.getItem(KEY) !== null;
      } catch (_) { storageAvailable = false; }
      if (!storageAvailable) {
        if (loaded && !allowed) {
          updateSignals(false);
          // Remover só a nossa preferência, nunca cookies compartilhados.
          try { sessionStorage.removeItem(KEY); } catch (_) { /* armazenamento bloqueado */ }
          if (readChoice() !== true) { location.reload(); return; }
          status.textContent = 'Não foi possível remover a preferência salva. O consentimento foi revogado nesta página. Feche esta aba e limpe as preferências deste site no navegador antes de voltar.';
          closeDialog();
          return;
        }
        status.textContent = 'Não foi possível guardar sua escolha nesta aba. A medição opcional permanece desativada. O WhatsApp continua disponível.';
        closeDialog();
        return;
      }
      const revoke = loaded && !allowed;
      choice = allowed;
      updateSignals(allowed);
      banner.hidden = true;
      launcher.hidden = true;
      closeDialog();
      status.textContent = allowed ? 'Medição opcional autorizada nesta aba.' : 'Medição opcional rejeitada nesta aba.';
      if (revoke) {
        // Não basta remover o elemento <script>: isso deixaria ouvintes ativos.
        location.reload();
        return;
      }
      if (allowed) loadMeasurement();
      // Evitar levar o foco para o rodapé fora da área visível após uma escolha.
      const visiblePreference = Array.from(preferenceButtons).find(function (button) {
        const rect = button.getBoundingClientRect();
        return rect.top >= 0 && rect.bottom <= window.innerHeight;
      });
      if (visiblePreference) visiblePreference.focus({ preventScroll: true });
      else {
        const main = document.querySelector('main');
        if (main) {
          const original = main.getAttribute('tabindex');
          main.setAttribute('tabindex', '-1');
          main.focus({ preventScroll: true });
          main.addEventListener('blur', function () {
            if (original === null) main.removeAttribute('tabindex');
            else main.setAttribute('tabindex', original);
          }, { once: true });
        }
      }
    }
    ui.addEventListener('click', function (event) {
      const button = event.target.closest('[data-reg-choice]');
      if (!button) return;
      const action = button.dataset.regChoice;
      if (action === 'customize') openDialog();
      else if (action === 'close') closeDialog();
      else if (action === 'accept') save(true);
      else if (action === 'reject') save(false);
      else if (action === 'save') save(checkbox.checked);
    });
    preferenceButtons.forEach(function (button) {
      button.hidden = false;
      button.addEventListener('click', openDialog);
    });
    // Reavaliar a preferência em uma volta pelo histórico (incluindo bfcache).
    window.addEventListener('pageshow', function (event) {
      if (event.persisted) location.reload();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
