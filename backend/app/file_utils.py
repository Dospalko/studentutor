# backend/app/file_utils.py
import os
import shutil
from pathlib import Path
from fastapi import UploadFile
from app.config import settings # Importuj settings z app.config

# Základný adresár pre médiá, definovaný v config.py a .env
MEDIA_ROOT = Path(settings.MEDIA_FILES_BASE_DIR)

def save_upload_file(upload_file: UploadFile, destination_on_disk: Path) -> None:
    """
    Uloží nahraný súbor (UploadFile) na zadané miesto na disku.
    Vytvorí rodičovské adresáre, ak neexistujú.
    """
    try:
        destination_on_disk.parent.mkdir(parents=True, exist_ok=True)
        with destination_on_disk.open("wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)
        print(f"File '{upload_file.filename}' saved to '{destination_on_disk}'")
    except Exception as e:
        print(f"Error saving file '{upload_file.filename}' to '{destination_on_disk}': {e}")
        raise # Znova vyvolaj výnimku, aby ju mohol volajúci spracovať
    finally:
        upload_file.file.close() # Vždy zatvor súbor

def get_relative_file_path(user_id: int, subject_id: int, original_filename: str) -> Path:
    """
    Vygeneruje relatívnu cestu k súboru (od MEDIA_ROOT) pre uloženie do databázy.
    Zabezpečuje, aby sa použil len názov súboru bez nebezpečných častí cesty.
    """
    # Odstráni akékoľvek časti cesty z pôvodného názvu, aby sa predišlo ../ útokom
    safe_filename = Path(original_filename).name 
    # Môžeš pridať logiku na generovanie unikátneho názvu súboru, ak je to potrebné
    # napr. pridaním časovej značky alebo UUID, aby sa predišlo prepísaniu
    # unique_filename = f"{uuid.uuid4().hex}_{safe_filename}"
    return Path(f"user_{user_id}") / f"subject_{subject_id}" / safe_filename

def get_full_path_on_disk(relative_file_path: str | Path) -> Path:
    """
    Získa plnú (absolútnu) cestu k súboru na disku na základe relatívnej cesty.
    """
    return MEDIA_ROOT / Path(relative_file_path)

def remove_file_from_disk(file_path_on_disk: Path) -> bool:
    """
    Zmaže súbor z disku, ak existuje.
    Pokúsi sa zmazať aj prázdne rodičovské adresáre.
    Vráti True, ak bol súbor úspešne zmazaný alebo neexistoval, inak False.
    """
    try:
        if file_path_on_disk.exists() and file_path_on_disk.is_file():
            file_path_on_disk.unlink()
            print(f"File '{file_path_on_disk}' deleted from disk.")
            # Pokus o zmazanie prázdnych rodičovských adresárov
            try:
                # Zmaže adresár predmetu, ak je prázdny
                subject_dir = file_path_on_disk.parent
                if not any(subject_dir.iterdir()): # Skontroluj, či je adresár prázdny
                    subject_dir.rmdir()
                    print(f"Empty subject directory '{subject_dir}' deleted.")
                    # Zmaže adresár používateľa, ak je prázdny
                    user_dir = subject_dir.parent
                    if not any(user_dir.iterdir()):
                        user_dir.rmdir()
                        print(f"Empty user directory '{user_dir}' deleted.")
            except OSError as oe: # OSError ak adresár nie je prázdny alebo iná chyba
                print(f"Could not remove parent directory for '{file_path_on_disk}': {oe}")
            return True
        elif not file_path_on_disk.exists():
            print(f"File '{file_path_on_disk}' not found on disk, nothing to delete.")
            return True # Považujeme za úspech, ak súbor neexistuje
    except Exception as e:
        print(f"Error removing file '{file_path_on_disk}': {e}")
    return False