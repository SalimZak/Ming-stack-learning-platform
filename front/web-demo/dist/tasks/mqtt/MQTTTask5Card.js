// MQTT card game, task 2

/* kortene */

const cardsData = [
  {Begrep:"Broker", Forklaring:"Den sentrale serveren som tar imot meldinger fra publishere og videresender dem til riktige subscriber. Mosquitto er et vanlig eksempel", correct:true},
  {Begrep:"Tidsserie database", Forklaring:"En database optimalisert for å lagre og spørre etter data som er ordnet etter tidspunkt", correct:false},
  {Begrep:"Timestamp", Forklaring:"Tidsstempel som hver datapunkt får, og som er nøkkelen for tidsserielagring.", correct:false},
  {Begrep:"Measurment", Forklaring:"En navngitt beholder for relaterte tidsseriedata, sammenlignbart med en tabell i SQL(database programmeringspråk)", correct:false},
  {Begrep:"Topic", Forklaring:"En hierarkisk adresse meldinger sendes til, skrevet med skråstrek som skille(f.eks sensor/temprature/room1)", correct:true},
  {Begrep:"Tag", Forklaring:"Indeksert metadata som beskriver et datapunkt (f.eks location=room1 ), brukt for raskt å filtrere i spørringer.", correct:false},
  {Begrep:"Publish", Forklaring:"Handlingen der en klient(f.eks en sensor) sender melding til en bestemt topic på brokeren", correct:true},
  {Begrep:"Retention policy", Forklaring:"Regel som bestemmer hvor lenge data lagres før det automatisk slettes.", correct:false},
  {Begrep:"Subscribe", Forklaring:"Handlingen der en klient registerer interesse for en topic og mottar alle meldinger som publiserer til den", correct:true},
  {Begrep:"Dashboard", Forklaring:"En samling av paneler som tilsammen gir et helhetlig bilde av et system eller en prosess.", correct:false},
  {Begrep:"Query", Forklaring:"Spørring som hentes fra data source for å fylle et panel med data.", correct:false},
  {Begrep:"QoS (Quality of Service)", Forklaring:"Nivå som bestemmer leveringsgaranti for meldinger. 0: (maks en gang), 1(minst en gang), 2(nøyaktig en gang).", correct:true},
  {Begrep:"Panel", Forklaring:"Et enkelt visualisering i et dashboard, for eksempel en graf, måler eller en tabell.", correct:false},
  {Begrep:"Datasource", Forklaring:"En konfigurert tilkobling til der dataen kommer fra (InfluxDB, eller andre databaser)", correct:false},
  {Begrep:"Lettvekt(light weight)", Forklaring:"MQTT er designet med lite overhead, noe som gjør protokollen egnet for enheter med begrenset prosessorkraft, batteri og nettverksbåndbredde", correct:true},
  {Begrep:"Pub/Sub modell", Forklaring:"Arkitekturmønsteret der publishere og subscribere er frakoblet hverandre og kommuniserer gjennom brokere, ikke direkte.", correct:true}
];


let cardScore = 0;
let cardFunnet = 0; 

function startGame(){
  cardScore = 0; //nullsitller
  cardFunnet = 0;// nullstiller
  infoBoxText("Her skal du klikke på relevante begreper for MQTT. Du skal finne 7 relevante begreper for å fullføre oppgaven");
  document.getElementById("grid").innerHTML = "";
  document.getElementById("score").innerText = "0 - Found: 0/7";
  document.getElementById("completeBanner").style.display = "none";
  document.getElementById("startScreen").style.display = "none";
  document.getElementById("task5Page").style.display = "block";
  randomPlaced(cardsData); //random plassert
  createCards();
}

// blander array ved å ta det siste plasseringen og bytte med et random plassering. og fortsette slikt
function randomPlaced(array){
  for(let i = array.length - 1; i > 0; i--){
    let j = Math.floor(Math.random() * (i + 1));
    let temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
}

// lager kort
function createCards(){
  const grid = document.getElementById("grid");
  for(let i = 0; i < cardsData.length; i++){
    let data = cardsData[i]; // for hvert element/kort
    // lager en kort boks, det som skal stå inni containeren, fremre del og bakre del
    let kort = document.createElement("div");
    kort.className = "kort";

    let inner = document.createElement("div");
    inner.className = "inner";

    let front = document.createElement("div");
    front.className = "front";
    front.innerText = data.Begrep;

    let back = document.createElement("div");
    back.className = "back";
    back.innerText = data.Forklaring;

    // setter sammen kortet
    inner.appendChild(front);
    inner.appendChild(back);
    kort.appendChild(inner);

    // roterer ved klikk
    kort.onclick = function(){
      handleClick(kort, data);
    };
//lager kortene i griden
    let gridElement = document.getElementById("grid");
    gridElement.appendChild(kort);
  }
}

//klikker på kortet
function handleClick(kort, data){
  //de som er blitt flippet er statisk
  if(kort.classList.contains("flipped")) return;
  //lagrer de som har blitt flippet
  kort.classList.add("flipped");

  //blir enten rød eller grønn basert på svaret etter flip, 0,4 sek
  setTimeout(function(){
    if(data.correct){
      kort.querySelector(".back").classList.add("correct");
      cardScore++;
      cardFunnet++;
    } else {
      kort.querySelector(".back").classList.add("wrong");
      cardScore = Math.max(0, cardScore - 1);
    }

    //både score og antall funnet
    document.getElementById("score").innerText = cardScore + " - Found: " + cardFunnet + "/7";

    // fullført oppgave etter 7
    if(cardFunnet === 7){
      document.getElementById("completeBanner").style.display = "block";
      pointSystem("mqtt-t2", cardScore);
    }
  }, 400);
}

//popup lukk
function closeInfo(){
  document.getElementById('infoPopup').style.display='none';
}

