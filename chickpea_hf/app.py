from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import numpy as np
from PIL import Image
import tensorflow as tf
import json, io, os, requests

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

print("Loading model...")
model = tf.keras.models.load_model("best_model.keras")
with open("class_labels.json") as f:
    idx_to_class = json.load(f)
print("Model loaded:", idx_to_class)

DISEASE_ADVICE = {
    "healthy": {
        "en": "Your chickpea plant is healthy! Maintain regular watering, balanced NPK fertilizer, and monitor weekly.",
        "hi": "आपका चना का पौधा स्वस्थ है! नियमित सिंचाई और NPK उर्वरक का संतुलित उपयोग करें।",
        "mr": "तुमचा हरभरा निरोगी आहे! नियमित पाणी आणि NPK खत वापरा.",
        "ta": "உங்கள் கொண்டைக்கடலை செடி ஆரோக்கியமாக உள்ளது!",
        "te": "మీ శనగ మొక్క ఆరోగ్యంగా ఉంది!",
        "kn": "ನಿಮ್ಮ ಕಡಲೆ ಗಿಡ ಆರೋಗ್ಯಕರವಾಗಿದೆ!",
        "bn": "আপনার ছোলা গাছ সুস্থ আছে!",
        "gu": "તમારો ચણા છોડ સ્વસ્થ છે!",
        "pa": "ਤੁਹਾਡਾ ਛੋਲਾ ਦਾ ਪੌਦਾ ਸਿਹਤਮੰਦ ਹੈ!",
        "ml": "നിങ്ങളുടെ കടല ചെടി ആരോഗ്യകരമാണ്!",
        "ur": "آپ کا چنے کا پودا صحت مند ہے!"
    },
    "leaf_rust": {
        "en": "🔴 Leaf Rust detected!\n\n📋 Disease: Fungal infection causing orange-brown pustules.\n\n💊 Treatment:\n• Mancozeb 75% WP @ 2.5g/litre\n• OR Propiconazole 25% EC @ 1ml/litre\n• Spray every 10-15 days, 2-3 times\n\n🛡️ Prevention:\n• Use resistant varieties JG-11, Vijay\n• Avoid excess nitrogen",
        "hi": "🔴 पत्ती रतुआ रोग!\n\n💊 उपचार:\n• मैंकोजेब 75% WP @ 2.5 ग्राम/लीटर\n• 10-15 दिन अंतराल पर 2-3 छिड़काव\n\n🛡️ बचाव:\n• JG-11, विजय किस्में लगाएं",
        "mr": "🔴 पानावरील तांबेरा!\n\n💊 उपचार:\n• मँकोझेब 75% WP @ 2.5 ग्रा/लिटर\n• 10-15 दिवसांनी 2-3 फवारण्या\n\n🛡️ प्रतिबंध:\n• JG-11 वाण वापरा",
        "ta": "🔴 இலை துரு நோய்!\n\n💊 சிகிச்சை:\n• மேன்கோசெப் 75% WP @ 2.5கி/லிட்டர்\n• 10-15 நாட்கள் இடைவெளியில் 2-3 முறை",
        "te": "🔴 ఆకు తుప్పు వ్యాధి!\n\n💊 చికిత్స:\n• మాంకోజెబ్ 75% WP @ 2.5గ్రా/లీటర్\n• 10-15 రోజుల వ్యవధిలో 2-3 సార్లు",
        "kn": "🔴 ಎಲೆ ತುಕ್ಕು ರೋಗ!\n\n💊 ಚಿಕಿತ್ಸೆ:\n• ಮ್ಯಾಂಕೋಜೆಬ್ 75% WP @ 2.5ಗ್ರಾ/ಲೀಟರ್",
        "bn": "🔴 পাতার মরিচা!\n\n💊 চিকিৎসা:\n• ম্যানকোজেব 75% WP @ 2.5গ্রাম/লিটার",
        "gu": "🔴 પાનનો કટ રોગ!\n\n💊 સારવાર:\n• મેન્કોઝેબ 75% WP @ 2.5ગ્રામ/લિટર",
        "pa": "🔴 ਪੱਤੇ ਦਾ ਜੰਗਾਲ!\n\n💊 ਇਲਾਜ:\n• ਮੈਂਕੋਜ਼ੇਬ 75% WP @ 2.5ਗ੍ਰਾਮ/ਲੀਟਰ",
        "ml": "🔴 ഇലത്തുരുമ്പ്!\n\n💊 ചികിത്സ:\n• മാൻകോസെബ് 75% WP @ 2.5ഗ്രാം/ലിറ്റർ",
        "ur": "🔴 پتوں پر زنگ!\n\n💊 علاج:\n• مینکوزیب 75% WP @ 2.5گرام/لیٹر"
    },
    "fungal_infection": {
        "en": "🟠 Fungal Infection detected!\n\n📋 Disease: White/brown patches caused by fungal pathogen.\n\n💊 Treatment:\n• Carbendazim 50% WP @ 1g/litre\n• OR Tebuconazole 25.9% EC @ 1ml/litre\n• 2-3 sprays at 10-day intervals\n\n🛡️ Prevention:\n• Seed treatment with Thiram @ 3g/kg\n• Avoid waterlogging",
        "hi": "🟠 फफूंद संक्रमण!\n\n💊 उपचार:\n• कार्बेंडाजिम 50% WP @ 1 ग्राम/लीटर\n• 10 दिन अंतराल पर 2-3 छिड़काव\n\n🛡️ बचाव:\n• थीरम @ 3 ग्राम/किलो से बीज उपचार",
        "mr": "🟠 बुरशीजन्य संसर्ग!\n\n💊 उपचार:\n• कार्बेंडाझिम 50% WP @ 1 ग्रा/लिटर\n\n🛡️ प्रतिबंध:\n• थायरम @ 3 ग्रा/किलो बीज प्रक्रिया",
        "ta": "🟠 பூஞ்சை தொற்று!\n\n💊 சிகிச்சை:\n• கார்பெண்டாசிம் 50% WP @ 1கி/லிட்டர்",
        "te": "🟠 శిలీంధ్ర సంక్రమణ!\n\n💊 చికిత్స:\n• కార్బెండాజిమ్ 50% WP @ 1గ్రా/లీటర్",
        "kn": "🟠 ಶಿಲೀಂಧ್ರ ಸೋಂಕು!\n\n💊 ಚಿಕಿತ್ಸೆ:\n• ಕಾರ್ಬೆಂಡಾಜಿಮ್ 50% WP @ 1ಗ್ರಾ/ಲೀಟರ್",
        "bn": "🟠 ছত্রাক সংক্রমণ!\n\n💊 চিকিৎসা:\n• কার্বেন্ডাজিম 50% WP @ 1গ্রাম/লিটার",
        "gu": "🟠 ફૂગ ચેપ!\n\n💊 સારવાર:\n• કાર્બેન્ડાઝિમ 50% WP @ 1ગ્રામ/લિટર",
        "pa": "🟠 ਫੰਗਲ ਇਨਫੈਕਸ਼ਨ!\n\n💊 ਇਲਾਜ:\n• ਕਾਰਬੈਂਡਾਜ਼ਿਮ 50% WP @ 1ਗ੍ਰਾਮ/ਲੀਟਰ",
        "ml": "🟠 ഫംഗൽ അണുബാധ!\n\n💊 ചികിത്സ:\n• കാർബെൻഡാസിം 50% WP @ 1ഗ്രാം/ലിറ്റർ",
        "ur": "🟠 فنگل انفیکشن!\n\n💊 علاج:\n• کاربینڈازیم 50% WP @ 1گرام/لیٹر"
    },
    "leaf_spot": {
        "en": "🟡 Leaf Spot detected!\n\n📋 Disease: Dark circular spots with yellow halos.\n\n💊 Treatment:\n• Chlorothalonil 75% WP @ 2g/litre\n• OR Copper Oxychloride 50% WP @ 3g/litre\n• 2-3 sprays at 10-day intervals\n\n🛡️ Prevention:\n• Remove infected leaves immediately\n• Use certified disease-free seeds",
        "hi": "🟡 पत्ती धब्बा रोग!\n\n💊 उपचार:\n• क्लोरोथेलोनिल 75% WP @ 2 ग्राम/लीटर\n• 10 दिन अंतराल पर 2-3 छिड़काव\n\n🛡️ बचाव:\n• संक्रमित पत्तियां तुरंत हटाएं",
        "mr": "🟡 पानावरील ठिपके!\n\n💊 उपचार:\n• क्लोरोथॅलोनिल 75% WP @ 2 ग्रा/लिटर\n\n🛡️ प्रतिबंध:\n• बाधित पाने ताबडतोब काढा",
        "ta": "🟡 இலை புள்ளி நோய்!\n\n💊 சிகிச்சை:\n• குளோரோதலோனில் 75% WP @ 2கி/லிட்டர்",
        "te": "🟡 ఆకు మచ్చ వ్యాధి!\n\n💊 చికిత్స:\n• క్లోరోథాలోనిల్ 75% WP @ 2గ్రా/లీటర్",
        "kn": "🟡 ಎಲೆ ಚುಕ್ಕೆ ರೋಗ!\n\n💊 ಚಿಕಿತ್ಸೆ:\n• ಕ್ಲೋರೋಥಲೋನಿಲ್ 75% WP @ 2ಗ್ರಾ/ಲೀಟರ್",
        "bn": "🟡 পাতার দাগ!\n\n💊 চিকিৎসা:\n• ক্লোরোথ্যালোনিল 75% WP @ 2গ্রাম/লিটার",
        "gu": "🟡 પાન ધાબા રોગ!\n\n💊 સારવાર:\n• ક્લોરોથેલોનિલ 75% WP @ 2ગ્રામ/લિટર",
        "pa": "🟡 ਪੱਤੇ ਦੇ ਧੱਬੇ!\n\n💊 ਇਲਾਜ:\n• ਕਲੋਰੋਥੈਲੋਨਿਲ 75% WP @ 2ਗ੍ਰਾਮ/ਲੀਟਰ",
        "ml": "🟡 ഇലപ്പുള്ളി!\n\n💊 ചികിത്സ:\n• ക്ലോറോതലോനിൽ 75% WP @ 2ഗ്രാം/ലിറ്റർ",
        "ur": "🟡 پتوں کے دھبے!\n\n💊 علاج:\n• کلوروتھیلونل 75% WP @ 2گرام/لیٹر"
    }
}

