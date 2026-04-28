//  MQTT task 1


/* MC oppgave */
function mqttT1Start(){
  infoBoxText("Dette er en Multiple Choice oppgave for MQTT. Velg riktig svar og lever når du føler deg ferdig. Lykke til!");
//skjuler infoside, og viser mc oppgave. nullstiller valgte svar
  document.getElementById('mqttT1-infobox').style.display='none';
  document.getElementById('mqttT1-taskbox').style.display='block';

  selectedAnswersMC = [];
  taskFinishedMC = false;
}

