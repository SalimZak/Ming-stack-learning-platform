// influxDB timestamp database task 4

let chosenBox = null; // boksene brukeren har valgt
let influxT4Point = 0; // score
let correctPlaced = 0; // bokser som er riktig plassert
let sensorData = []; // array av de 6 boksene, for å stokke dem senere
let fasit = []; // array av de 6 boksene som er i riktig rekkefølge, med nyeste først
let valgtSensorBox = null; // valgt sensor boks
const totalBoxes = 6; // antall bokser
const timestamp_sek = 5; // antall sekunder før hvert tidstempel


// starte oppgaven
function influxT4Start() {
    chosenBox = null; //reset
    influxT4Point = 0;//reset
    correctPlaced = 0;//reset
    infoBoxText("Klikk og plasser sensorboksene i riktig rekkefølge, med nyeste tidsstempel øverst.\nHver sensorboks dukker opp etter 5 sekunder.\n Juster tempraturen verdien i mellomtiden.");
    document.getElementById("influxT4-startPage").style.display = "none"; //skjuler startpage
    document.getElementById("influxT4Page").style.display   = "block"; // starter oppgaven
    points(); // vis "Poeng: 0" med en gang
    hentSensorData(); // simulert tempratur eller ekte
}

// Henter temperatur fra /sensor eller simulert
function hentSensorData() {
    fetch("/influx") // send GET forespørsel til mikrokontroll
        .then(function(svar) 
        { 
            return svar.json(); // leser innholdet til HTTP svaret og endrer tekst til JSON-objekt
        }) 
        .then(function(json) {
            // ESP32 returnerer med data
            let ekteTemp = parseFloat(json.temp) || 12.0; // ekte temperatur
            let sensorNavn = json.sensorName || "DS18B20"; // sensortype
            boxContent(sensorNavn, ekteTemp); // boksene inneholder ekte data
        })
        .catch(function() {
            // Om ESP32 ikke er tilkoblet simulerer tempratur
            console.warn("Simulerte verdier i bruk"); //varsel om at simulerte verdier blir brukt
            boxContent("DS18B20", null); // type og tempratur dersom esp ikke er koblet
        });
}


// Lager de 6 boksene sitt innhold med klokke og temp
function boxContent(sensorNavn, ekteTemp) {
    sensorData = []; // reset array
    let startTime = new Date(); // ekte klokke

    for (let i = 0; i < totalBoxes; i++) {
        // Timestamp = index til boksen med tiden + 5 sek for hver boks
        let tid = new Date(startTime.getTime() + i * 5000);

        let temp; // tempratur
        if (ekteTemp !== null) {
            temp = ekteTemp; // ekte tempratur verdi
        } 
        else 
        {
            temp = Math.floor(Math.random() * 21); // random simulert verdi mellom 0-20
        }

        sensorData.push({ //lager et objekt i array med id,snsor,temp,timestamp og skjult innhold
            id: i, // index til boksen
            sensorNavn: sensorNavn,// navn på sensor
            temp: temp, //tempratur
            timestamp: timeDate(tid), // timestamp 
            visableContent: false // skjult innhold
        });
    }

    // fasit for hvilken boks som skal stå på hvilken rad
    fasit = sensorData.slice(); // lag en kopi av index som er timestamp, med id 0 først med 0 sek og id 5 sist
    fasit.sort(function(a, b) { return b.id - a.id; }); // sorter id med id 5 øverst

    randomPlaced(sensorData); // stokk boksene tilfeldig på venstre side
    sensorBox(); // lager de 6 sensor boksene med innhold
    database(); // lager de 6 dropzone i databasen

    // viser boks med innhold fra id 0 til id 5, innholdet kommer hvert 5 sek
    for (let i = 0; i < totalBoxes; i++) {
        nedtelling(i);
    }
}


// lager timestamp ved å returnere dato og tid
function timeDate(dato) {
    let år  = dato.getFullYear(); // henter året
    // januar=0, så for å få mai til 05 istedet for 04, så må man legge til + 1 i måned
    // det skal være 2 tegn, og fyller med 0 vis ikke
    let mnd = String(dato.getMonth() + 1).padStart(2, "0"); // henter måned
    let dag = String(dato.getDate()).padStart(2, "0"); // henter dag
    let hrs = String(dato.getHours()).padStart(2, "0"); // henter time
    let min = String(dato.getMinutes()).padStart(2, "0"); // henter minutt
    let sek = String(dato.getSeconds()).padStart(2, "0"); // henter sekund
    // dato med bindestrek(-), tid med semikolon(:)
    return år + "-" + mnd + "-" + dag + " " + hrs + ":" + min + ":" + sek; 
}

