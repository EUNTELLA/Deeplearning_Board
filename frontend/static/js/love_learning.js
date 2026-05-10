// love_learning.js

let video = document.getElementById('video');
let canvas = document.getElementById('canvas');
let context = canvas.getContext('2d');

function startPractice() {
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            video.srcObject = stream;
        })
        .catch(err => {
            console.error("웹캠 접근 오류:", err);
        });
}

function capture() {
    context.drawImage(video, 0, 0, 640, 480);
    // 여기서 캡처된 이미지를 모델에 전송하여 예측할 수 있음
}