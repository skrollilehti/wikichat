# Pythonista pitäisi olla  versio 3.8 tai uudempi

from flask import Flask, request, jsonify
from flask_cors import CORS
import spacy
from transformers import pipeline
import wikipediaapi

# asenna vielä tämä: pip install beautifulsoup4
# tarvittaessa lisää informaatiota: https://beautiful-soup-4.readthedocs.io/en/latest/index.html?highlight=install#installing-beautiful-soup
from bs4 import BeautifulSoup

from libvoikko import Voikko

# kommentoi alla oleva rivi pois, jos olet Linux-käyttäjä
Voikko.setLibrarySearchPath("C:/Voikko")

# käytetty SpaCy:n NLP-malli osaa suomen kielen taivutusmuodot erisnimissä paremmin kuin
# malli fi_core_news_lg
nlp = spacy.load("spacy_fi_experimental_web_md")

# Jos et halua asentaa voikko-kirjastokokonaisuutta ja sinulle riittää WikiChatille
# pyynnöt muodossa "Hae [pyyntö]" ilman taivutusmuotoja, voit käyttää SpaCy:n mallia fi_core_news_lg,
# joka asennetaan seuraavasti:
#
# python -m spacy download fi_core_news_lg
#
# Kommentoi tässä tapauksessa pois voikko-kirjastoon liittyvät rivit ja poista alta kommentti,
# jossa otetaan SpaCy:n fi_core_news_lg-malli käyttöön

#nlp = spacy.load("fi_core_news_lg")

# Kaikkiaan transformer-malli vie noin 500 megatavua systeemilevyltä!
model_name = "TurkuNLP/bert-base-finnish-cased-squad2"

# Jos sinulla ei ole GPU:ta koneessa, voit jättää device-parametrin pois
qa = pipeline('question-answering', model=model_name, device=0)

app = Flask(__name__)
CORS(app)

SIMILARITY_THRESHOLD = 0.55

chatbot_mind = {
    "hei": "Terve!",
    "apua": "Ymmärrän seuraavat:\nHei\nmitä kuuluu\nHae [asia/henkilö]\nMuistisi\nApua\nLisäksi, jos minulla on yhteenveto muistissa, voit kysyä siitä vapaasti.",
    "mitä kuuluu": "Olen chatbot. Minulla ei ole kuulumisia eikä tunteita.",
    "hae": "Yritän noutaa tietoa seikasta tai henkilöstä ",
    "muistisi": ""
}

top_intents = {
    "hei": 0,
    "apua": 0,
    "mitä kuuluu": 0,
    "hae": 0,
    "muistisi": 0
}

global corpus, domain, thing
corpus = ""
domain = 0
thing = None

def extract_sections(page_text):
    global corpus

    soup = BeautifulSoup(page_text, 'html.parser')

    sections = soup.find_all('h2')
    for section in sections:
        title = section.text.strip()
        
        print(f"Sektion otsikko: {title}")
        
        # alla listaan voi sisällyttää lisää suodatettavia sektioita
        if title.lower().strip() not in ["viitteet", "katso myös", "aiheesta muualla", "lähteet", "kirjallisuutta"]:
            for sibling in section.find_next_siblings():

                # mukaan otetaan h2-tagien alaisuudesta vain kappaleet (ei esimerkiksi listoja)
                if sibling.name and sibling.name.startswith('p'):
                    # jos alla strip=True, tulevat jotkut sanat ilman välilyöntiä peräkkäin
                    corpus += " " + sibling.get_text(strip=False)

def get_thing(doc):

    thing = ""
    for i, word in enumerate(doc):

        # yksinkertaisuuden vuoksi viimeinen sana lemmataan oli se mikä hyvänsä tyypiltään
        if i == len(doc) - 1:

            #print(word.lemma_)
            
            # nämä sanan loppujen poistot voivat joissain tapauksissa
            # "tuhota" varsinaisen sanan
            #if "ista" in word.text:
            #    thing += word.text[:-4].capitalize()
            #elif "sta" in word.text:
            #    thing += word.text[:-3].capitalize()
            #elif "stä" in word.text:
            #    thing += word.text[:-3].capitalize()
            #else:
            #    thing += word.text.capitalize()
            thing += word.lemma_.capitalize()

        # jos sana ei ole viiminen, katsotaan edustaako se luokkia erisnimi, substantiivi tai
        # SpaCy:n NLP-mallin näkökulmasta tuntematonta
        else:
            if word.pos_ == "PROPN" or word.pos_ == "NOUN" or word.pos_ == "X":
                thing += word.text.capitalize() + " "

    if thing != "":
        return thing.strip()
    else:
        return None