// Blander liste random, slik at sensor boksene kommer ut i tilfeldig rekkefølge
function randomPlaced(liste) {
    for (let i = 0; i < 6; i++) {
        let j = Math.floor(Math.random() * liste.length); // i er index og j er en tifeldig plass, der de bytter ut
        let temp = liste[i];
        liste[i] = liste[j]; 
        liste[j] = temp;
    }
}



// lag de 6 sensorboksene, fra skjult til vist
function sensorBox() {
    let leftContainer = document.getElementById("venstreSide"); // finner tomme html boksen på venstre side
    leftContainer.innerHTML = ""; // reseter gammelt innhold

    for (let i = 0; i < sensorData.length; i++) { // går gjennom hver av de 6 sensorboksene
        let dataInnholdet = sensorData[i]; // henter innholdet fra sensor data
        let box = document.createElement("div"); // lager en ny boks med html
        box.className = "sensorBox"; // gir css designet
        box.dataset.index = i; // lagre boks index for klikklogikk, sånn at man vet hvilken boks som er klikket

        // fyller Innhold inni boksen
        box.innerHTML =
            '<div class="sensorNavn">Tag: ' + dataInnholdet.sensorNavn +'</div>'+ // sensortype på topp
            '<div class="lable">Measurement: Temperature</div>'+ // sensor navn
            '<div class="temp" id="temp-' + i + '">Field: ?°C</div>'+ // skjult temperatur til nedtelling er ferdig
            '<div class="tid"  id="tid-'  + i + '">Timestamp: ?:?:?</div>'+ // skjult timestamp til nedtelling er ferdig
            '<div class="countDown" id="countDown-' + i + '"></div>'; // nedtelling

        // Vet hvilken boks og indeksen dens som er klikket
        box.addEventListener("click", function() {
            velgSensorBox(box, i);
        });

        leftContainer.appendChild(box); // legg boksen med innhold til i venstre side
    }
}

// lager 6 tomme radene i InfluxDB-bucketen (Databasen)
function database() {
    let rightContainer = document.getElementById("databaseRader");// finner tomme html boksen på høyre side
    rightContainer.innerHTML = "";// reseter gammelt innhold

    for (let r = 0; r < totalBoxes; r++) {
        let rad = document.createElement("div");// lager en tom rad i databsen
        rad.className = "rad"; // gir raden korrekt CSS
        rad.dataset.radNummer = r; // radnummer index med 0 øverste rad
        rad.dataset.filled = "false"; // raden er tom, sensorboks er ikke plassert enda

        rad.innerHTML = '<div> Klikk for å plassere </div>'; // innhold inni raden

        // Vet hvilken rad og indeksen til raden som er klikket
        rad.addEventListener("click", function() {
            sensorBoksIRad(rad, r);
        });

        rightContainer.appendChild(rad);// legg rader med innhold til i høyre side
    }
}

// nedtelling på for avsløring av innhold
function nedtelling(boxIndex) {
    let boxId = sensorData[boxIndex].id;// boksene sine originale index
    // boksene blir avslørt etter 5, 10, 15, 20, 25, 30, det er +1 siden første boks avsløres ettter 5 sek.
    let sekUntilReveal = (boxId + 1) * timestamp_sek;
    let remainingTime = sekUntilReveal; // starter nedtellingen til alle indeksene

    // skriv nedtelling inni den
    let countdown = document.getElementById("countDown-" + boxIndex); // finner hver boks sin nedttelling element
    if (countdown) countdown.textContent = remainingTime + "s"; //ser om boksen finnes, skriver tallet inni boksen

    // Teller ned hvert sekund
    let timer = setInterval(function() {
        remainingTime--;// reduserer tiden med 1 sek
        let countdown = document.getElementById("countDown-" + boxIndex); // finner hver boks sin nedtelling element
        if (countdown) countdown.textContent = remainingTime + "s"; // oppdater tiden i boksen

        if (remainingTime <= 0) { // teller ned til 0
            clearInterval(timer); // stopper tiden
            contentReveal(boxIndex); // vis timestamp med sensorverdi
        }
    }, 1000); // kjører per 1 sekund
}

