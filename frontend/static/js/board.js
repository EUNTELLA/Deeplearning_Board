postList.innerHTML += `
<a href="/post/${post.id}" class="post-card">
   <img src="${post.image_url}">
   <div class="post-body">
      <h3>${post.title}</h3>
      <p>${post.prediction}</p>
      <span>
        ${(post.confidence * 100).toFixed(1)}%
      </span>
   </div>
</a>
`;