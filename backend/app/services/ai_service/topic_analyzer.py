# backend/app/services/topic_analyzer.py
from typing import Any, Optional, List, Dict, Union, Tuple
from app.db.models.topic import Topic as TopicModel
from app.db.models.study_material import StudyMaterial as StudyMaterialModel
from app.services.ai_service.openai_service import client as openai_client # Importuj OpenAI klienta
import json # Pre prácu s JSON odpoveďou z OpenAI

# Funkcia na extrakciu textu (zatiaľ placeholder, nahraď reálnou implementáciou)
def extract_text_from_material(material: StudyMaterialModel) -> Optional[str]:
    """
    Placeholder funkcia na extrakciu textu z materiálu.
    V reálnej aplikácii by si tu použil knižnice ako pypdf2, python-docx, atď.
    alebo by tento text bol už uložený v DB pri nahrávaní súboru.
    """
    print(f"Attempting to extract text for: {material.file_name} (Type: {material.file_type})")
    if material.file_type == "text/plain" and material.file_path:
        # Toto je veľmi zjednodušené - predpokladá, že file_path je prístupný
        # a že máme metódu na čítanie obsahu (čo nemáme priamo z tohto modelu)
        # V reálnom svete by si mal obsah súboru alebo cestu k nemu
        # a čítal by si ho tu.
        # Pre demonštráciu vrátime názov a popis, ak existuje.
        return f"{material.title or ''} {material.description or ''}"
    elif "pdf" in (material.file_type or ""):
        # Tu by bola logika pre pypdf2
        print(f"PDF text extraction for {material.file_name} not yet implemented.")
        return f"PDF Content: {material.title or ''} {material.description or ''}" # Placeholder
    # Pridaj ďalšie typy súborov
    return None


def analyze_topic_with_openai(
    topic_name: str,
    user_strengths: Optional[str] = None,
    user_weaknesses: Optional[str] = None,
    material_texts: Optional[List[str]] = None # Zoznam textov z materiálov
) -> Dict[str, Any]:
    """
    Použije OpenAI na analýzu témy a vráti odhadovanú náročnosť, dĺžku a cvičné otázky.
    """
    if not openai_client:
        print("OpenAI client not available. Returning default estimates.")
        return {
            "ai_difficulty_score": 0.5, # Default stredná
            "ai_estimated_duration": 60, # Default 60 minút
            "generated_questions": [],
            "error": "OpenAI client not initialized."
        }

    prompt_parts = [f"Analyzuj nasledujúcu študijnú tému: '{topic_name}'."]
    if user_strengths:
        prompt_parts.append(f"Používateľ uvádza ako svoje silné stránky k tejto téme: '{user_strengths}'.")
    if user_weaknesses:
        prompt_parts.append(f"Používateľ uvádza ako svoje slabé stránky k tejto téme: '{user_weaknesses}'.")
    
    if material_texts:
        combined_material_text = "\n\n".join(material_texts)
        if combined_material_text.strip(): # Pridaj len ak materiály obsahujú text
            prompt_parts.append(f"\nK téme sú priradené nasledujúce študijné materiály (výňatok alebo kľúčové body):\n{combined_material_text[:2000]}") # Obmedz dĺžku textu materiálov

    prompt_parts.append("\nNa základe týchto informácií, prosím, poskytni nasledujúce v JSON formáte:")
    prompt_parts.append("1. 'difficulty_score': Odhadovaná náročnosť témy na škále od 0.0 (veľmi ľahká) do 1.0 (veľmi ťažká). Zohľadni komplexnosť, abstraktnosť a potenciálne predpoklady.")
    prompt_parts.append("2. 'estimated_duration_minutes': Odhadovaný čas v minútach potrebný na zvládnutie základov tejto témy pre priemerného študenta (rozumné hodnoty, napr. 30-180 minút).")
    prompt_parts.append("3. 'key_concepts': Zoznam 3-5 kľúčových konceptov alebo podtém, ktoré sú pre túto tému najdôležitejšie (ako list stringov).")
    prompt_parts.append("4. 'practice_questions': Zoznam 2 jednoduchých cvičných otázok (ako list stringov), ktoré by pomohli overiť pochopenie kľúčových konceptov.")
    prompt_parts.append("\nOdpoveď formátuj výhradne ako JSON objekt s kľúčmi: difficulty_score, estimated_duration_minutes, key_concepts, practice_questions.")
    
    full_prompt = "\n".join(prompt_parts)
    print(f"\n--- OpenAI Prompt ---\n{full_prompt}\n---------------------\n")

    try:
        completion = openai_client.chat.completions.create(
            model="gpt-3.5-turbo", # Alebo novší/vhodnejší model
            messages=[
                {"role": "system", "content": "Si expert na analýzu študijných tém a tvorbu edukatívneho obsahu. Tvojou úlohou je poskytnúť štruktúrovanú analýzu v JSON formáte."},
                {"role": "user", "content": full_prompt}
            ],
            temperature=0.3, # Nižšia teplota pre konzistentnejšie odpovede
            max_tokens=400,
            response_format={"type": "json_object"} # Ak model podporuje JSON mode
        )
        
        response_content = completion.choices[0].message.content
        print(f"--- OpenAI Raw Response ---\n{response_content}\n-------------------------\n")
        
        if response_content:
            parsed_response = json.loads(response_content)
            return {
                "ai_difficulty_score": parsed_response.get("difficulty_score"),
                "ai_estimated_duration": parsed_response.get("estimated_duration_minutes"),
                "key_concepts": parsed_response.get("key_concepts", []),
                "practice_questions": parsed_response.get("practice_questions", []),
                "error": None
            }
        else:
            raise ValueError("Empty response from OpenAI")

    except Exception as e:
        print(f"Error calling OpenAI API: {e}")
        return {
            "ai_difficulty_score": 0.5,
            "ai_estimated_duration": 60,
            "key_concepts": [],
            "practice_questions": [],
            "error": str(e)
        }

