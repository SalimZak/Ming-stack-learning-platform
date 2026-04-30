// Grafana task 1

function grafanaT1Start(){
  infoBoxText("Dette er en Multiple Choice oppgave for MQTT. Velg riktig svar og lever når du føler deg ferdig. Lykke til!");
  document.getElementById('grafanaT1-infobox').style.display='none';
  document.getElementById('grafanaT1-taskbox').style.display='block';
  selectedAnswersMC = [];
  taskFinishedMC = false;
}