const postList = document.getElementById("postList");
const alphabetTabs = document.getElementById("alphabetTabs");
const loadMoreBtn = document.getElementById("loadMoreBtn");

let skip = 0;
const limit = 6;
let currentCategory = "";

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
    })[char]);
}

function showEmptyMessage() {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "empty-state";
    emptyMessage.innerText = "아직 저장된 ASL 학습 기록이 없습니다. 분류 화면에서 A-I 결과를 저장해 주세요.";
    postList.insertBefore(emptyMessage, loadMoreBtn);
}

function getConfidenceState(confidence) {
    if (confidence >= 0.9) {
        return { label: "안정", className: "confidence-stable" };
    }
    if (confidence >= 0.7) {
        return { label: "확인 필요", className: "confidence-review" };
    }
    return { label: "다시 보기", className: "confidence-retry" };
}

function setActiveTab(category) {
    if (!alphabetTabs) {
        return;
    }

    alphabetTabs.querySelectorAll(".tab-chip").forEach((button) => {
        button.classList.toggle("is-active", button.dataset.category === category);
    });
}

async function loadPosts({ reset = false } = {}) {
    if (reset) {
        skip = 0;
        postList.innerHTML = "";
        postList.appendChild(loadMoreBtn);
    }

    const params = new URLSearchParams({ skip, limit });
    if (currentCategory) {
        params.set("category", currentCategory);
    }

    const res = await fetch(`/api/v1/posts?${params.toString()}`);
    const data = await res.json();

    if (reset && data.total === 0) {
        showEmptyMessage();
    }

    data.items.forEach((post, index) => {
        const title = escapeHtml(post.title);
        const state = getConfidenceState(post.confidence);
        const card = document.createElement("a");
        card.href = `/post/${post.id}`;
        card.className = "post-card";
        card.style.setProperty("--card-delay", `${index * 0.05}s`);
        card.innerHTML = `
            <img src="${escapeHtml(post.image_url)}" alt="${title}">
            <div class="post-body">
                <div class="post-letter-row">
                    <strong class="post-letter">${escapeHtml(post.prediction)}</strong>
                    <span class="confidence-badge ${state.className}">${state.label}</span>
                </div>
                <h3>${title}</h3>
                <div class="post-meta">
                    <span class="post-confidence">${(post.confidence * 100).toFixed(1)}%</span>
                    <span class="post-label">ASL ${escapeHtml(post.prediction)}</span>
                </div>
                <span class="detail-link">상세 보기</span>
            </div>
        `;
        postList.insertBefore(card, loadMoreBtn);
    });

    skip += data.items.length;
    loadMoreBtn.hidden = skip >= data.total;
}

if (alphabetTabs) {
    alphabetTabs.addEventListener("click", (event) => {
        const button = event.target.closest(".tab-chip");
        if (!button) {
            return;
        }

        currentCategory = button.dataset.category;
        setActiveTab(currentCategory);
        loadPosts({ reset: true });
    });
}

loadMoreBtn.addEventListener("click", () => loadPosts());

const params = new URLSearchParams(window.location.search);
currentCategory = params.get("category") || "";
setActiveTab(currentCategory);
loadPosts({ reset: true });
