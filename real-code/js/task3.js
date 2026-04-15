// ── MQTT OPPGAVE 3 ───────────────────────────────────────────

//lagret med localstorage


let t3Selected = null;  // pilen brukeren har valgt
let t3Correct  = 0;     // antall riktig plasserte piler
const T3_REQUIRED = 8;  // oppgaven er ferdig når alle 8 soner er fylt
let score = 0;

// Oppdaterer etiketter i diagrammet — kalles også ved språkbytte
function t3RefreshLabels() {
  const map = {
    't3-lbl-temp':   't3_tempSensor',
    't3-lbl-hum':    't3_humSensor',
    't3-lbl-c1':     't3_client1',
    't3-lbl-c2':     't3_client2',
    't3-lbl-c3':     't3_client3',
    't3-broker-lbl': 't3_broker',
  };
  Object.entries(map).forEach(([id, key]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = t(key);
  });
}

// Kalles av Start-knappen — skjuler infoboks og viser diagrammet
function t3Start() {

    //hente lagret data når siden refreasher
  let data = readData();
  score = data.tasks["task3"] || 0;
  scoreT3();

  document.getElementById('t3-infobox').style.display = 'none';
  document.getElementById('t3-taskbox').style.display = 'block';
  document.getElementById('t3-layout').style.display  = 'flex';
  t3RefreshLabels();
  t3Correct  = 0;
  t3Selected = null;
  document.getElementById('t3-complete-banner').style.display = 'none';

  // nullstiller dropzones
  document.querySelectorAll('.dropzone').forEach(z => {
  z.dataset.tried = ""; // reaster første forsøk
  z.classList.remove('zone-correct', 'zone-wrong'); // reseter farger
  z.innerHTML = t('t3_clickPlace'); // tekst blir plassert tilbake

});


  // Pilene inkluderer duplikater — TempPublish finnes to ganger fordi
  // samme temperaturmelding videresendes til Klient 1 og Klient 3
  const arrows = [
    { type: 'TempPublish', text: 'Publish: 50\u00b0C\nTopic: Temp', dir: 'right' },
    { type: 'HumPublish',  text: 'Publish: 45% RH\nTopic: Hum',    dir: 'right' },
    { type: 'SubTemp',     text: 'Subscribe\nTopic: Temp',          dir: 'both'  },
    { type: 'SubHum',      text: 'Subscribe\nTopic: Hum',           dir: 'both'  },
    { type: 'TempPublish', text: 'Publish: 50\u00b0C',              dir: 'right' },
    { type: 'HumPublish',  text: 'Publish: 45% RH',                 dir: 'right' },
  ];

  const list = document.getElementById('t3-arrows');
  list.innerHTML = '';
  arrows.forEach((a, i) => {
    const btn = document.createElement('button');
    btn.className     = 'arrow-btn ' + a.dir;
    btn.textContent   = a.text;
    btn.dataset.index = i;
    btn.onclick       = () => t3SelectArrow(btn, a);
    list.appendChild(btn);
  });
}

// Markerer den valgte pilen og lagrer den i t3Selected
function t3SelectArrow(btn, arrow) {
  document.querySelectorAll('.arrow-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  t3Selected = arrow;
}

// Kalles når brukeren klikker en dropsone
function t3Place(zone) {
  if (zone.classList.contains('zone-correct')) return;  // allerede fylt, ignorer
  if (!t3Selected) return;  // ingen pil valgt, ignorer
  //Sjekk om det er riktig på første forsøk
  const correctFirst = !zone.dataset.tried;
  zone.dataset.tried = "correct";

  const ok = t3Selected.type === zone.dataset.expected;

  // Erstatter plassholder-teksten med den valgte pilen
  zone.innerHTML = `<div class="arrow-btn ${t3Selected.dir}" style="pointer-events:none;margin:0;width:auto">${t3Selected.text}</div>`;

  if (ok) {
    zone.classList.add('zone-correct');
    t3Correct++;
    //sette poengene i localstorage sitt system
    if (correctFirst) {
    score++;
    // lagre pointsystem
    pointSystem("task3", score);
    scoreT3();
}
    t3ShowMsg(t('t3_valid'), true);
    if (t3Correct >= T3_REQUIRED) {
      document.getElementById('t3-complete-banner').style.display = 'block';
    }
  } else {
    zone.classList.add('zone-wrong');
    t3ShowMsg(t('t3_invalid'), false);
    // Nullstiller sonen etter 900ms så brukeren kan prøve igjen
    setTimeout(() => {
      zone.classList.remove('zone-wrong');
      let hintKey;
      if (zone.dataset.expected.startsWith('Sub')) {
        hintKey = 't3_hintSubscribe';
      } else {
        // Sjekker om sonen er på venstre (sensor) eller høyre (klient) side
        const sides = document.querySelectorAll('#t3-layout > .mqtt-side');
        hintKey = sides[0] && sides[0].contains(zone) ? 't3_hintPublish' : 't3_hintForward';
      }
      zone.innerHTML = `<div>${t('t3_clickPlace')}</div><div class="dropzone-hint">${t(hintKey)}</div>`;
    }, 900);
  }

  // Tømmer valget uansett om svaret var riktig eller feil
  t3Selected = null;
  document.querySelectorAll('.arrow-btn').forEach(b => b.classList.remove('selected'));
}

// Viser en kort riktig/feil-melding som skjules etter 1 sekund
function t3ShowMsg(text, ok) {
  const el = document.getElementById('t3-message');
  el.textContent   = text;
  el.className     = 'messagebox ' + (ok ? 'message-correct' : 'message-wrong');
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 1000);
}

  //oppdaterer poenget for oppgaven
  function scoreT3() {
  document.getElementById("t3-score").textContent = "Poeng: " + score;
}

