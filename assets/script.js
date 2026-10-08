'use strict';
// Links continuam funcionais sem JavaScript; nenhuma tag ou rastreamento é carregado.
const panel = document.getElementById('contact-panel');
const openButton = document.getElementById('panel-open');
const closeButton = document.getElementById('panel-close');

function setPanel(isOpen, moveFocus = false) {
  panel.hidden = !isOpen;
  openButton.hidden = isOpen;
  openButton.setAttribute('aria-expanded', String(isOpen));
  if (moveFocus) (isOpen ? closeButton : openButton).focus({preventScroll: true});
}
// Exibir as opções de contato desde o início em todas as telas.
setPanel(true);
closeButton.hidden = false;
openButton.addEventListener('click', () => { setPanel(true, true); });
closeButton.addEventListener('click', () => { setPanel(false, true); });
panel.addEventListener('keydown', event => {
  if (event.key === 'Escape') { setPanel(false, true); }
});

// Movimento progressivo: o conteúdo sempre começa visível e utilizável.
// Um observador; sem eventos contínuos de scroll ou bibliotecas de animação.
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let revealObserver;
const runningAnimations = new Set();
function gentleEntry(element, distance = 18, duration = 480, delay = 0) {
  if (reducedMotion.matches || !element.animate) return;
  const animation = element.animate([
    { opacity: .55, transform: `translateY(${distance}px)` },
    { opacity: 1, transform: 'translateY(0)' }
  ], {duration, delay, easing: 'cubic-bezier(.2,.7,.2,1)'});
  runningAnimations.add(animation);
  animation.finished.catch(() => {}).finally(() => runningAnimations.delete(animation));
}
const revealItems = document.querySelectorAll('.section-heading, .situations h2, .priority-card, .service-card, .analysis-section .image-split > *, .steps article, .process-image-row > *, .trust-grid article, .faq-list, .portfolio-row');
if ('IntersectionObserver' in window) {
  revealObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const element = entry.target;
      element.classList.add('is-revealed');
      const siblings = Array.from(element.parentElement.children);
      gentleEntry(element, 18, 480, Math.min(siblings.indexOf(element) % 4, 3) * 45);
      revealObserver.unobserve(element);
    }
  }, {threshold:.08, rootMargin:'0px 0px -12px 0px'});
  revealItems.forEach(element => revealObserver.observe(element));
}

openButton.addEventListener('click', () => gentleEntry(panel, 8, 240));
document.addEventListener('focusin', event => {
  // Teclado nunca precisa aguardar um efeito para usar o conteúdo.
  const item = event.target.closest('.service-card, .priority-card, .contact-panel, .faq-list');
  if (item && item.getAnimations) item.getAnimations({subtree:true}).forEach(animation => animation.finish());
});
reducedMotion.addEventListener('change', () => {
  if (reducedMotion.matches) runningAnimations.forEach(animation => animation.cancel());
});

// Manter o controle focado acima do contato flutuante quando houver sobreposição.
const floatingContact = document.getElementById('whatsapp-float');
document.addEventListener('focusin', event => {
  if (!(event.target instanceof HTMLElement) || event.target === floatingContact) return;
  const rect = event.target.getBoundingClientRect();
  const floating = floatingContact.getBoundingClientRect();
  if (rect.right > floating.left && rect.left < floating.right && rect.bottom > floating.top && rect.top < floating.bottom) {
    window.scrollBy({top: rect.bottom - floating.top + 16, behavior: 'instant'});
  }
});

// Menu do celular: disclosure acessível, sem bibliotecas ou mudanças no desktop.
const siteHeader = document.querySelector('.header');
const menuToggle = document.querySelector('.mobile-menu-toggle');
const headerNavigation = document.getElementById('header-navigation');
const headerWhatsapp = document.getElementById('header-whatsapp');
const mobileMenu = window.matchMedia('(max-width: 600px)');
function setMobileMenu(isOpen, returnFocus = false) {
  siteHeader.classList.toggle('menu-open', isOpen);
  menuToggle.setAttribute('aria-expanded', String(isOpen));
  menuToggle.setAttribute('aria-label', isOpen ? 'Fechar menu de navegação' : 'Abrir menu de navegação');
  if (returnFocus) menuToggle.focus({preventScroll:true});
}
siteHeader.classList.add('menu-ready');
menuToggle.addEventListener('click', () => setMobileMenu(menuToggle.getAttribute('aria-expanded') !== 'true'));
headerNavigation.addEventListener('click', event => {
  if (!mobileMenu.matches) return;
  const link = event.target.closest('a');
  if (!link) return;
  setMobileMenu(false);
  const destination = document.querySelector(link.getAttribute('href'));
  if (destination) {
    destination.setAttribute('tabindex', '-1');
    destination.focus({preventScroll:true});
    destination.addEventListener('blur', () => destination.removeAttribute('tabindex'), {once:true});
  }
});
headerWhatsapp.addEventListener('click', () => { if (mobileMenu.matches) setMobileMenu(false, true); });
siteHeader.addEventListener('keydown', event => {
  if (event.key === 'Escape' && mobileMenu.matches && siteHeader.classList.contains('menu-open')) {
    event.preventDefault();
    setMobileMenu(false, true);
  }
});
document.addEventListener('click', event => {
  if (mobileMenu.matches && !siteHeader.contains(event.target)) {
    const focusInside = headerNavigation.contains(document.activeElement) || document.activeElement === headerWhatsapp;
    setMobileMenu(false, focusInside);
  }
});
siteHeader.addEventListener('focusout', event => {
  if (mobileMenu.matches && event.relatedTarget && !siteHeader.contains(event.relatedTarget)) setMobileMenu(false);
});
mobileMenu.addEventListener('change', () => {
  const active = document.activeElement;
  setMobileMenu(false, mobileMenu.matches && (headerNavigation.contains(active) || active === headerWhatsapp));
  if (!mobileMenu.matches && active === menuToggle) headerNavigation.querySelector('a').focus({preventScroll:true});
});
