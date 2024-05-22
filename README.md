# WikiChat

Pyydettyä Wikipedia-sivua tai sen yhteenvetoa tietovarantonaan käyttävä full stack chatbot.

## Python-ympäristö

Palvelinpuolta varten kannattaa luoda oma Python-virtuaaliympäristö. Sen voi tehdä vaikka koko projektin juureen Windows-ympäristössä terminaalissa seuraavasti: `python -m venv .venv`. Edellä .venv on ympäristön nimi, jonka voi luonnollisesti myös nimetä toisin, eikä sen ole pakko alkaa pisteellä. Ympäristö käynnistetään Windowsissa näin: `.venv\Scripts\activate`. Linuxissa Python-tulkki käynnistetään komennolla python3, ja ympäristö aktivoidaan komennolla `source .venv/bin/activate`. Windowsissa ympäristöstä poistutaan komennolla `.venv\Scripts\deactivate` ja Linuxissa vain komennolla `deactivate` ympäristön ollessa aktiivinen. Huomaa asentaessasi tarvittavia Python-kirjastoja, että olet aktivoinut virtuaaliympäristön. Huomioi lisäksi, että olet deaktivoinut mahdollisesti järjestelmässäsi oletuksena tulevan virtuaaliympäristön.

## PyTorch ja Python-versio

Sovelluksessa käyetty transformer tarvitsee toimiakseen PyTorch-kirjaston, joka puolestaan tarvitsee toimiakseen Pythonista vähintään version 3.8. Tämä on syytä huomioida virtuaaliympäristöä luotaessa. Jotta PyTorch-kirjaston saa asennettua GPU-pohjaisesti, se on Windows-koneessa asennettava seuraavasti: pip3 install torch --index-url https://download.pytorch.org/whl/cu121. Jotta saa varmasti omaa laitteistoa, mukaan lukien GPU:n laiteajurin tuoreinta versiota, tukevan kirjaston, niin kannattaa vielä tarkistaa verkko-osoitteesta https://pytorch.org/get-started/locally/ kuinka se asennetaan pip-komennolla.

Kun asennus on valmis, voit kokeilla tekemässäsi virtuaaliympäristössä käynnistää Python-tulkin ja kirjoittaa:

`import torch`  
`torch.cuda.is_available()`

Jos kaikki on kunnossa, pitäisi yllä olevan tulosteena tulla True. Huomaa, että jos tietokoneessasi ei ole Nvidian GPU-näytönohjainta edellä oleva testi antaa tulokseksi aina False. Myöskään tällöin ei tule asentaa GPU-versiota PyTorch-kirjastosta. Tarkista edellä esitetyiltä verkkosivuilta asentaminen tällöin. Suosittelen myös ilman GPU:ta valitsemaan WikiChatille kysymysten kontekstiksi Wikipedia-sivujen yhteenvedon riippuen koneesi nopeudesta, jotta WikiChat ei vastaa liian hitaasti vapaisiin kysymyksiin.

### Muut asennettavat

Komennolla `pip3 install flask flask-cors spacy transformers wikipedia-api spacy_fi_experimental_web_md` asentuu loput tarvittavista kirjastoista. Jälkimmäisen yhteydessä asentuu myös libvoikko-kirjasto, jota tarvitaan ladatun SpaCy:n NLP-mallin käyttöönotossa. Windowsille libvoikko-kirjaston dokumentaatiossa, https://voikko.puimula.org/python.html, ohjeistetaan luomaan vaikkapa C-aseman juureen voikko-hakemisto, jonne tulee sijoittaa libvoikko-1.dll. Nykyaikana varmaankin kaikilla lukijoilla aktiivisesti käyttämä Windows-kone on 64-bittinen, jota vastaava dll-tiedosto on ladattava osoitteesta https://www.puimula.org/htp/testing/voikko-sdk/win-crossbuild/. Sieltä valitaan tuorein versio, joka itselläni on vuodelta 2019 versio 5. Tämän lisäksi tarvitaan sanakirja. Itse olen käyttänyt tieteellistä sanastoa. Osoitteesta https://www.puimula.org/htp/testing/voikko-snapshot-v5/ olen ladannut tunnisteen "science" yhteydestä zip-paketin ja purkanut sen C-aseman voikko-hakemistoon, johon tuli ainakin itselläni numerolla 5 alkava hakemisto, jonka alta lopulta löytyy sanakirja. Jos käytät muuta hakemistoa kuin C-aseman juuren voikko, niin tämä on huomioitava myös WikiChatin backend-hakemiston server.py-tiedoston alussa.

Jos et halua asentaa voikko-kokonaisuutta, joudut tyytymään pynnöissä "Hae aihe" -tyyppisiin ilmaisuihin "Hae aiheesta" -ilmaisujen sijaan. Tarvitsetkin kuitenkin jonkin NLP-mallin SpaCy-kirjastolle. Laajimman suomen kielen sanaston saat seuraavasti: `python -m spacy download fi_core_news_lg`. Huomaa, että vapaamuotoiset kysymykset voit kuitenkin esittää TurkuNLP-transformerin osaamisen puitteissa.

### Asennettava transformer

Käytettävä transformer-malli asentuu, kun luotu virtuaaliympäristö on aktiivinen komennolla `python server.py` WikiChatin backend-hakemistossa. Samalla sovelluksen palvelinpuoli käynnistyy. Kuitenkin riippumatta työskenteletkö ulkoisella kiintolevyasemalla vai muulla, niin transformer-malli asentuu systeemilevylle käyttäjätunnuksesi alaisuuteen piilotettuun hakemistoon `.cache`. Kaikkiaan malli vie levytilaa noin 500 megatavua alla olevan mukaisesti:

config.json: 100%|████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 648/648 [00:00<00:00, 839kB/s]
pytorch_model.bin: 100%|███████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 496M/496M [00:37<00:00, 13.3MB/s]
tokenizer_config.json: 100%|██████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 307/307 [00:00<00:00, 602kB/s]
vocab.txt: 100%|███████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 424k/424k [00:00<00:00, 1.71MB/s]
tokenizer.json: 100%|████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 1.22M/1.22M [00:00<00:00, 2.11MB/s]
special_tokens_map.json: 100%|████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 112/112 [00:00<00:00, 224kB/s]

## Lopuksi

Jos kirjastoja asentaessa jotain menee pieleen tai poistat kirjastoja `pip uninstall` -komennolla, kannattaa järjestelmä aika ajoin puhdistaa lisäksi komennolla `pip cache purge`, joka poistaa turhia cache-tiedostoja. Näin voi saada yllättävän paljon lisää levytilaa joskus.
