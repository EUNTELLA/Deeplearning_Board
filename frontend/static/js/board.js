loadPosts();

async function loadPosts(){

const res=await fetch("/api/v1/posts");

const data=await res.json();

let box=document.getElementById("postList");

box.innerHTML="";

data.items.forEach(post=>{

box.innerHTML+=`
<div class="card">

<h3>
<a href="/posts/${post.id}">
${post.title}
</a>
</h3>

<p>
분류 :
${post.prediction}
</p>

</div>
`;
});
}