//infoboks system

let infoTekst = "";

function infoBoxText(text){
  infoTekst = text;
}
function openInfo(){
  document.getElementById('popupText').innerText = infoTekst;
  document.getElementById('infoPopup').style.display = 'flex';
}
function closeInfo(){
  document.getElementById('infoPopup').style.display = 'none';
}
