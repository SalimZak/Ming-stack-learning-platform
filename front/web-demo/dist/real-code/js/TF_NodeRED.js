// node red task 2

/* TF oppgave */
function nodeREDT2Start(){
infoBoxText("Dette er en True/False oppgave. Velg riktig svar og lever når du føler deg ferdig. Lykke til!");
//skjuler infoside og mc, og viser mc oppgave. nullstiller valgte svar
  document.getElementById('noderedT2-infobox').style.display='none'; 
  document.getElementById('noderedT2-taskbox').style.display='block';  
  selectedAnswersTF = [];
  taskFinishedTF = false;
}