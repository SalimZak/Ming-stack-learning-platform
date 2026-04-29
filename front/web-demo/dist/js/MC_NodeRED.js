// node red multiplechoice task 1

/* MC oppgave */
function nodeREDT1Start(){
  infoBoxText("Dette er en Multiple Choice oppgave for Node-RED. Velg riktig svar og lever når du føler deg ferdig. Lykke til!");
//skjuler infoside og tf, og viser mc oppgave. nullstiller valgte svar
  document.getElementById('noderedT1-infobox').style.display='none';
  document.getElementById('noderedT1-taskbox').style.display='block'; 
  selectedAnswersMC = [];
  taskFinishedMC = false;
}