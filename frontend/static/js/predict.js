const form=document.getElementById("predictForm");
const imageInput=document.getElementById("imageInput");
const preview=document.getElementById("preview");
const resultBox=document.getElementById("resultBox");
const savePostBtn=document.getElementById("savePostBtn");
const introOverlay=document.getElementById("introOverlay");
const introStartBtn=document.getElementById("introStartBtn");
const mainUi=document.getElementById("mainUi");

let latestResult=null;

resultBox.hidden=true;

if(introOverlay&&introStartBtn&&mainUi){
introStartBtn.addEventListener("click",function(){
introOverlay.classList.add("is-bursting");

const colors=["#3182f6","#00c2a8","#ffb020","#f04452","#7c5cff"];
const dotCount=72;

for(let i=0;i<dotCount;i++){
const dot=document.createElement("span");
const angle=(Math.PI*2*i)/dotCount;
const distance=120+Math.random()*360;
dot.className="intro-dot";
dot.style.setProperty("--dot-x",`${Math.cos(angle)*distance}px`);
dot.style.setProperty("--dot-y",`${Math.sin(angle)*distance}px`);
dot.style.setProperty("--dot-scale",`${0.7+Math.random()*1.8}`);
dot.style.setProperty("--dot-delay",`${Math.random()*0.16}s`);
dot.style.setProperty("--dot-color",colors[i%colors.length]);
introOverlay.appendChild(dot);
}

window.setTimeout(function(){
mainUi.classList.remove("is-hidden");
},260);

window.setTimeout(function(){
introOverlay.classList.add("is-done");
},1050);
});
}

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

if(!res.ok){
const error=await res.json();
const message=error.detail?.message||"예측을 실행할 수 없습니다.";
alert(message);
return;
}

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
