//influx task 1

function influxT1Start(){
  infoBoxText("Dette er en Multiple Choice oppgave for Influx. Velg riktig svar og lever når du føler deg ferdig. Lykke til!");
  document.getElementById('influxT1-infobox').style.display='none';
  document.getElementById('influxT1-taskbox').style.display='block';
  selectedAnswersMC = [];
  taskFinishedMC = false;
}