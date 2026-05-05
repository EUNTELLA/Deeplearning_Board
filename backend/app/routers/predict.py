from fastapi import APIRouter, UploadFile, File

from backend.app.services.classifier_service import predict_image


router = APIRouter(prefix="/predict", tags=["predict"])


@router.post("")
async def predict(file: UploadFile = File(...)):
    return await predict_image(file)
