const introOverlay = document.getElementById("introOverlay");
const introStartBtn = document.getElementById("introStartBtn");
const mainUi = document.getElementById("mainUi");

if (introOverlay && introStartBtn && mainUi) {
    if (sessionStorage.getItem("objectVisionHomeIntroSeen") === "1") {
        introOverlay.classList.add("is-done");
        mainUi.classList.remove("is-hidden");
    }

    introStartBtn.addEventListener("click", function () {
        sessionStorage.setItem("objectVisionHomeIntroSeen", "1");
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