def get_advice_gemini(disease, lang):
    try:
        api_key = os.environ.get("GEMINI_API_KEY", "")
        if not api_key:
            return None
        lang_names = {"en":"English","hi":"Hindi","mr":"Marathi","ta":"Tamil","te":"Telugu","kn":"Kannada","bn":"Bengali","gu":"Gujarati","pa":"Punjabi","ml":"Malayalam","ur":"Urdu"}
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        payload = {"contents":[{"parts":[{"text": f"Chickpea plant has {disease.replace('_',' ')} disease. Give advice to Indian farmer in {lang_names.get(lang,'English')}. Include pesticide name, dosage, application method, 2 prevention tips. Simple language. Max 120 words."}]}]}
        r = requests.post(url, json=payload, timeout=10)
        if r.status_code == 200:
            return r.json()['candidates'][0]['content']['parts'][0]['text']
        return None
    except:
        return None

def get_advice_groq(disease, lang):
    try:
        api_key = os.environ.get("GROQ_API_KEY", "")
        if not api_key:
            return None
        lang_names = {"en":"English","hi":"Hindi","mr":"Marathi","ta":"Tamil","te":"Telugu","kn":"Kannada","bn":"Bengali","gu":"Gujarati","pa":"Punjabi","ml":"Malayalam","ur":"Urdu"}
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
        payload = {"model":"llama3-8b-8192","messages":[{"role":"user","content":f"Chickpea {disease.replace('_',' ')} disease. Advise Indian farmer in {lang_names.get(lang,'English')}. Pesticide, dosage, method, 2 prevention tips. Max 120 words."}],"max_tokens":250}
        r = requests.post(url, json=payload, headers=headers, timeout=10)
        if r.status_code == 200:
            return r.json()['choices'][0]['message']['content']
        return None
    except:
        return None

def get_advice(disease, lang):
    advice = get_advice_gemini(disease, lang)
    if advice:
        return advice
    advice = get_advice_groq(disease, lang)
    if advice:
        return advice
    advice_map = DISEASE_ADVICE.get(disease, DISEASE_ADVICE["healthy"])
    return advice_map.get(lang, advice_map["en"])

@app.post("/predict")
async def predict(file: UploadFile = File(...), lang: str = "en"):
    contents = await file.read()
    img = Image.open(io.BytesIO(contents)).convert("RGB").resize((128, 128))
    arr = np.expand_dims(np.array(img) / 255.0, axis=0)
    preds = model.predict(arr)[0]
    best_idx = str(np.argmax(preds))
    disease = idx_to_class[best_idx]
    confidence = float(np.max(preds))
    all_probs = {idx_to_class[str(i)].replace("_"," ").title(): round(float(p)*100,1) for i,p in enumerate(preds)}
    advice = get_advice(disease, lang)
    return JSONResponse({"disease":disease.replace("_"," ").title(),"disease_key":disease,"confidence":round(confidence*100,1),"all_probs":all_probs,"advice":advice,"lang":lang})

@app.get("/health")
def health():
    return {"status":"ok","model":"chickpea-cnn-98.87%"}
