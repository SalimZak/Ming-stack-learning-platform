// ── GRAFANA OPPGAVE 3 — Catch the Object ─────────────────────
(()=>{

// variabler
let tid=60;
let score=0;
let spillerX=100; // start posisjon
let spillStarter=false; 
let chart; // lagrer verdier for graf
let validCaptured = 0; //korrekte
let invalidCaptured = 0; //feil

let timeNow = new Date(2026, 0, 1, 13, 0) // oppdatere tiden for hvert objekt (år,mnd,time,min)
let timeValues = [] //lagrer verdien til klokkeslettene
let objectValues = [] //lagrer verdien til fuktighet
let objects = [] //lagrer verdien til gyldig og ugyldig


// skjul start siden og start spill og topbar etter 2 sek
function startSpill(){
  document.getElementById("start").style.display="none";
  setTimeout(()=>{
    spillStarter=true; 
    document.getElementById("spill").style.display="block"; 
    document.getElementById("topbar").style.display="block"; 
  },1000);
}

// bevegelse av baren
let keys={}; // holder taster
document.addEventListener("keydown",e=>keys[e.key]=true); // trykker tast
document.addEventListener("keyup",e=>keys[e.key]=false); // slipper tast

setInterval(()=>{
  if(keys["ArrowLeft"]&&spillerX>0)spillerX-=6; // venstre piltast med fast
  if(keys["ArrowRight"]&&spillerX<320)spillerX+=6; // høyre piltast med fart
  document.getElementById("bruker").style.left=spillerX+"px"; // oppdater posisjon til bar
},10);

// tid
setInterval(()=>{
  if(!spillStarter)return; // kjører ikke før spillet starter
  if(tid<=0)return; // teller ned med 1 sekund
  tid--;                               
  document.getElementById("tid").textContent=tid; // oppdater tiden og stopp når den ender
  if(tid===0)stoppSpill(); 
},1000);

// Lager sensorverdiene som faller
setInterval(()=>{
  if(!spillStarter)return;
  lagObjekt();
},1200);


// lager sensorverdiene
function lagObjekt(){
  const el = document.createElement("div"); // lag nytt div-element og legg til CSS-klasse
  el.classList.add("objekt");

  let gyldig = Math.random() < 0.6; // 60% gyldige verdier
  let verdi; 

  if(gyldig){
    verdi = Math.floor(Math.random() * (60 - 40 + 1)) + 40; // 40–60, (maks - min + 1) + min
  } else {
    verdi = Math.floor(Math.random()*101); // alle tall mellom 0-100

    //ugyldige verdier mellom 40 til 60 ikke blir markert som feil
    while(verdi >= 40 && verdi <= 60){
      verdi = Math.floor(Math.random()*101);
    }
  }
  let timeString = timeNow.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true});  // lag tiden US time
  timeNow.setMinutes(timeNow.getMinutes()+1); // objektene sin tid øker med 1 minutt



  el.textContent= timeString + " : " + verdi + "%RH";// det som står i sensorverdiene
  el.dataset.gyldig=gyldig; // lagrer verdier som er gyldig og ugyldig
  el.style.left=Math.random()*330+"px"; // objektene fellaer på tilfeldige plasser

  el.dataset.verdi = verdi; // sensor verdiene
  el.dataset.time = timeString; // tidene på objektene
  document.getElementById("spill").appendChild(el); // legg til objektene

  let y=0; // objektet starter øverst, faller nedover piksler og oppdaterer posisjon
  let fall=setInterval(()=>{
    y+=3;
    el.style.top=y+"px";


    // Treffe bar
    let ob=el.getBoundingClientRect(); // objekt
    let bar=document.getElementById("bruker").getBoundingClientRect(); //baren

    if(ob.bottom>=bar.top && ob.left<bar.right && ob.right>bar.left){ //bunnen av objekte lander rett på toppen av bar
      let verdi = parseInt(el.dataset.verdi); //konverterert string til heltall
      let time = el.dataset.time; // tiden på objektet

      if(gyldig){
        //riktig er 2 poeng 
        score += 2;
        validCaptured++;
      } else {
        score = Math.max(0, score - 1);; //feil, ikke negativ tall, tar minste poeng emmlom 0 og feil.
        invalidCaptured++;
      }
      //blir sendt til fellesscoren
      //pointSystem("grafana-t3", score);
      //document.getElementById("score").textContent = score;


      // lagre tid verdi på graf
      timeValues.push(time); //tiden på grafen (x-aksen)
      objectValues.push(verdi); // objekt verdiene på grafene (y-aksene)
      objects.push(el.dataset.gyldig === "true"); // lagrer om punktene er gyldige eller ugyldige (for å gjøre de grønn/rød punkter)

      document.getElementById("score").textContent=score;
      el.remove(); // fjern objekt og beveglese hvis den faller ut
      clearInterval(fall);
      
    }

    //objektet faller ut av display skjermen
    if(y>480){
      el.remove();
      clearInterval(fall);
    }
  },40); //farten de faller
}

