window.onload = function() {

    var xhr = null;

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

}