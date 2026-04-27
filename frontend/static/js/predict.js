const form=document.getElementById("predictForm");

form.addEventListener("submit",async function(e){

e.preventDefault();

let file=document.getElementById("imageInput").files[0];

let formData=new FormData();
formData.append("file",file);


const res=await fetch("/api/v1/predict",{
method:"POST",
body:formData
});

const data=await res.json();


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