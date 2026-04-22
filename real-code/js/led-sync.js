// led-sync.js
// Tells the ESP32 which LED to light up based on the current page.

(function () {
  // Wrap the original go() function so we can hook into every navigation
  const _originalGo = go;

  window.go = function (page) {
    _originalGo(page);
    notifyLed(page);
  };

  function notifyLed(page) {
    fetch('/led?page=' + encodeURIComponent(page))
      .catch(function (err) {
        console.warn('LED sync failed:', err);
      });
  }

  // Sync LED on first load (in case user refreshes on a specific page)
  document.addEventListener('DOMContentLoaded', function () {
    notifyLed(typeof _currentPage !== 'undefined' ? _currentPage : 'home');
  });
})();
