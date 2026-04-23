import os
import shutil

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "uploads")

def save_file(project_id: int, filename: str, content: bytes) -> str:
    project_dir = os.path.join(UPLOAD_DIR, str(project_id))
    os.makedirs(project_dir, exist_ok=True)
    dest = os.path.join(project_dir, filename)
    with open(dest, "wb") as f:
        f.write(content)
    return dest

def delete_file(path: str):
    if os.path.exists(path):
        os.remove(path)
