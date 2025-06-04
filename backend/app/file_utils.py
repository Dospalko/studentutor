import os
import shutil
from pathlib import Path
from fastapi import UploadFile
from app.config import settings

MEDIA_ROOT = Path(settings.MEDIA_FILES_BASE_DIR)

def save_upload_file(upload_file: UploadFile, destination_on_disk: Path) -> None:
    try:
        destination_on_disk.parent.mkdir(parents=True, exist_ok=True)
        with destination_on_disk.open("wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)
    finally:
        upload_file.file.close()

def get_relative_file_path(user_id: int, subject_id: int, original_filename: str) -> Path:
    safe_filename = Path(original_filename).name
    return Path(f"user_{user_id}") / f"subject_{subject_id}" / safe_filename

def get_full_path_on_disk(relative_file_path: str | Path) -> Path:
    return MEDIA_ROOT / Path(relative_file_path)

def remove_file_from_disk(file_path_on_disk: Path) -> bool:
    try:
        if file_path_on_disk.exists() and file_path_on_disk.is_file():
            file_path_on_disk.unlink()
            try:
                subject_dir = file_path_on_disk.parent
                if not any(subject_dir.iterdir()):
                    subject_dir.rmdir()
                    user_dir = subject_dir.parent
                    if not any(user_dir.iterdir()):
                        user_dir.rmdir()
            except OSError:
                pass 
            return True
        elif not file_path_on_disk.exists():
            return True
    except Exception:
        pass # Log error if needed
    return False