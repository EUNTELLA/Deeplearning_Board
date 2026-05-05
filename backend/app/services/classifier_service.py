from fastapi import HTTPException, UploadFile


async def predict_image(file: UploadFile) -> dict:
    await file.read()

    raise HTTPException(
        status_code=503,
        detail={
            "message": "Teachable Machine 모델이 아직 연결되지 않았습니다.",
            "next_step": "모델과 라벨 파일을 ai/model/에 넣은 뒤 추론 로직을 연결하세요.",
        },
    )
