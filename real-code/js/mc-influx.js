// ══════════════════════════════════════════════════════════
//  INFLUXDB — Oppgave 1 (Multiple Choice)
// ══════════════════════════════════════════════════════════

(function () {
  const quiz = MCQuiz.create('influxT1');

  window.influxT1Start = function () {
    quiz.start('influxT1-infobox', 'influxT1-taskbox');
  };

  window.influxT1Select = function (btn, idx) {
    quiz.select(btn, idx);
  };

  window.influxT1Finish = function () {
    quiz.finish('.MCbox', 'influxT1-score');
  };

  window.influxT1OpenInfo = function () {
    document.getElementById('influxT1-popup-text').textContent = t('mc_influx_info');
    document.getElementById('influxT1-popup').classList.add('visible');
  };

  window.influxT1CloseInfo = function () {
    document.getElementById('influxT1-popup').classList.remove('visible');
  };
})();
