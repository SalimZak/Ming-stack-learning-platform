//  MQTT task 1

// popup system
function openInfo(){

  let text = ""; // tekst i popup
  if(document.getElementById('page-mqtt-t1').style.display !== 'none'){
    text = "Dette er en Multiple Choice oppgave for MQTT. Velg riktig svar og lever når du føler deg ferdig. Lykke til!";
  }
  //else if(document.getElementById('page-mqtt-t2').style.display !== 'none'){
  //  text = "Dette er en True/False oppgave. Velg riktig svar og lever når du føler deg ferdig. Lykke til!";
  //}
  //else if(document.getElementById('task5Page') && document.getElementById('task5Page').style.display !== 'none'){
  //  text = "Her skal du finne relevante begreper ved å klikke på kortene.";
  //}

  // setter teksten i popup
  document.getElementById('popupText').innerText = text;

  // viser popup
  document.getElementById('infoPopup').style.display='flex';
}


/* MC oppgave */
function mqttT1Start(){
//skjuler infoside, og viser mc oppgave. nullstiller valgte svar
  document.getElementById('mqttT1-infobox').style.display='none';
  document.getElementById('mqttT1-taskbox').style.display='block';

  selectedAnswersMC = [];
  taskFinishedMC = false;
}

/* popup lukk */
function closeInfo(){
  document.getElementById('infoPopup').style.display='none';
}
