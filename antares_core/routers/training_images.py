from fastapi import APIRouter, UploadFile, File, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from PIL import Image as PILImage
import io

from database import get_db
from models import Image, ImageFeature
from features.image_analyzer import ImageAnalyzer

router = APIRouter()

analyzer = ImageAnalyzer()


@router.post("/training-images")
async def analyze_image(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    try:
        contents = await file.read()

        pil_image = PILImage.open(io.BytesIO(contents))
        width, height = pil_image.size

        features_data = analyzer.analyze(contents)

        image = Image(
            filename=file.filename,
            width=width,
            height=height,
            file_size=len(contents),
        )

        db.add(image)
        await db.flush()

        image_feature = ImageFeature(
            image_id=image.id,
            **features_data
        )

        db.add(image_feature)
        await db.commit()

        return {
            "status": "success",
            "image_id": image.id,
            "filename": file.filename,
            "size": len(contents),
            "dimensions": {
                "width": width,
                "height": height
            },
            "features": features_data,
        }

    except Exception as e:
        await db.rollback()

        return {
            "status": "error",
            "message": str(e)
        }