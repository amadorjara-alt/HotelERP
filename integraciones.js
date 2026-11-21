"use strict";
const form=document.getElementById("exchangeForm");
const result=document.getElementById("exchangeResult");
const submit=form.querySelector("button");
const money=(amount,currency)=>new Intl.NumberFormat("es-PE",{style:"currency",currency}).format(amount);
form.addEventListener("submit",async event=>{
 event.preventDefault();
 const {amount,from,to}=Object.fromEntries(new FormData(form));
 if(from===to){result.textContent=money(Number(amount),to);return;}
 submit.disabled=true;
 result.textContent="Consultando el tipo de cambio…";
 try{
  const response=await fetch("https://api.frankfurter.dev/v2/rate/"+from+"/"+to,{signal:AbortSignal.timeout(8000)});
  if(!response.ok) throw new Error("Tasa no disponible");
  const {rate,date}=await response.json();
  if(!Number.isFinite(rate)||rate<=0||!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Respuesta no válida");
  result.textContent=money(Number(amount),from)+" ≈ "+money(Number(amount)*rate,to)+" · Referencia del "+date+".";
 }catch{
  result.textContent="No se pudo consultar la tasa. Vuelve a intentarlo.";
 }finally{submit.disabled=false;}
});
fetch("https://ynnulzfgsfkojvgbhgua.supabase.co/auth/v1/settings",{headers:{apikey:"sb_publishable_mZFB2d_rNKfUal18HRA6iQ_6JZ_xTL-"},signal:AbortSignal.timeout(8000)})
 .then(response=>{if(!response.ok)throw new Error();return response.json();})
 .then(settings=>{document.getElementById("googleState").textContent=settings.external?.google?"Google está habilitado para el inicio de sesión.":"El proveedor Google está pendiente de activación. Puedes usar el acceso por correo."})
 .catch(()=>{document.getElementById("googleState").textContent="No se pudo verificar el estado de Google. Usa el acceso por correo si lo necesitas.";});
