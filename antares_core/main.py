from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File, Depends
from fastapi.middleware.cors import CORSMiddleware

from routers.filter_data import router as filter_data_router
from routers.training_images import router as training_images_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Application started ( use Alembic for database migrations )")
    
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

app.include_router(filter_data_router)
app.include_router(training_images_router)
