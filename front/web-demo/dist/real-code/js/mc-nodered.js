// ══════════════════════════════════════════════════════════
//  NODE-RED — Oppgave 1 (Multiple Choice)
// ══════════════════════════════════════════════════════════

(function () {
  const quiz = MCQuiz.create('noderedT1');

  window.noderedT1Start = function () {
    quiz.start('noderedT1-infobox', 'noderedT1-taskbox');
  };

  window.noderedT1Select = function (btn, idx) {
    quiz.select(btn, idx);
  };

  window.noderedT1Finish = function () {
    quiz.finish('.MCbox', 'noderedT1-score');
  };

  window.noderedT1OpenInfo = function () {
    document.getElementById('noderedT1-popup-text').textContent = t('mc_nodered_info');
    document.getElementById('noderedT1-popup').classList.add('visible');
  };

  window.noderedT1CloseInfo = function () {
    document.getElementById('noderedT1-popup').classList.remove('visible');
  };
})();
