// Puheen toteutus perustuu seuraavaan dokumentaatioon:
// https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisVoice

window.onload = function() {
    let message = "";
    let listeningUser = false;  // true tai false sen mukaan, kuunnellaanko käyttäjää mikrofonin kautta

    // jos haluat koodin, joka vain puhuu, kommentoi aluksi alla olevat 2 riviä pois
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    //... jatkossa kommentoi halutessasi puheen toteutuksen kaikki recognition'iin liittyvät pois, jotta koodin suoritus ei pysähdy

    const synth = window.speechSynthesis;
    
    const rateValue = document.querySelector(".rate-value");
    const pitchValue = document.querySelector(".pitch-value");
    const pitch = document.querySelector("#pitch");
    const rate = document.querySelector("#rate");

    let voices = [];

    var xhr = null;

    // tunnistetaan suomenkielistä puhetta
    recognition.lang = "fi-FI";  // englannin kielelle esim. "en-US" (HUOM! Kommentoi tämä pois, jos käytät Firefoxia!)

    getXmlHttpRequestObject = function () {
        if (!xhr) {
            // Luodaan uusi XMLHttpRequest olio 
            xhr = new XMLHttpRequest();
        }
        return xhr;
    };

    const user_input = document.getElementById("user_input");
    user_input.addEventListener("keyup", send_userinput, true);

    function send_callback() {

        // jokin virhetilanne..
        if (xhr.readyState == 4 && xhr.status == 500) {
            const chatbotMessage = JSON.parse(xhr.responseText).message;
            
            let el = document.getElementById("conversation");
            let newEl = document.createElement("div");
            newEl.style.borderRadius = "1rem";
            newEl.style.backgroundColor = "#ffddaa";
            newEl.style.padding = "0.7em";
            newEl.style.marginBottom = "1rem";
            
            let txt = document.createElement("textnode");
            txt.textContent = "Botti: " + chatbotMessage;
            newEl.appendChild(txt);
            el.appendChild(newEl);

            document.getElementById("user_input").value = "";

            message = chatbotMessage;
            puhu(chatbotMessage);
        }
        

        
        // saatiin OK-viesti serveriltä chatbotin viestin osalta
        if (xhr.readyState == 4 && xhr.status == 200) {
            const chatbotMessage = JSON.parse(xhr.responseText).message;
            const msgArr = chatbotMessage.split("\n");

            let el = document.getElementById("conversation");
            let newEl = document.createElement("div");
            newEl.style.borderRadius = "1rem";
            newEl.style.backgroundColor = "#ffddaa";
            newEl.style.padding = "0.7em";
            newEl.style.marginBottom = "1rem";

            if (msgArr.length < 2) {
                let txt = document.createElement("textnode");
                txt.textContent = "Botti: " + chatbotMessage;
                newEl.appendChild(txt);
                el.appendChild(newEl);
            } else {
                console.log("msgArr");
                let div = document.createElement("div");

                for (let i = 0; i < msgArr.length; i++) {
                    let txt = document.createElement("textnode");
                    if (i == 0) { txt.textContent = "Botti: " + msgArr[i] }
                    else if (msgArr[i].trim().length > 0 && msgArr.length > 0) { txt.textContent = "- " + msgArr[i]; }
                    else txt.textContent = msgArr[i];
    
                    div.appendChild(txt);
                    let br = document.createElement("br");
                    div.appendChild(br);
                }
                newEl.appendChild(div);
                el.appendChild(newEl);
            }

            document.getElementById("user_input").value = "";

            message = chatbotMessage;
            puhu(chatbotMessage);
        }

        let el = document.getElementById('conversation');
        el.scrollTop = el.scrollHeight;

    }

    /*
        Lähetetään käyttäjän syöte palvelimelle
    */
    function send_userinput(e) {

        // tutkitaan return/enter-näppäimen painaminen
        if (e && e.keyCode == 13) {

            xhr = getXmlHttpRequestObject();
            xhr.onreadystatechange = send_callback;
            
            xhr.open("POST", "http://localhost:3000/user_input", true);
            
            xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
            xhr.send(JSON.stringify({"data": e.target.value}));
            
            // käyttäjän syöte käyttöliittymään
            let conv = document.getElementById("conversation");
            let newEl = document.createElement("div")
            newEl.style.backgroundColor = "#ffccff";
            newEl.style.borderRadius = "1rem";
            newEl.style.padding = "0.7em";
            newEl.style.marginBottom = "1rem";

            let txt = document.createElement("textnode")
            txt.textContent = "Sinä: " + e.target.value;
            newEl.appendChild(txt);
            conv.appendChild(newEl);
            
            let el = document.getElementById('conversation');
            el.scrollTop = el.scrollHeight;

        }
    }

    function puhu(message) {
        const utterThis = new SpeechSynthesisUtterance(message.trim());
            const selectedOption =
            voiceSelect.selectedOptions[0].getAttribute("data-name");
          
            for (let i = 0; i < voices.length; i++) {
                if (voices[i].name === selectedOption) {
                    utterThis.voice = voices[i];
                }
            }
            utterThis.pitch = pitch.value;
            utterThis.rate = rate.value;
            synth.speak(utterThis);
        
    }
    // haetaan valinta-div'in kaikki elementit
    const els = document.querySelectorAll('.valinta');

    // funktio triggeroituneen radionappitapahtuman tilalle
    const getSelectedValue = (e) => {
        const selection = e.target.value;
        
        xhr = getXmlHttpRequestObject();
        xhr.onreadystatechange = send_callback;

        // lähetettävän pyynnön lopussa oleva true tarkoittaa, että lähetäme
        // tietoa asynkronisesti
        switch (selection) {

            case "yhteenveto":
                xhr.open("POST", `http://localhost:3000/domain/${0}`, true);
                xhr.send(null);
                break;

            case "kokoSivu":
                xhr.open("POST", `http://localhost:3000/domain/${1}`, true);
                xhr.send(null);
                break;
        }
        
    }

    // asetetaan change-tapahtuma radio-napeille
    els.forEach(el => {
        el.addEventListener('change', getSelectedValue);
    });

    let voiceSelect = document.getElementById("voice-select");

    function populateVoiceList() {
    voices = synth.getVoices();

    
    for (let i = 0; i < voices.length; i++) {
        const option = document.createElement("option");
        option.textContent = `${voices[i].name} (${voices[i].lang})`;

        if (voices[i].default) {
            option.textContent += " — DEFAULT";
        }

        option.setAttribute("data-lang", voices[i].lang);
        option.setAttribute("data-name", voices[i].name);
        voiceSelect.appendChild(option);
    }
  }


    populateVoiceList();
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = populateVoiceList;
    }


    function speak() {
    if (synth.speaking) {
      console.error("speechSynthesis.speaking");
      return;
    }
  
    if (message !== "") {
      const utterThis = new SpeechSynthesisUtterance(message);
  
      utterThis.onend = function (event) {
        console.log("SpeechSynthesisUtterance.onend");
      };
  
      utterThis.onerror = function (event) {
        console.error("SpeechSynthesisUtterance.onerror");
      };
  
      const selectedOption =
        voiceSelect.selectedOptions[0].getAttribute("data-name");
  
      for (let i = 0; i < voices.length; i++) {
        if (voices[i].name === selectedOption) {
          utterThis.voice = voices[i];
          break;
        }
      }
      utterThis.pitch = pitch.value;
      utterThis.rate = rate.value;
      synth.speak(utterThis);
    }
  }

  pitch.onchange = function () {
    pitchValue.textContent = pitch.value;
  };
  
  rate.onchange = function () {
    rateValue.textContent = rate.value;
  };
  
  voiceSelect.onchange = function () {
    speak();
  };
  
  // Puheentunnistuksen koodia

  // kommentoi kaikki alla oleva pois, jos haluat vain puhuvan botin ilman puheentunnistusta
  recognition.onresult = (event) => {
    listeningUser = false;
    document.getElementById("user_input").style.backgroundColor = "#FFFFFF";
    const resultIndex = event.resultIndex;
    const transcript = event.results[resultIndex][0].transcript;
    let spokenText = transcript;
    
    // Puheentunnistus laittaa viimeiseksi merkiksi pisteen, mikä ei sovi
    // Wikipedia-sivun hakemiseen, siksi se poistetaan
    if (transcript[spokenText.length - 1] === ".") spokenText;

    document.getElementById("user_input").value = spokenText.substring(0, spokenText.length - 1);
  };
  
  recognition.onstart = () => {
    listeningUser = true;
    document.getElementById("user_input").style.backgroundColor = "#88FF88";   
  };
  
  document.getElementById("user_input").addEventListener('click', () => {

    // jos syötelaatikon väri on vihreä, pysäytetään vain puheentunnistus
    if (listeningUser) {
      
      try {
        recognition.stop();
        document.getElementById("user_input").style.backgroundColor = "#FFFFFF";
        listeningUser = false;
        console.log("Speech stopped");
      } catch {
      
      }
    } else {
        recognition.start();
    }

  });

  recognition.onspeechend = () => {
    recognition.stop();
    listeningUser = false; 
    document.getElementById("user_input").style.backgroundColor = "#FFFFFF";
    console.log("Speech end");
  };
}
