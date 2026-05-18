// mqtt task 3

let chosenArrow = null; //lagrer pilen brueren velger
let totalCorrect = 0; //antall rigktige piler plasser
let TOTALT_KREVES = 8; //8 zoner er plassert riktig for oppgaven til å være ferdig
let point = 0; //score for oppgaven
 
 
// option piler
const arrows = [
  { type: "TempPublish", tekst: "Publish: 50°C\nTopic: Temp", retning: "right" },
  { type: "HumPublish", tekst: "Publish: 45% RH\nTopic: Hum", retning: "right" },
  { type: "SubTemp", tekst: "Subscribe\nTopic: Temp", retning: "both"  },
  { type: "SubHum", tekst: "Subscribe\nTopic: Hum", retning: "both"  },
  { type: "TempPublish", tekst: "Publish: 50°C", retning: "right" },
  { type: "HumPublish", tekst: "Publish: 45% RH", retning: "right" },
];
 
// når oppgaven starter
function t3Start() {
 
  // Skjuler startpage, starter oppgave og oppdaterer infoboks
  infoBoxText("Klikk og plasser pilene i de dropsonene du mener passer riktig for MQTT-flyten. \nI dette eksemplet er sensorene publishere. Det betyr at de sender data til Brokeren.\nBrokeren er et mellomledd mellom enhetene. den mottar meldinger fra publisherne og sender dem videre til de riktige topicene og enhetene som har abonnert(subscribed) på disse topicene. \nI dette eksemplet er subscriberne klient 1-3. de ønsker å motta data. Klientene abonnerer(subscriber) på et topic hos brokeren. Når nye meldinger blir publisert på topicet, sender brokeren meldingen videre til subscriberne.");
  document.getElementById("t3-infobox").style.display = "none";
  document.getElementById("t3-taskbox").style.display = "block";
  document.getElementById("t3-layout").style.display  = "flex";

  t3RefreshLabels(); //oppdatering for oversetting av sirklene sine tekst
 
  // reseter
  totalCorrect = 0;
  chosenArrow = null;
 
  // Skjuler complete-banner
  document.getElementById("t3-complete-banner").style.display = "none";
 
  // reseter alle dropzones
  document.querySelectorAll(".dropzone").forEach(function(zone) { //for hver element som bruker dropzone klassen
    zone.dataset.tried = ""; // rester sjekken for prøvd forsøk
    zone.classList.remove("zone-correct", "zone-wrong"); // fjerner farge
    zone.innerHTML = t("t3_clickPlace"); // setter tilbake teksten som er i dropzones
  });
 
  makeArrowButton(); //pilliste med knapper
}
 
// Lager pilene under broker
function makeArrowButton() {
  let brokerList = document.getElementById("t3-arrows"); //finner html boksen som er under broker

  brokerList.innerHTML = ""; //rester pilene under broker, ved å tømme
 
  // Lager knapp til pil
  for (let i = 0; i < arrows.length; i++) { //går gjennom alle pilene
    let arrow = arrows[i]; 
 
    let btn = document.createElement("button"); //lager en knapp
    btn.className = "arrow-btn " + arrow.retning; // styling og retning til knapp
    btn.textContent = arrow.tekst; //tekst på pil
    //btn.dataset.index = i;
 
    // Når knappen klikkes, velges denne pilen
    btn.onclick = function() { //knapp klikkes
      choseArrow(btn, arrow); //vleger knappen og pilen
    };
 
    brokerList.appendChild(btn); //legg knapppen i listen
  }
}
 
// Markerer en pil som valgt og lagrer den
function choseArrow(btn, arrow) {

  document.querySelectorAll(".arrow-btn").forEach(function(k) { //går gjennom alle pilknappene
    k.classList.remove("selected"); //fjerner alle markering etter at pil har blitt plassert
  });
 
  btn.classList.add("selected");//markerer vlagt knapp
  chosenArrow = arrow; //lagrer valgt pil, mellom presset og plassert
}
 

