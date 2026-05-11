// influx task 3

/* TF oppgave */
function influxT3Start(){
infoBoxText("Dette er en True/False oppgave. Velg riktig svar og lever når du føler deg ferdig. Lykke til!");
//skjuler infoside og viser tf oppgave. nullstiller valgte svar
  document.getElementById('influxT3-infobox').style.display='none'; 
  document.getElementById('influxT3-taskbox').style.display='block';  
  selectedAnswersTF = [];
  taskFinishedTF = false;
}
