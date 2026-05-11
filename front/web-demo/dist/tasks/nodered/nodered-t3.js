// ── NODE-RED OPPGAVE 3 — Drag og slipp (placeholder) ──────────

const NRT3_PAIRS = [
  { id: 'a', itemLabel: 'Insert item text 1', slotLabel: 'Insert slot title 1', slotHint: 'Insert hint 1' },
  { id: 'b', itemLabel: 'Insert item text 2', slotLabel: 'Insert slot title 2', slotHint: 'Insert hint 2' },
  { id: 'c', itemLabel: 'Insert item text 3', slotLabel: 'Insert slot title 3', slotHint: 'Insert hint 3' },
  { id: 'd', itemLabel: 'Insert item text 4', slotLabel: 'Insert slot title 4', slotHint: 'Insert hint 4' },
  { id: 'e', itemLabel: 'Insert item text 5', slotLabel: 'Insert slot title 5', slotHint: 'Insert hint 5' },
  { id: 'f', itemLabel: 'Insert item text 6', slotLabel: 'Insert slot title 6', slotHint: 'Insert hint 6' },
];

let nrt3CorrectCount = 0;

function nrt3Shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function nrt3FlashMsg(text, ok) {
  const el = document.getElementById('nrt3-flash-msg');
  el.textContent = text;
  el.className = 'messagebox ' + (ok ? 'message-correct' : 'message-wrong');
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 900);
}

function nrt3BuildItems() {
  const source = document.getElementById('nrt3-drag-source');
  source.innerHTML = '<div class="drag-source-label">Insert label here</div>';

  nrt3Shuffle(NRT3_PAIRS).forEach(p => {
    const el = document.createElement('div');
    el.className = 'drag-item';
    el.draggable = true;
    el.textContent = p.itemLabel;
    el.dataset.id = p.id;

    el.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', p.id);
      e.dataTransfer.effectAllowed = 'move';
      el.classList.add('dragging');
    });
    el.addEventListener('dragend', () => el.classList.remove('dragging'));
    source.appendChild(el);
  });
}

function nrt3BuildSlots() {
  const grid = document.getElementById('nrt3-drop-grid');
  grid.innerHTML = '';
  nrt3CorrectCount = 0;

  nrt3Shuffle(NRT3_PAIRS).forEach(p => {
    const slot = document.createElement('div');
    slot.className = 'drop-slot';
    slot.dataset.expects = p.id;
    slot.innerHTML =
      '<div class="slot-label">' + p.slotLabel + '</div>' +
      '<div class="slot-hint">' + p.slotHint + '</div>' +
      '<div class="slot-droparea">Drop here</div>';

    slot.addEventListener('dragover', e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      slot.classList.add('drag-over');
    });
    slot.addEventListener('dragleave', () => slot.classList.remove('drag-over'));

    slot.addEventListener('drop', e => {
      e.preventDefault();
      slot.classList.remove('drag-over');
      if (slot.classList.contains('correct')) return;
      nrt3HandleDrop(slot, e.dataTransfer.getData('text/plain'));
    });

    grid.appendChild(slot);
  });
}

function nrt3HandleDrop(slot, itemId) {
  const ok = itemId === slot.dataset.expects;
  const item = document.querySelector('#nrt3-drag-source .drag-item[data-id="' + itemId + '"]');

  if (ok) {
    slot.classList.add('correct');
    const droparea = slot.querySelector('.slot-droparea');
    const pair = NRT3_PAIRS.find(p => p.id === itemId);
    droparea.textContent = pair ? pair.itemLabel : itemId;
    if (item) item.remove();
    nrt3CorrectCount++;
    nrt3FlashMsg('\u2713 Correct!', true);
    if (nrt3CorrectCount >= NRT3_PAIRS.length) {
      document.getElementById('nrt3-complete-banner').style.display = 'block';
    }
  } else {
    slot.classList.add('wrong-flash');
    nrt3FlashMsg('\u2717 Try again', false);
    setTimeout(() => slot.classList.remove('wrong-flash'), 800);
  }
}

function nrt3StartTask() {
  document.getElementById('nrt3-infobox').style.display = 'none';
  document.getElementById('nrt3-task-area').style.display = 'block';
  document.getElementById('nrt3-complete-banner').style.display = 'none';
  nrt3BuildItems();
  nrt3BuildSlots();
}

function nrt3ResetTask() {
  document.getElementById('nrt3-complete-banner').style.display = 'none';
  nrt3BuildItems();
  nrt3BuildSlots();
}