//stopp spillet og tid og display resultatet
function stoppSpill(){
  spillStarter=false;
  document.getElementById("spill").style.display="none";
  document.getElementById("tid").textContent="-";
  document.getElementById("resultat").style.display="block";
  grafDiagram(); //start direkte med graf
}

// kake
function kakeDiagram(){
  if(chart)chart.destroy();

  chart=new Chart(document.getElementById("chart"),{
    type:"pie",
    data:{
      labels:[t('gt3_correct'), t('gt3_incorrect')],
      datasets:[{
        data:[validCaptured,invalidCaptured],
        backgroundColor:["green","red"]
      }]
    }
  });
}

// stople
function stolpeDiagram(){
  if(chart)chart.destroy(); //når nye diagrammer bli brukt i samme dashboard så kan det bli liggende. så kaster diagrammet og lager nytt

  chart=new Chart(document.getElementById("chart"),{
    type:"bar",
    data:{
      labels:[t('gt3_correct'), t('gt3_incorrect')],
      datasets:[{
        //label:"Poeng",
        data:[validCaptured,invalidCaptured],
        backgroundColor:["green","red"]
      }]
    },
    options:{
      plugins:{
    legend:{ display:false }
  },
      scales:{
        x:{ticks:{color:"white"}}, // x tekst
        y:{
          ticks:{color:"white"}, // y tekst og tittel
          title:{display:true,text:t('gt3_points'),color:"white"},
          grid:{color:"white"} // rutenett
        }
      }
    }
  });
}

// graf
function grafDiagram(){
  if(chart)chart.destroy();//når nye diagrammer bli brukt i samme dashboard så kan det bli liggende. så kaster diagrammet og lager nytt

  // lister for punkter i grafen
  let validPoints = [];
  let invalidPoints = [];
  // går gjennom alle objektene 
  for(let i=0;i<objectValues.length;i++){ 
    let point = {x: i, y: objectValues[i]}; //setter inn punkt i grafen, x = tid og y = sensordata

    //går gjennnom alle objektene og setter inn for valid og invalid listen
    if(objects[i]){
      validPoints.push(point);
    } else {
      invalidPoints.push(point);
    }
  }

  chart=new Chart(document.getElementById("chart"),{
    type:"scatter",
    data:{
      labels: timeValues,
      datasets:[
        {label:t('gt3_valid'), data: validPoints, borderColor:"green", backgroundColor:"green", showLine:true, tension:0.3, pointRadius: 5},
        {label:t('gt3_invalid'), data: invalidPoints, backgroundColor:"red",showLine:false, pointRadius: 5}
      ]
    },
    // utenfor grafen, x-aksen og y aksen
    options:{
      scales:{
        x:{ticks:{color:"white", callback: function(verdi){return timeValues[verdi];}}, title:{display:true,text:t('gt3_timeAxis'),color:"white"}},
        y:{min:0,max:100, ticks:{color:"white",stepSize:5}, title:{display:true,text:"%RH",color:"white"}}
      }
    }
  });
}

// Eksponerer funksjonene som HTML onclick-attributter trenger
window.startSpill    = startSpill;
window.kakeDiagram   = kakeDiagram;
window.stolpeDiagram = stolpeDiagram;
window.grafDiagram   = grafDiagram;

})();
