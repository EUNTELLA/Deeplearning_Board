const form=document.getElementById("predictForm");
const imageInput=document.getElementById("imageInput");
const preview=document.getElementById("preview");
const resultBox=document.getElementById("resultBox");
const savePostBtn=document.getElementById("savePostBtn");

let latestResult=null;

resultBox.hidden=true;

imageInput.addEventListener("change", function(){
const file=imageInput.files[0];
if(!file){
return;
}
const reader=new FileReader();
reader.onload=function(){
preview.src=reader.result;
};
reader.readAsDataURL(file);
});

form.addEventListener("submit",async function(e){

e.preventDefault();

let file=imageInput.files[0];
if(!file){
alert("이미지를 선택해주세요.");
return;
}

let formData=new FormData();
formData.append("file",file);


const res=await fetch("/api/v1/predict",{
method:"POST",
body:formData
});

const data=await res.json();
latestResult=data;
resultBox.hidden=false;


document.getElementById(
"predictedClass"
).innerText=data.predicted_class;


document.getElementById(
"confidence"
).innerText=
(data.confidence*100).toFixed(2)+"%";


let topk=document.getElementById("topK");
topk.innerHTML="";

data.top_k.forEach(item=>{
topk.innerHTML+=`
<li>
${item.label}
:
${(item.score*100).toFixed(2)}%
</li>
`;
});

});

savePostBtn.addEventListener("click", async function(){
if(!latestResult){
return;
}

const res=await fetch("/api/v1/posts",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({
title:"업로드 이미지 분류 결과",
image_url:preview.src,
prediction:latestResult.predicted_class,
confidence:latestResult.confidence
})
});

const post=await res.json();
location.href=`/post/${post.id}`;
});
