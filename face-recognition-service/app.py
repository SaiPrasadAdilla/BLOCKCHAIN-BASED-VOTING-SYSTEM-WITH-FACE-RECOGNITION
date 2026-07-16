import numpy as np
import pickle
import os
from pathlib import Path
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import JSONResponse
import uvicorn
import cv2
from insightface.app import FaceAnalysis

app = FastAPI(title="Face Recognition Service")

DATA_DIR = Path("/app/known_faces")
INDEX_FILE = DATA_DIR / "index.pkl"

DATA_DIR.mkdir(parents=True, exist_ok=True)

known_embeddings = []
known_ids = []

if INDEX_FILE.exists():
    with open(INDEX_FILE, "rb") as f:
        data = pickle.load(f)
        known_ids = data.get("ids", [])
        known_embeddings = data.get("embeddings", [])
    print(f"Loaded {len(known_ids)} known faces")

face_analyzer = FaceAnalysis(name="buffalo_l", root="/app/models")
face_analyzer.prepare(ctx_id=0, det_size=(640, 640))


def save_index():
    with open(INDEX_FILE, "wb") as f:
        pickle.dump({"ids": known_ids, "embeddings": known_embeddings}, f)


@app.post("/faces")
async def register_face(id: str = Form(...), file: UploadFile = File(...)):
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        return JSONResponse({"success": False, "error": "Invalid image"}, status_code=400)

    faces = face_analyzer.get(img)
    if not faces:
        return JSONResponse({"success": False, "error": "No face detected"}, status_code=400)

    embedding = faces[0].embedding
    known_embeddings.append(embedding)
    known_ids.append(id)
    save_index()

    return {"success": True, "message": f"Face registered for {id}"}


@app.post("/")
async def recognize_face(file: UploadFile = File(...)):
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        return {"success": True, "ids": []}

    faces = face_analyzer.get(img)
    if not faces:
        return {"success": True, "ids": []}

    input_embedding = faces[0].embedding
    matches = []

    for i, known_emb in enumerate(known_embeddings):
        cos_sim = np.dot(input_embedding, known_emb) / (
            np.linalg.norm(input_embedding) * np.linalg.norm(known_emb)
        )
        if cos_sim > 0.5:
            matches.append(known_ids[i])

    return {"success": True, "ids": matches}


@app.delete("/faces/{face_id}")
async def delete_face(face_id: str):
    indices_to_remove = [i for i, fid in enumerate(known_ids) if fid == face_id]
    if not indices_to_remove:
        return JSONResponse({"success": False, "error": f"No face found for ID: {face_id}"}, status_code=404)

    for i in reversed(indices_to_remove):
        known_ids.pop(i)
        known_embeddings.pop(i)
    save_index()

    return {"success": True, "message": f"Face deleted for {face_id}"}


@app.get("/health")
async def health():
    return {"status": "ok", "faces": len(known_ids)}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080)