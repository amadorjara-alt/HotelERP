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

const limaDate=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Lima",year:"numeric",month:"2-digit",day:"2-digit"});
const longDate=new Intl.DateTimeFormat("es-PE",{timeZone:"UTC",weekday:"long",day:"numeric",month:"long",year:"numeric"});
const formatDate=value=>longDate.format(new Date(value+"T00:00:00Z"));
async function json(url){
 const reply=await fetch(url,{signal:AbortSignal.timeout(8000)});
 if(!reply.ok) throw new Error("Servicio no disponible");
 return reply.json();
}
function listAction(buttonId,resultId,statusId,loader){
 const button=document.getElementById(buttonId);
 if(!button) return;
 const status=document.getElementById(statusId);
 const list=document.getElementById(resultId);
 button.addEventListener("click",async()=>{
  button.disabled=true;
  status.textContent="Consultando…";
  try{
   const entries=await loader();
   list.replaceChildren(...entries.map(value=>{
    const li=document.createElement("li");
    li.textContent=value;
    return li;
   }));
   status.textContent=entries.length?"Consulta actualizada.":"No hay fechas próximas disponibles.";
  }catch{
   list.replaceChildren();
   status.textContent="El servicio no está disponible ahora. Puedes volver a intentarlo.";
  }finally{button.disabled=false;}
 });
}
listAction("loadWeather","weatherDays","weatherStatus",async()=>{
 const params=new URLSearchParams({latitude:"-12.0464",longitude:"-77.0428",daily:"temperature_2m_max,temperature_2m_min,precipitation_probability_max",timezone:"America/Lima",forecast_days:"3"});
 const {daily}=await json("https://api.open-meteo.com/v1/forecast?"+params);
 return daily.time.map((date,index)=>{
  const rain=daily.precipitation_probability_max[index];
  return formatDate(date)+" · "+Math.round(daily.temperature_2m_min[index])+" a "+Math.round(daily.temperature_2m_max[index])+" °C"+(Number.isFinite(rain)?" · Lluvia "+rain+" %":"");
 });
});
listAction("loadHolidays","holidayDays","holidaysStatus",async()=>{
 const today=limaDate.format(new Date());
 const year=Number(today.slice(0,4));
 const endpoint=value=>"https://date.nager.at/api/v3/PublicHolidays/"+value+"/PE";
 const future=items=>items.filter(item=>item.global&&item.date>=today&&item.types?.includes("Public"));
 const current=future(await json(endpoint(year)));
 const next=current.length<5?future(await json(endpoint(year+1)).catch(()=>[])):[];
 return [...current,...next].sort((a,b)=>a.date.localeCompare(b.date)).slice(0,5).map(item=>formatDate(item.date)+" · "+item.localName);
});
