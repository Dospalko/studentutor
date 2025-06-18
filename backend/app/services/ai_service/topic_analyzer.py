# backend/app/services/topic_analyzer.py
from typing import List, Optional, Dict, Union
from app.db.models.topic import Topic as TopicModel # ORM model
from app.db.models.study_material import StudyMaterial as StudyMaterialModel # ORM model
# Pre jednoduchú analýzu môžeme použiť len základné stringové operácie
# Ak by si chcel pokročilejšie:
# import spacy
# nlp = spacy.load("en_core_web_sm") # Alebo model pre slovenčinu, ak existuje a je potrebný

# Jednoduché kľúčové slová naznačujúce vyššiu náročnosť (príklad)
DIFFICULT_KEYWORDS = [
    "pokročil", "komplexn", "abstraktn", "teória", "derivácia", "integrál", 
    "rekurzia", "optimalizácia", "algoritmus", "dôkaz", "analýza"
]
EASY_KEYWORDS = ["úvod", "základ", "prehľad", "jednoduch", "príklad"]

def estimate_topic_difficulty_and_duration(
    topic: TopicModel, 
    materials: Optional[List[StudyMaterialModel]] = None
) -> Dict[str, Optional[Union[float, int]]]:
    """
    Jednoduchá heuristika na odhad náročnosti a dĺžky štúdia témy.
    Vráti slovník s 'ai_difficulty_score' (0.0-1.0) a 'ai_estimated_duration' (minúty).
    """
    score = 0.3  # Základné skóre (mierne ľahké)
    duration = 60  # Základná dĺžka (minúty)

    text_to_analyze = topic.name.lower()
    if topic.user_weaknesses: # Používateľom zadané slabé stránky zvyšujú náročnosť
        text_to_analyze += " " + topic.user_weaknesses.lower()
        score += 0.2
        duration += 30
    
    if topic.user_strengths: # Silné stránky môžu mierne znížiť
         text_to_analyze += " " + topic.user_strengths.lower()
         # score -= 0.05 # Malý vplyv

    # Zahrň text z priradených materiálov, ak sú dostupné a majú extrahovaný text
    # Toto predpokladá, že StudyMaterialModel má atribút `extracted_text`
    # a že `materials` sú načítané. Zatiaľ to preskočíme, kým nemáš extrakciu textu.
    # if materials:
    #     for material in materials:
    #         if hasattr(material, 'extracted_text') and material.extracted_text:
    #             text_to_analyze += " " + material.extracted_text.lower()
    #             duration += 15 # Pridaj čas za každý materiál

    # Analýza kľúčových slov
    for keyword in DIFFICULT_KEYWORDS:
        if keyword in text_to_analyze:
            score += 0.1
            duration += 15
    
    for keyword in EASY_KEYWORDS:
        if keyword in text_to_analyze:
            score -= 0.08
            duration -= 10

    # Dĺžka názvu a popisu (veľmi hrubý odhad)
    if len(topic.name) > 50 : score += 0.05
    # Ak by si mal popis témy: if topic.description and len(topic.description) > 200: score += 0.1; duration += 20

    # Normalizácia skóre na 0.0 až 1.0
    final_score = min(max(score, 0.0), 1.0)
    # Normalizácia dĺžky (napr. minimálne 30 min, maximálne 180 min)
    final_duration = min(max(duration, 30), 180)

    return {
        "ai_difficulty_score": round(final_score, 2),
        "ai_estimated_duration": int(final_duration)
    }