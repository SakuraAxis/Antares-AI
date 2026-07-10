from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from PIL import Image as PILImage
import io

from database import engine, Base, get_db
from models import Image, ImageFeature
from features.image_analyzer import ImageAnalyzer


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Database tables created")
    
    yield
    
    print("Application shutting down")


app = FastAPI(title="Antares AI Core", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

analyzer = ImageAnalyzer()


@app.post("/training-images")
async def analyze_image(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """Receive images, extract features, and store them in a database"""
    try:
        contents = await file.read()
        
        print(f"Received File : {file.filename}")
        print(f"File Size : {len(contents)} bytes")
        
        # Get image dimensions
        pil_image = PILImage.open(io.BytesIO(contents))
        width, height = pil_image.size
        
        print("Extracting features...")
        features_data = analyzer.analyze(contents)
        print("Features extracted")
        
        print("Saving to database...")
        
        image = Image(
            filename=file.filename,
            width=width,
            height=height,
            file_size=len(contents),
        )
        db.add(image)
        await db.flush() # Get image.id
        
        image_feature = ImageFeature(
            image_id=image.id,
            **features_data
        )
        db.add(image_feature)
        await db.commit()
        
        print(f"Saved to database with ID : {image.id}")
        
        return {
            "status": "success",
            "image_id": image.id,
            "filename": file.filename,
            "size": len(contents),
            "dimensions": {"width": width, "height": height},
            "features": features_data,
        }
        
    except Exception as e:
        print(f"Error : {str(e)}")
        await db.rollback()
        return {
            "status": "error",
            "message": str(e),
        }