function t3Place(zone) { // når brukeren plasser i dropzone
 
  if (zone.classList.contains("zone-correct")) return; //dersom zone er riktig fylt, skal ingenting skje
  if (!chosenArrow) return; // dersom ingen pil er valgt skal ingenting skje
 
  let firstTry = !zone.dataset.tried; //sjekk om det er første forsøk
  zone.dataset.tried = "tried"; // markerer dropzone som den er blitt forsøkt
 
  // Sjekker om riktig pil er plassert
  let arrowType = chosenArrow.type; // hvilken type pil det er
  let forventet = zone.dataset.expected; // hva dropzonen vil ha
  let isCorrect = (arrowType === forventet); // sjekk om de er like
 
  // Viser pilen inne i sonen, erstatter klikk for plasser med pilen, med riktig retning og tekst fra arrows listen
  zone.innerHTML = `<div class="arrow-btn ${chosenArrow.retning}" style="pointer-events:none;margin:0;width:auto">${chosenArrow.tekst}</div>`;
 
  if (isCorrect) {
    // Riktig svar
    zone.classList.add("zone-correct");
    totalCorrect++;
 
    // Gir poeng kun hvis det var første forsøk
    if (firstTry) {
      point++;
      pointSystem("task3", point); // lagrer poeng
      visPoeng();
    }
 
    // Viser grønn melding, dersom det er riktig
    viseMelding(t("t3_valid"), true);
 
    // Sjekker om alle 8 soner er fylt, da er oppgaven ferdig. Og complete banner blir vist
    if (totalCorrect >= TOTALT_KREVES) {
      document.getElementById("t3-complete-banner").style.display = "block";
    }
 
  } else {
    // Feil svar, rød melding dukker opp
    zone.classList.add("zone-wrong");
    viseMelding(t("t3_invalid"), false);
 
    // Nullstiller sonen dersom det er feil
    setTimeout(function() {
    zone.classList.remove("zone-wrong"); // fjerner rød farge
    zone.innerHTML = t("t3_clickPlace"); // setter tilbake klikk for plassere teksten
  }, 700); // Nullstiller sonen etter 0,7 sek så brukeren kan prøve igjen
}
 
  // Fjerner valgt pil, selv om det er korrekt eller feil
  chosenArrow = null;
  document.querySelectorAll(".arrow-btn").forEach(function(k) {
    k.classList.remove("selected");
  });
}
 
// Viser en kort respons med farge dersom det er riktig eller feil
function viseMelding(tekst, isCorrect) {
let box = document.getElementById("t3-message"); // bruker respons fra css
box.textContent = tekst; // det blir riktig eller feil i boksen
box.style.display = "block"; // viser fargen

if (isCorrect) {
  box.className = "messagebox message-correct"; // grønn
} 
else {
  box.className = "messagebox message-wrong";   // rød
}
 
  // skjuler respons etter 1 sek
  setTimeout(function() {
    box.style.display = "none";
  }, 1000);
}
 
 
// Oppdaterer poeng
function visPoeng() {
  document.getElementById("t3-score").textContent = "Poeng: " + point;
}
 
// Oppdaterer tekstene, ved språkbytte)
function t3RefreshLabels() {
  let koblinger = {
    "t3-lbl-temp":   "t3_tempSensor",
    "t3-lbl-hum":    "t3_humSensor",
    "t3-lbl-c1":     "t3_client1",
    "t3-lbl-c2":     "t3_client2",
    "t3-lbl-c3":     "t3_client3",
    "t3-broker-lbl": "t3_broker",
  };
 
  // Går gjennom hvert par og setter teksten
  for (let id in koblinger) {
    let element = document.getElementById(id);
    if (element) {
      element.textContent = t(koblinger[id]); // henter oversatt tekst
    }
  }
}

