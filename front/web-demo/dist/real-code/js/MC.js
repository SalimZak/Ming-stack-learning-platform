// dette er logikken for multiplechoice task 1

// variabler
let selectedAnswersMC = []; //lagrer valgte svar for mc i array
let selectedAnswersTF = []; //lagrer valgte svar for tf i array
let taskFinishedMC = false; //sjekk om mc er ferdig
let taskFinishedTF = false; //sjekk om tf er ferdig

//quizen med spørsmål
function quizSelect(btn, answerI){

  let qBox = btn.parentElement; // finner spørsmål boksen
  let buttons = qBox.querySelectorAll('button'); //finner alle svar knappene
  let group; // variabel for riktig type (mc eller tf)
  let selectedAnswers;// lagrer gnerelle svar og sjekk
  let taskFinished;

//MC
  if(qBox.classList.contains('MCbox')){ 
    group = '.MCbox';
    selectedAnswers = selectedAnswersMC;
    taskFinished = taskFinishedMC;
  }
  //TF
  else if(qBox.classList.contains('TFbox')){
    group = '.TFbox';
    selectedAnswers = selectedAnswersTF;
    taskFinished = taskFinishedTF;
  }

  if(taskFinished) return; // stopper oppgave dersom den er ferdig
  let activePage = document.querySelector('.page-view.active');
  let boxes = activePage.querySelectorAll(group); // henter alle spørsmålene fra den samme gruppen
  let realI = Array.from(boxes).indexOf(qBox); // finner nummer på spørsmålet, fra spørsmålsboksen
  buttons.forEach(b => b.classList.remove('selected')); // fjerner valgt og markere ny som git fritt valg av svar
  btn.classList.add('selected');
  selectedAnswers[realI] = answerI; // lagrer svarene på riktig plass
}

function quizFinish(boxClass, scoreId){

  let selectedAnswers; // riktig lagret verdier basert på gruppe
  if(boxClass === '.MCbox'){
    taskFinishedMC = true;
    selectedAnswers = selectedAnswersMC;
  } else {
    taskFinishedTF = true;
    selectedAnswers = selectedAnswersTF;
  }

  let activePage = document.querySelector('.page-view.active');
  let qBoxes = activePage.querySelectorAll(boxClass); // henter alle spørsmål fra den siden som er aktiv
  let score = 0; // teller poeng

  qBoxes.forEach((box,i)=>{ // går gjennom alle spørsmålene
    let riktig = Number(box.dataset.correct); // riktig svar fra data.correct
    let buttons = box.querySelectorAll('button'); // alle valgalternativene

    buttons.forEach((btn,index)=>{ // går gjennom alle svarene
      btn.disabled = true; // fjerner funksjonalitet for knapp og fagre for valgt svar
      btn.classList.remove('selected');

      if(index === riktig){ // hvis dette er riktig svar er grønn
        btn.classList.add('correct');
      }

      if(selectedAnswers[i] === index && selectedAnswers[i] !== riktig){ //går gjennomvalgt svar og ser om feil og da blir den rød
        btn.classList.add('wrong');
      }
    });

    if(selectedAnswers[i] === riktig){ // hvis bruker valgte riktig så øker poeng
      score++;
    }
  });

  document.getElementById(scoreId).innerText =
    `Poeng Score: ${score} / ${qBoxes.length}`; //oppdaterer score/spørsmåls lengden

  // henter oppgave-id fra aktiv side og lagrer poeng
  let pageId = activePage.id.replace('page-', '');
  pointSystem(pageId, score);
}



