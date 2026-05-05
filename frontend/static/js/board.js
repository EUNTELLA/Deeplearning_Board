const postList = document.getElementById("postList");
const categoryFilter = document.getElementById("categoryFilter");
const loadMoreBtn = document.getElementById("loadMoreBtn");

let skip = 0;
const limit = 6;
let currentCategory = "";

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

    data.items.forEach((post, index) => {
        const card = document.createElement("a");
        card.href = `/post/${post.id}`;
        card.className = "post-card";
        card.style.setProperty("--card-delay", `${index * 0.08}s`);
        card.innerHTML = `
            <img src="${post.image_url}" alt="${post.title}">
            <div class="post-body">
                <h3>${post.title}</h3>
                <p>${post.prediction}</p>
                <span>${(post.confidence * 100).toFixed(1)}%</span>
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