// Avslører sensorboks innholdet når nedtellingen er ferdig
function contentReveal(boxIndex) {
    let dataContent = sensorData[boxIndex]; // henter sensor data innholdet til boksen
    dataContent.contentReveal = true; // her blir innholdet avslørt

    let tempReveal = document.getElementById("temp-" + boxIndex);
    if (tempReveal) tempReveal.textContent = dataContent.temp + "°C";//hvis temperatur finnes, så bytter ? med verdi

    let timeReveal = document.getElementById("tid-" + boxIndex);
    if (timeReveal) timeReveal.textContent = dataContent.timestamp;//hvis timestamp finnes, så bytter ? med verdi

    let countdownReveal = document.getElementById("countDown-" + boxIndex);
    if (countdownReveal) countdownReveal.textContent = ""; // fjern nedtellingsteksten når tiden er over
}

// Når brukeren klikker på en sensorboks
function velgSensorBox(klikketBox, boxIndex) {
    if (klikketBox.dataset.plassert === "true") return; // sjekk om sensorboksen er plassert i databasen

    //fjern markering fra alle sensobokser, kun en skal være markert som selected
    document.querySelectorAll(".sensorBox").forEach(function(k) {
        k.classList.remove("selected");
    });

    klikketBox.classList.add("selected"); // marker valt sensorbox
    valgtSensorBox = boxIndex; // lagre posisjonen til den valgte boksen etter stokking
}

// Plasserer sensorboks i database
function sensorBoksIRad(valgtRad, radNummer) {
    if (valgtSensorBox === null) return; //ingenting skjer dersom brukeren ikke har valgt noen sensor bokser
    if (valgtRad.dataset.filled === "true") return; // sjekker om raden er fylt

    let dataContent = sensorData[valgtSensorBox]; // henter innholdet til valgt sensorboks
    let fasitData = fasit[radNummer]; // henter hva fasiten sier skal stå i raden som radnummer 0 = index 5 fra fasit

    let boksId   = dataContent.id; // henter valgt boks sin id
    let fasitId  = fasitData.id; // henter id til database raden
    let isCorrect = (boksId === fasitId);// sjekk om de er like

    if (isCorrect) { // dersom brukeren har plassert riktig

    // Fyll inn database bucket med sensor,temp,verdi og tid
    valgtRad.innerHTML = 
        '<div>Measurement: Temperature</div>' +        // fast — alltid temperature
        '<div>Tag: '       + dataContent.sensorNavn + '</div>' +
        '<div>Field: '     + dataContent.temp       + '°C</div>' +
        '<div>Timestamp: ' + dataContent.timestamp  + '</div>';

        valgtRad.dataset.filled = "true"; // marker raden som fylt sånn at den ikke kan flyttes
        valgtRad.classList.add("correct"); // grønn på raden

        //finner sensorbox som er riktig plassert på venstre side og gjør den grå og ikke klikkbar lengere
        let klikketBox = document.querySelector(".sensorBox[data-index='" + valgtSensorBox + "']"); 
        if (klikketBox) {
            klikketBox.dataset.plassert = "true";
            klikketBox.classList.add("placed");
        }
        correctPlaced++;// teller opp antall riktige plassert
        influxT4Point++;// +1 poeng
        pointSystem("influx-t4", influxT4Point);
        points();// oppdater poengscoren

    } else { // dersom det er feilplassert
        influxT4Point = Math.max(0, influxT4Point - 1); // trekk 1 poeng, men ikke under 0
        pointSystem("influx-t4", influxT4Point); // lagre i felles poengsystem
        points(); // oppdater poengscoren

        valgtRad.classList.add("wrong"); // rød rad
        setTimeout(function() {
            valgtRad.classList.remove("wrong"); // fjern rød etter 0,7 sek
        }, 700);

        
    }

    // Fjern valgt box, enten om det er feil eller riktig
    valgtSensorBox = null;
    document.querySelectorAll(".sensorBox").forEach(function(k) {
        k.classList.remove("selected"); // fjerner markering på de valgte
    });
}

// Oppdaterer poengscoren
function points() {
    let p = document.getElementById("influxT4-poeng"); //finner poengvisningen
    if (p) p.textContent = "Poeng: " + influxT4Point + " — Found: " + correctPlaced + "/6"; //oppdaterer poeng og antall funnet
}

