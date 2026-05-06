// grafana task 2

/* TF oppgave */
function grafanaT2Start(){
infoBoxText("Dette er en True/False oppgave. Velg riktig svar og lever når du føler deg ferdig. Lykke til!");
//skjuler infoside og viser mc oppgave. nullstiller valgte svar
  document.getElementById('grafanaT2-infobox').style.display='none'; 
  document.getElementById('grafanaT2-taskbox').style.display='block';  
  selectedAnswersTF = [];
  taskFinishedTF = false;
}