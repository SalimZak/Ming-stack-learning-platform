// MQTT card game, task 2
/* kortene */
const cardsData = [
  {Begrep:"Begrep 1", Forklaring:"Kort forklaring av begrepet", correct:true},
  {Begrep:"Begrep 2", Forklaring:"Kort forklaring av begrepet", correct:false},
  {Begrep:"Begrep 3", Forklaring:"Kort forklaring av begrepet", correct:false},
  {Begrep:"Begrep 4", Forklaring:"Kort forklaring av begrepet", correct:false},
  {Begrep:"Begrep 5", Forklaring:"Kort forklaring av begrepet", correct:true},
  {Begrep:"Begrep 6", Forklaring:"Kort forklaring av begrepet", correct:false},
  {Begrep:"Begrep 7", Forklaring:"Kort forklaring av begrepet", correct:true},
  {Begrep:"Begrep 8", Forklaring:"Kort forklaring av begrepet", correct:false},
  {Begrep:"Begrep 9", Forklaring:"Kort forklaring av begrepet", correct:true},
  {Begrep:"Begrep 10", Forklaring:"Kort forklaring av begrepet", correct:false},
  {Begrep:"Begrep 11", Forklaring:"Kort forklaring av begrepet", correct:false},
  {Begrep:"Begrep 12", Forklaring:"Kort forklaring av begrepet", correct:true},
  {Begrep:"Begrep 13", Forklaring:"Kort forklaring av begrepet", correct:false},
  {Begrep:"Begrep 14", Forklaring:"Kort forklaring av begrepet", correct:false},
  {Begrep:"Begrep 15", Forklaring:"Kort forklaring av begrepet", correct:true},
  {Begrep:"Begrep 16", Forklaring:"Kort forklaring av begrepet", correct:true}
];
function openInfo(){
  let text = "";

  if(document.getElementById('task5Page') 
     && document.getElementById('task5Page').style.display !== 'none'){
    text = "Her skal du finne relevante begreper ved å klikke på kortene.";
  }
  // setter teksten i popup
  document.getElementById('popupText').innerText = text;

  // viser popup
  document.getElementById('infoPopup').style.display = 'flex';
}

let cardScore = 0;
function startGame(){
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
    } else {
      kort.querySelector(".back").classList.add("wrong");
    }

    //oppdaterer poenget
    document.getElementById("score").innerText = cardScore;
    // fullført oppgave etter 7
    if(cardScore === 7){
      document.getElementById("completeBanner").style.display = "block";
      pointSystem("cards", cardScore);
    }
  }, 400);
}

//popup lukk
function closeInfo(){
  document.getElementById('infoPopup').style.display='none';
}


