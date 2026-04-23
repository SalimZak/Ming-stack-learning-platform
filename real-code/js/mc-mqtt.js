// ══════════════════════════════════════════════════════════
//  MC-QUIZ ENGINE — delt motor for alle Multiple Choice sider
//  Brukes av: mc-mqtt.js, mc-influx.js, mc-nodered.js, mc-grafana.js
// ══════════════════════════════════════════════════════════

// Namespace for å unngå konflikter mellom modulene
window.MCQuiz = window.MCQuiz || {};

/**
 * Oppretter en ny quiz-instans.
 * @param {string} namespace - unik streng per modul (f.eks. 'mqttT1')
 */
MCQuiz.create = function(namespace) {
  const ns = namespace;

  // Privat tilstand per instans
  const state = {
    selectedAnswers: [],
    finished: false,
  };

  /** Brukeren klikker et svaralternativ */
  function select(btn, answerIndex) {
    if (state.finished) return;

    const qBox    = btn.parentElement;
    const boxClass = qBox.classList.contains('MCbox') ? '.MCbox' : '.TFbox';

    // Finn indeks for dette spørsmålet blant alle spørsmål på siden
    const allBoxes = document.querySelectorAll(`#${ns}-taskbox ${boxClass}`);
    const qIndex   = Array.from(allBoxes).indexOf(qBox);

    // Fjern markering på alle knapper i denne boksen, marker valgt
    qBox.querySelectorAll('button').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');

    state.selectedAnswers[qIndex] = answerIndex;
  }

  /** Brukeren trykker «Lever» */
  function finish(boxClass, scoreElId) {
    state.finished = true;

    const qBoxes = document.querySelectorAll(`#${ns}-taskbox ${boxClass}`);
    let score = 0;

    qBoxes.forEach((box, i) => {
      const correct  = Number(box.dataset.correct);
      const buttons  = box.querySelectorAll('button');

      buttons.forEach((btn, idx) => {
        btn.disabled = true;
        btn.classList.remove('selected');

        if (idx === correct) {
          btn.classList.add('correct');
        }
        if (state.selectedAnswers[i] === idx && state.selectedAnswers[i] !== correct) {
          btn.classList.add('wrong');
        }
      });

      if (state.selectedAnswers[i] === correct) score++;
    });
    pointSystem(mqtt_t1,score);

    document.getElementById(scoreElId).textContent =
      `${t('mc_score')}: ${score} / ${qBoxes.length}`;

  }

  /** Starter oppgaven (skjuler infobox, viser taskbox) */
  function start(infoboxId, taskboxId) {
    document.getElementById(infoboxId).style.display = 'none';
    document.getElementById(taskboxId).style.display = 'block';
    state.selectedAnswers = [];
    state.finished = false;
  }

  // Eksporter offentlig API
  return { select, finish, start };
};

// ══════════════════════════════════════════════════════════
//  MQTT — Oppgave 1 (Multiple Choice)
// ══════════════════════════════════════════════════════════

(function () {
  const quiz = MCQuiz.create('mqttT1');

  // Start-funksjon kalt fra HTML
  window.mqttT1Start = function () {
    quiz.start('mqttT1-infobox', 'mqttT1-taskbox');
  };

  // Svalfunksjon kalt fra HTML-knappene
  window.mqttT1Select = function (btn, idx) {
    quiz.select(btn, idx);
  };

  // Innlevering kalt fra Lever-knappen
  window.mqttT1Finish = function () {
    quiz.finish('.MCbox', 'mqttT1-score');
  };

  // Info-popup
  window.mqttT1OpenInfo = function () {
    document.getElementById('mqttT1-popup-text').textContent = t('mc_mqtt_info');
    document.getElementById('mqttT1-popup').classList.add('visible');
  };

  window.mqttT1CloseInfo = function () {
    document.getElementById('mqttT1-popup').classList.remove('visible');
  };
})();
