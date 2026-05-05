from fastapi import UploadFile


async def predict_image(file: UploadFile) -> dict:
    await file.read()

    return {
        "predicted_class": "cat",
        "confidence": 0.87,
        "top_k": [
            {"label": "cat", "score": 0.87},
            {"label": "dog", "score": 0.11},
            {"label": "unknown", "score": 0.02},
        ],
    }
