from io import BytesIO
from pathlib import Path
from time import perf_counter

from fastapi import HTTPException, UploadFile


BASE_DIR = Path(__file__).resolve().parents[3]
MODEL_DIR = BASE_DIR / "ai" / "model"
MODEL_PATH = MODEL_DIR / "keras_model.h5"
LABELS_PATH = MODEL_DIR / "labels.txt"
MAX_FILE_SIZE = 10 * 1024 * 1024
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png"}

_model = None
_labels: list[str] | None = None


def _load_labels() -> list[str]:
    if not LABELS_PATH.exists():
        raise HTTPException(status_code=500, detail="labels.txt file was not found.")

    labels: list[str] = []
    for line in LABELS_PATH.read_text(encoding="utf-8").splitlines():
        label = line.strip()
        if not label:
            continue

        parts = label.split(maxsplit=1)
        labels.append(parts[1] if len(parts) == 2 and parts[0].isdigit() else label)

    if not labels:
        raise HTTPException(status_code=500, detail="labels.txt does not contain classes.")

    return labels


def _load_model():
    global _model

    if _model is not None:
        return _model

    if not MODEL_PATH.exists():
        raise HTTPException(status_code=500, detail="keras_model.h5 file was not found.")

    try:
        from tf_keras.layers import DepthwiseConv2D
        from tf_keras.models import load_model
    except ImportError:
        try:
            from tensorflow.keras.layers import DepthwiseConv2D
            from tensorflow.keras.models import load_model
        except ImportError as exc:
            raise HTTPException(
                status_code=500,
                detail="TensorFlow is not installed. Run pip install -r requirements.txt.",
            ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"TensorFlow loader import failed: {exc}",
        ) from exc

    class TeachableMachineDepthwiseConv2D(DepthwiseConv2D):
        @classmethod
        def from_config(cls, config):
            config.pop("groups", None)
            return super().from_config(config)

    try:
        _model = load_model(
            MODEL_PATH,
            compile=False,
            custom_objects={"DepthwiseConv2D": TeachableMachineDepthwiseConv2D},
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Model load failed: {exc}") from exc

    return _model


def _get_labels() -> list[str]:
    global _labels

    if _labels is None:
        _labels = _load_labels()

    return _labels


def _model_input_size(model) -> tuple[int, int]:
    input_shape = model.input_shape
    if isinstance(input_shape, list):
        input_shape = input_shape[0]

    height = input_shape[1] or 224
    width = input_shape[2] or 224
    return int(width), int(height)


def _preprocess_image(image_bytes: bytes, size: tuple[int, int]):
    try:
        import numpy as np
        from PIL import Image, ImageOps
    except ImportError as exc:
        raise HTTPException(
            status_code=500,
            detail="Image inference packages are missing. Run pip install -r requirements.txt.",
        ) from exc

    try:
        image = Image.open(BytesIO(image_bytes)).convert("RGB")
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Uploaded file is not a readable image.") from exc

    image = ImageOps.fit(image, size, method=Image.Resampling.LANCZOS)
    image_array = np.asarray(image, dtype=np.float32)
    normalized_image_array = (image_array / 127.5) - 1
    return np.expand_dims(normalized_image_array, axis=0)


async def predict_image(file: UploadFile) -> dict:
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="Only jpg, jpeg, and png images are allowed.")

    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    if len(image_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="Image files must be 10MB or smaller.")

    model = _load_model()
    labels = _get_labels()
    model_input = _preprocess_image(image_bytes, _model_input_size(model))

    started_at = perf_counter()
    try:
        predictions = model.predict(model_input, verbose=0)[0]
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Model inference failed: {exc}") from exc

    inference_time_ms = round((perf_counter() - started_at) * 1000)

    scores = predictions.tolist()
    ranked = sorted(enumerate(scores), key=lambda item: item[1], reverse=True)
    best_index, best_score = ranked[0]

    def label_at(index: int) -> str:
        return labels[index] if index < len(labels) else f"class_{index}"

    return {
        "success": True,
        "filename": file.filename,
        "predicted_class": label_at(best_index),
        "confidence": float(best_score),
        "top_k": [
            {"label": label_at(index), "score": float(score)}
            for index, score in ranked[: min(5, len(ranked))]
        ],
        "model": {
            "name": MODEL_PATH.name,
            "version": "v1",
        },
        "inference_time_ms": inference_time_ms,
    }
