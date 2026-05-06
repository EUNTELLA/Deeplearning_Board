const postList = document.getElementById("postList");
const categoryFilter = document.getElementById("categoryFilter");
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
    emptyMessage.innerText = "아직 저장된 분류 결과가 없습니다. 분류 화면에서 결과를 저장해 주세요.";
    postList.insertBefore(emptyMessage, loadMoreBtn);
}

function ensureCategoryOption(label) {
    if (!label || Array.from(categoryFilter.options).some((option) => option.value === label)) {
        return;
    }

    const option = document.createElement("option");
    option.value = label;
    option.innerText = label;
    categoryFilter.appendChild(option);
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
        ensureCategoryOption(post.prediction);

        const title = escapeHtml(post.title);
        const card = document.createElement("a");
        card.href = `/post/${post.id}`;
        card.className = "post-card";
        card.style.setProperty("--card-delay", `${index * 0.05}s`);
        card.innerHTML = `
            <img src="${escapeHtml(post.image_url)}" alt="${title}">
            <div class="post-body">
                <h3>${title}</h3>
                <div class="post-meta">
                    <span class="post-label">${escapeHtml(post.prediction)}</span>
                    <span class="post-confidence">${(post.confidence * 100).toFixed(1)}%</span>
                </div>
                <span class="detail-link">상세 보기</span>
            </div>
        `;
        postList.insertBefore(card, loadMoreBtn);
    });

    skip += data.items.length;
    loadMoreBtn.hidden = skip >= data.total;
}

categoryFilter.addEventListener("change", () => {
    currentCategory = categoryFilter.value;
    loadPosts({ reset: true });
});

loadMoreBtn.addEventListener("click", () => loadPosts());

loadPosts({ reset: true });