# Funkcia, ktorú bude volať CRUD
def update_topic_with_ai_analysis(db_topic: TopicModel, db_materials: Optional[List[StudyMaterialModel]] = None) -> None:
    """
    Aktualizuje ORM objekt témy (db_topic) AI odhadmi.
    Túto funkciu volaj pred db.commit() pre danú tému.
    """
    material_texts_list: List[str] = []
    if db_materials: # Ak sú materiály poskytnuté
        for mat in db_materials:
            # Tu by si mal mať logiku na extrakciu textu z `mat.file_path`
            # Zatiaľ použijeme placeholder funkciu, ktorá môže vrátiť názov/popis
            text = extract_text_from_material(mat) 
            if text:
                material_texts_list.append(text)
    
    ai_analysis_result = analyze_topic_with_openai(
        topic_name=db_topic.name,
        user_strengths=db_topic.user_strengths,
        user_weaknesses=db_topic.user_weaknesses,
        material_texts=material_texts_list if material_texts_list else None
    )

    db_topic.ai_difficulty_score = ai_analysis_result.get("ai_difficulty_score")
    db_topic.ai_estimated_duration = ai_analysis_result.get("ai_estimated_duration")
    # Kľúčové koncepty a otázky by si mohol ukladať do nových stĺpcov v Topic modeli
    # alebo do prepojenej tabuľky. Zatiaľ ich neukladáme.
    # db_topic.ai_key_concepts_json = json.dumps(ai_analysis_result.get("key_concepts"))
    # db_topic.ai_practice_questions_json = json.dumps(ai_analysis_result.get("practice_questions"))
    
    print(f"AI Analysis for Topic ID {db_topic.id if db_topic.id else 'NEW'}: Score={db_topic.ai_difficulty_score}, Duration={db_topic.ai_estimated_duration}")
    if ai_analysis_result.get("error"):
        print(f"AI Analysis Error: {ai_analysis_result.get('error')}")