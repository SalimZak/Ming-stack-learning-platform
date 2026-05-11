// ── INFLUXDB OPPGAVE 4 — Drag og slipp (placeholder) ──────────

const INFT4_PAIRS = [
  { id: 'a', itemLabel: 'Insert item text 1', slotLabel: 'Insert slot title 1', slotHint: 'Insert hint 1' },
  { id: 'b', itemLabel: 'Insert item text 2', slotLabel: 'Insert slot title 2', slotHint: 'Insert hint 2' },
  { id: 'c', itemLabel: 'Insert item text 3', slotLabel: 'Insert slot title 3', slotHint: 'Insert hint 3' },
  { id: 'd', itemLabel: 'Insert item text 4', slotLabel: 'Insert slot title 4', slotHint: 'Insert hint 4' },
  { id: 'e', itemLabel: 'Insert item text 5', slotLabel: 'Insert slot title 5', slotHint: 'Insert hint 5' },
  { id: 'f', itemLabel: 'Insert item text 6', slotLabel: 'Insert slot title 6', slotHint: 'Insert hint 6' },
];

let inft4CorrectCount = 0;

function inft4Shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function inft4FlashMsg(text, ok) {
  const el = document.getElementById('inft4-flash-msg');
  el.textContent = text;
  el.className = 'messagebox ' + (ok ? 'message-correct' : 'message-wrong');
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 900);
}

function inft4BuildItems() {
  const source = document.getElementById('inft4-drag-source');
  source.innerHTML = '<div class="drag-source-label">Insert label here</div>';

  inft4Shuffle(INFT4_PAIRS).forEach(p => {
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

function inft4BuildSlots() {
  const grid = document.getElementById('inft4-drop-grid');
  grid.innerHTML = '';
  inft4CorrectCount = 0;

  inft4Shuffle(INFT4_PAIRS).forEach(p => {
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
      inft4HandleDrop(slot, e.dataTransfer.getData('text/plain'));
    });

    grid.appendChild(slot);
  });
}

function inft4HandleDrop(slot, itemId) {
  const ok = itemId === slot.dataset.expects;
  const item = document.querySelector('#inft4-drag-source .drag-item[data-id="' + itemId + '"]');

  if (ok) {
    slot.classList.add('correct');
    const droparea = slot.querySelector('.slot-droparea');
    const pair = INFT4_PAIRS.find(p => p.id === itemId);
    droparea.textContent = pair ? pair.itemLabel : itemId;
    if (item) item.remove();
    inft4CorrectCount++;
    inft4FlashMsg('\u2713 Correct!', true);
    if (inft4CorrectCount >= INFT4_PAIRS.length) {
      document.getElementById('inft4-complete-banner').style.display = 'block';
    }
  } else {
    slot.classList.add('wrong-flash');
    inft4FlashMsg('\u2717 Try again', false);
    setTimeout(() => slot.classList.remove('wrong-flash'), 800);
  }
}

function inft4StartTask() {
  document.getElementById('inft4-infobox').style.display = 'none';
  document.getElementById('inft4-task-area').style.display = 'block';
  document.getElementById('inft4-complete-banner').style.display = 'none';
  inft4BuildItems();
  inft4BuildSlots();
}

function inft4ResetTask() {
  document.getElementById('inft4-complete-banner').style.display = 'none';
  inft4BuildItems();
  inft4BuildSlots();
}
