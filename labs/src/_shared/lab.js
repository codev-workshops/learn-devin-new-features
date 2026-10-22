(function () {
  'use strict';
  // Answers always start hidden: nothing is persisted, so a reload restores the default.
  function setOpen(button, open) {
    var body = document.getElementById(button.getAttribute('aria-controls'));
    if (!body) return;
    body.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
    button.textContent = (open ? 'Hide answer: ' : 'Show answer: ') + button.getAttribute('data-label');
  }
  function hideAll() {
    var buttons = document.querySelectorAll('.show-answer');
    for (var i = 0; i < buttons.length; i += 1) setOpen(buttons[i], false);
  }
  document.addEventListener('click', function (event) {
    var button = event.target.closest && event.target.closest('.show-answer');
    if (button) setOpen(button, button.getAttribute('aria-expanded') !== 'true');
  });
  // Back/forward cache can restore a page with answers open; reset them.
  window.addEventListener('pageshow', function (event) {
    if (event.persisted) hideAll();
  });
  hideAll();
})();
