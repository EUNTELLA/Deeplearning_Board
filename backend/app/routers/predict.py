from fastapi import APIRouter, UploadFile, File

from backend.app.services.classifier_service import get_labels, predict_image


router = APIRouter(prefix="/predict", tags=["predict"])


@router.post("")
async def predict(file: UploadFile = File(...)):
    return await predict_image(file)


@router.get("/labels")
async def labels():
    classes = get_labels()
    return {"classes": classes, "count": len(classes)}
