// ══════════════════════════════════════════════════════════
//  GRAFANA — Oppgave 1 (Multiple Choice)
// ══════════════════════════════════════════════════════════

(function () {
  const quiz = MCQuiz.create('grafanaT1');

  window.grafanaT1Start = function () {
    quiz.start('grafanaT1-infobox', 'grafanaT1-taskbox');
  };

  window.grafanaT1Select = function (btn, idx) {
    quiz.select(btn, idx);
  };

  window.grafanaT1Finish = function () {
    quiz.finish('.MCbox', 'grafanaT1-score');
  };

  window.grafanaT1OpenInfo = function () {
    document.getElementById('grafanaT1-popup-text').textContent = t('mc_grafana_info');
    document.getElementById('grafanaT1-popup').classList.add('visible');
  };

  window.grafanaT1CloseInfo = function () {
    document.getElementById('grafanaT1-popup').classList.remove('visible');
  };
})();
