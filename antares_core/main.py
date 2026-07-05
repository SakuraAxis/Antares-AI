from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/training-images")
async def analyze_image(file: UploadFile = File(...)):
    contents = await file.read()

    print(f"Received File : {file.filename}")
    print(f"File Type : {file.content_type}")
    print(f"File Size : {len(contents)} bytes")

    return {
        "status": "ok",
        "filename": file.filename,
        "content_type": file.content_type,
        "size": len(contents),
    }