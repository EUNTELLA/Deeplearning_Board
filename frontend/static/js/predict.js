const form = document.getElementById("predictForm");
const imageInput = document.getElementById("imageInput");
const preview = document.getElementById("preview");
const cameraPreview = document.getElementById("cameraPreview");
const uploadArea = document.querySelector(".upload-area");
const resultBox = document.getElementById("resultBox");
const savePostBtn = document.getElementById("savePostBtn");
const startCameraBtn = document.getElementById("startCameraBtn");
const captureBtn = document.getElementById("captureBtn");
const introOverlay = document.getElementById("introOverlay");
const introStartBtn = document.getElementById("introStartBtn");
const mainUi = document.getElementById("mainUi");

let latestResult = null;
let cameraStream = null;

resultBox.hidden = true;

if (introOverlay && introStartBtn && mainUi) {
    if (sessionStorage.getItem("objectVisionIntroSeen") === "1") {
        introOverlay.classList.add("is-done");
        mainUi.classList.remove("is-hidden");
    }

    introStartBtn.addEventListener("click", function () {
        sessionStorage.setItem("objectVisionIntroSeen", "1");
        introOverlay.classList.add("is-bursting");

        const colors = ["#ff7f85", "#e7636d", "#ffd84d", "#159947", "#6c4328"];
        const dotCount = 58;

        for (let i = 0; i < dotCount; i++) {
            const dot = document.createElement("span");
            const angle = (Math.PI * 2 * i) / dotCount;
            const distance = 110 + Math.random() * 300;
            dot.className = "intro-dot";
            dot.style.setProperty("--dot-x", `${Math.cos(angle) * distance}px`);
            dot.style.setProperty("--dot-y", `${Math.sin(angle) * distance}px`);
            dot.style.setProperty("--dot-scale", `${0.7 + Math.random() * 1.4}`);
            dot.style.setProperty("--dot-delay", `${Math.random() * 0.13}s`);
            dot.style.setProperty("--dot-color", colors[i % colors.length]);
            introOverlay.appendChild(dot);
        }

        window.setTimeout(function () {
            mainUi.classList.remove("is-hidden");
        }, 180);

        window.setTimeout(function () {
            introOverlay.classList.add("is-done");
        }, 880);
    });
}

function stopCamera() {
    if (!cameraStream) {
        return;
    }

    cameraStream.getTracks().forEach((track) => track.stop());
    cameraStream = null;
    cameraPreview.srcObject = null;
    cameraPreview.hidden = true;
    captureBtn.hidden = true;
    startCameraBtn.innerText = "웹캠 시작";
    uploadArea.classList.remove("is-camera");
}

function showSelectedImage(file) {
    if (!file) {
        return;
    }

    stopCamera();

    const reader = new FileReader();
    reader.onload = function () {
        preview.src = reader.result;
        uploadArea.classList.add("has-image");
    };
    reader.readAsDataURL(file);
}

async function runPrediction(blob, filename = "capture.jpg") {
    const formData = new FormData();
    formData.append("file", blob, filename);

    const res = await fetch("/api/v1/predict", {
        method: "POST",
        body: formData,
    });

    if (!res.ok) {
        const error = await res.json();
        const message = error.detail?.message || error.detail || "예측을 실행할 수 없습니다.";
        alert(message);
        return;
    }

    const data = await res.json();
    latestResult = data;
    resultBox.hidden = false;

    document.getElementById("predictedClass").innerText = data.predicted_class;
    document.getElementById("confidence").innerText = `신뢰도 ${(data.confidence * 100).toFixed(2)}%`;

    const topK = document.getElementById("topK");
    topK.innerHTML = "";

    data.top_k.forEach((item) => {
        const percent = item.score * 100;
        topK.innerHTML += `
            <li>
                <span>${item.label}</span>
                <span class="score-track">
                    <span class="score-bar" style="width:${percent.toFixed(2)}%"></span>
                </span>
                <strong>${percent.toFixed(1)}%</strong>
            </li>
        `;
    });
}

imageInput.addEventListener("change", function () {
    showSelectedImage(imageInput.files[0]);
});

if (uploadArea) {
    ["dragenter", "dragover"].forEach((eventName) => {
        uploadArea.addEventListener(eventName, function (e) {
            e.preventDefault();
            uploadArea.classList.add("is-dragging");
        });
    });

    ["dragleave", "drop"].forEach((eventName) => {
        uploadArea.addEventListener(eventName, function (e) {
            e.preventDefault();
            uploadArea.classList.remove("is-dragging");
        });
    });

    uploadArea.addEventListener("drop", function (e) {
        const file = e.dataTransfer.files[0];
        if (!file || !file.type.startsWith("image/")) {
            return;
        }

        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        imageInput.files = dataTransfer.files;
        showSelectedImage(file);
    });
}

startCameraBtn.addEventListener("click", async function () {
    if (cameraStream) {
        stopCamera();
        return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
        alert("이 브라우저에서는 웹캠을 사용할 수 없습니다.");
        return;
    }

    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user" },
            audio: false,
        });
    } catch (error) {
        alert("웹캠 권한을 허용해 주세요.");
        return;
    }

    preview.removeAttribute("src");
    uploadArea.classList.remove("has-image");
    uploadArea.classList.add("is-camera");
    cameraPreview.srcObject = cameraStream;
    cameraPreview.hidden = false;
    captureBtn.hidden = false;
    startCameraBtn.innerText = "웹캠 끄기";
});

captureBtn.addEventListener("click", async function () {
    if (!cameraStream || !cameraPreview.videoWidth) {
        alert("웹캠 화면을 불러오는 중입니다.");
        return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = cameraPreview.videoWidth;
    canvas.height = cameraPreview.videoHeight;
    canvas.getContext("2d").drawImage(cameraPreview, 0, 0);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    preview.src = dataUrl;
    uploadArea.classList.add("has-image");
    stopCamera();

    canvas.toBlob(async (blob) => {
        if (!blob) {
            alert("웹캠 이미지를 캡처하지 못했습니다.");
            return;
        }

        const capturedFile = new File([blob], "webcam-capture.jpg", {
            type: "image/jpeg",
        });
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(capturedFile);
        imageInput.files = dataTransfer.files;

        await runPrediction(blob, "webcam-capture.jpg");
    }, "image/jpeg", 0.92);
});

form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const file = imageInput.files[0];
    if (!file) {
        alert("이미지를 선택해 주세요.");
        return;
    }

    await runPrediction(file, file.name);
});

savePostBtn.addEventListener("click", async function () {
    if (!latestResult) {
        return;
    }

    const res = await fetch("/api/v1/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            title: "업로드 이미지 분류 결과",
            image_url: preview.src,
            prediction: latestResult.predicted_class,
            confidence: latestResult.confidence,
        }),
    });

    const post = await res.json();
    location.href = `/post/${post.id}`;
});
