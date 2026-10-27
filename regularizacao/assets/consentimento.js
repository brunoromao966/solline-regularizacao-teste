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
          <h2 id="reg-consent-title">Sua privacidade, sua escolha</h2>
          <p>Com sua autorização, usamos tecnologias do Google para medir visitas e cliques no WhatsApp relacionados às nossas campanhas. Você pode rejeitar a medição opcional e continuar usando a página e o WhatsApp normalmente. Sua escolha vale para esta área de regularização, nesta aba. <a href="privacidade.html">Leia o aviso de privacidade</a>.</p>
          <div class="reg-consent-actions">
            <button type="button" data-reg-choice="accept">Aceitar</button>
            <button type="button" data-reg-choice="reject">Rejeitar não necessários</button>
            <button type="button" data-reg-choice="customize">Personalizar</button>
          </div>
        </div>
      </section>
      <dialog class="reg-consent-dialog" aria-labelledby="reg-preferences-title" aria-describedby="reg-preferences-intro">
        <h2 id="reg-preferences-title">Preferências de privacidade</h2>
        <p id="reg-preferences-intro">Estas escolhas se aplicam à área de regularização e não configuram o site institucional nem o WhatsApp.</p>
        <div class="reg-consent-category"><h3>Funcionamento e preferências</h3><p>Recursos locais necessários à página e ao registro da sua escolha. A preferência fica nesta aba, durante a sessão, sem enviar esse registro a um servidor da Solline.</p></div>
        <div class="reg-consent-category"><label><input id="reg-measurement" type="checkbox"> Medição de campanhas e interações</label><p>Permite carregar o Google Tag Manager e as tags do Google Ads para medir visitas e cliques no WhatsApp. O Google pode receber dados técnicos, identificadores publicitários e informações da interação e usar cookies para medição. Um clique não comprova mensagem enviada ou contratação.</p></div>
        <p>Esta configuração não autoriza personalização de anúncios nem ativa uma nova ferramenta de análise de visitas. Não enviamos o texto das mensagens nem dados de formulários por este controle.</p>
        <p>Ao revogar uma autorização, a página será recarregada para interromper as tags já carregadas. A atualização do estado de consentimento poderá ser comunicada ao Google. Cookies criados anteriormente não são apagados automaticamente, pois podem ser compartilhados com outras páginas.</p>
        <a href="privacidade.html">Consultar o aviso de privacidade</a>
        <div class="reg-consent-actions">
          <button type="button" data-reg-choice="save">Salvar preferências</button>
          <button type="button" data-reg-choice="reject">Rejeitar não necessários</button>
          <button type="button" data-reg-choice="close">Fechar sem alterar</button>
        </div>
      </dialog>
      <p class="reg-consent-status" role="status" aria-live="polite"></p>`;
    document.body.prepend(ui);
    const banner = ui.querySelector('.reg-consent-banner');
    const dialog = ui.querySelector('dialog');
    const checkbox = ui.querySelector('#reg-measurement');
    const status = ui.querySelector('[role="status"]');
    const preferenceButtons = document.querySelectorAll('[data-reg-preferences]');
    let previousFocus;
    banner.hidden = choice !== null;

    function closeDialog() {
      if (dialog.open) dialog.close();
    }
    function openDialog() {
      previousFocus = document.activeElement;
      checkbox.checked = choice === true;
      dialog.showModal();
    }
    dialog.addEventListener('close', function () {
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
      closeDialog();
      status.textContent = allowed ? 'Medição opcional autorizada nesta aba.' : 'Medição opcional rejeitada nesta aba.';
      if (revoke) {
        // Não basta remover o elemento <script>: isso deixaria ouvintes ativos.
        location.reload();
        return;
      }
      if (allowed) loadMeasurement();
      preferenceButtons[0]?.focus({ preventScroll: true });
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