@app.route("/domain/<selection>", methods=["POST"])
def get_domain(selection):
    global corpus, domain

    domain = int(selection)
    corpus = ""
    
    return jsonify({"message": "Olen nyt asettanut valintasi tietopankkityypikseni ja nollannut muistini."}), 200

@app.route("/user_input", methods=["POST"])
def get_message():
    global corpus, domain, thing

    if request.method == "POST":
        received_input = request.get_json()
        user_input = received_input['data']
    else:
        return jsonify({"message": "Palvelinvirhe"}), 500
    
    for keyphrase in chatbot_mind.keys():

        doc1 = nlp(keyphrase)
        doc2 = nlp(user_input.lower())

        similarity = doc1.similarity(doc2)
        top_intents[doc1.text] = similarity

    top_intent = max(top_intents, key=top_intents.get)
    
    # Varmistetaan "hae" pyynnön läpimeno
    if user_input.lower()[:4] == "hae ":
        top_intent = "hae"
        top_intents[top_intent] = 1.0

    print(top_intents)

    if top_intents[top_intent] >= SIMILARITY_THRESHOLD:

        if top_intent == "hae":

            # Henkilöiden nimet on kirjoitettava isoilla alkukirjaimilla
            # Edellä käyttän pyyntö on muutettu pieniksi kirjaimiksi, siksi vielä muutetaan uudelleen user_input SpaCyn dokumentiksi
            thing = get_thing(doc2)

            if thing == None: return jsonify({"message": "En ymmärtänyt, mitä tarkoitit kysyä tai pyytää."}), 500

            print(chatbot_mind[keyphrase]+thing)

            # Varmuuden vuoksi try-except-lohko Wikipedia-sivun noutamisen ongelman vuoksi
            try:
                wiki_html = wikipediaapi.Wikipedia(
                user_agent='Wikipedia chatbot',
                    language='fi',
                    extract_format=wikipediaapi.ExtractFormat.HTML)
                
                page = wiki_html.page(thing)
                if page.exists() == False:
                    corpus = ""
                    return jsonify({"message": "En löytänyt pyytämääsi Wikipedia-sivua."}), 500

                # poimitaan Wikipedia-sivun yhteenveto korpuskontekstiksi QA-systeemille
                if domain == 0:
                    corpus = page.summary
                else:
                    corpus = ""
                    full_page = page.text 
                    extract_sections(full_page)
            except:
                corpus = ""
                return jsonify({"message": "Virhe haettaessa Wikipedia-sivua. Tarkista oikeinkirjoitus."}), 500

            return jsonify({"message": "Voit nyt esittää kysymyksiä pyynnöstäsi."}), 200

        if top_intent == "muistisi":

            if corpus.strip() != "" and domain == 0:
                return jsonify({"message": f"Minulla on yhteenveto aiheesta {thing}"}), 200
            elif corpus.strip() != "" and domain == 1:
                return jsonify({"message": f"Minulla on koko Wikipedia-sivu aiheesta {thing}"}), 200
            else:
                return jsonify({"message": "Minulla ei ole mitään kontekstia muistissa."}), 200
            
        if top_intent == "apua":
            return jsonify({"message": chatbot_mind[top_intent]}), 200
            
        # muu chatbotin sisäänrakennettu vastaus
        print(chatbot_mind[top_intent])

        return jsonify({"message": chatbot_mind[top_intent]}), 200
    
    else:
        if corpus.strip() != "":
            
            try:
                output = qa({"question": user_input, "context": corpus})
            except:
                return jsonify({"message": "Ongelma syötteesi kanssa. Syöte ehkä liian pitkä tai tyhjä."}), 500
            
            print(output["answer"], output["score"])

            # Jos vastauksen score on pieniehkö, palautetaan virheilmoitus
            # Koska edellä pienen scoren vastauskin tulostuu, voi tarkastella terminaalista, olisiko vastaus kuitenkin ollut mielekäs,
            # ja halutessasi voit pienentää kynnysarvoa. Huomaa, että arvo voi olla myös negatiivinen.
            if output["score"] < 0.1:
                return jsonify({"message": "Luultavasti en osaa vastata mielekkäästi esittämääsi."}), 500
            else:
                # ...muutoin vastaus
                return jsonify({"message": output["answer"]}), 200

        else:
            return jsonify({"message": "En tunnistanut viestiäsi tai minulla ei ole mitään Wikipedia-sivua tai yhteenvetoa muistissa."}), 500
            
if __name__ == "__main__":
    app.run("localhost", 3000, debug=True)