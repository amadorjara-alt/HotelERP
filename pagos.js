"use strict";
const db=supabase.createClient("https://ynnulzfgsfkojvgbhgua.supabase.co","sb_publishable_mZFB2d_rNKfUal18HRA6iQ_6JZ_xTL-");
const get=id=>document.getElementById(id);
const form=get("paymentForm");
const methods=get("paymentMethods");
const status=get("paymentStatus");
const currency=(cents,code)=>new Intl.NumberFormat("es-PE",{style:"currency",currency:code}).format(cents/100);
const fromReturn=new URLSearchParams(location.search);
let current=null;
let busy=false;
function note(message){status.textContent=message;}
async function call(action,reservation,provider,expectedCents){
 const {data,error}=await db.functions.invoke("sandbox-checkout",{body:{action,reservation,provider,expected_cents:expectedCents}});
 if(error){
  let reason;
  try{reason=(await error.context?.json())?.error;}catch{/* Server response may not be JSON. */}
  throw new Error(reason||"No se pudo comunicar con el servicio de pagos.");
 }
 return data;
}
function controls(){
 get("payVisa").disabled=busy||!current?.configured.stripe||current.status==="paid"||current.provider==="paypal";
 get("payPaypal").disabled=busy||!current?.configured.paypal||!current.paypal_cents||current.status==="paid"||current.provider==="stripe";
 get("verifyPayment").hidden=current?.status!=="pending";
 get("verifyPayment").disabled=busy;
 form.querySelector("button").disabled=busy;
 form.elements.reservation.disabled=busy;
}
async function run(action){
 if(busy)return;
 busy=true;controls();
 try{await action();}catch(error){note(error.message);}
 finally{busy=false;controls();}
}
function showQuote(quote,reservation){
 current={...quote,reservation};
 methods.hidden=false;
 get("paymentAmount").textContent="Liquidación: "+currency(quote.pen_cents,"PEN")+(quote.paypal_cents?" · PayPal: "+currency(quote.paypal_cents,"USD"):"");
 const off=[];
 if(!quote.configured.stripe) off.push("Stripe de prueba pendiente de configuración.");
 if(!quote.configured.paypal) off.push("PayPal Sandbox pendiente de configuración.");
 if(quote.configured.paypal&&!quote.paypal_cents) off.push("PayPal no está disponible sin una tasa de referencia.");
 get("paymentAvailability").textContent=off.join(" ");
 note(quote.status==="paid"?"Pago de prueba confirmado.":quote.status==="pending"?"Hay un pago de prueba pendiente.":"Selecciona un proveedor de prueba.");
}
async function quote(){const id=form.elements.reservation.value;showQuote(await call("quote",id),id);}
form.addEventListener("submit",event=>{event.preventDefault();run(quote);});
form.elements.reservation.addEventListener("change",()=>{current=null;methods.hidden=true;});
async function start(provider){
 if(!current)return;
 const result=await call("create",current.reservation,provider,provider==="paypal"?current.paypal_cents:current.pen_cents);
 if(result.status==="paid"){await quote();return;}
 if(!result.checkout_url) throw new Error("El proveedor no devolvió un enlace de pago.");
 location.assign(result.checkout_url);
}
get("payVisa").onclick=()=>run(()=>start("stripe"));
get("payPaypal").onclick=()=>run(()=>start("paypal"));
get("verifyPayment").onclick=()=>run(async()=>{
 const result=await call("verify",current.reservation);
 await quote();
 if(result.status!=="paid") note("El proveedor todavía no ha confirmado el pago de prueba.");
});
(async()=>{
 try{
  const {data:{session},error}=await db.auth.getSession();
  if(error) throw error;
  if(!session){get("paymentLogin").hidden=false;note("Inicia sesión como cliente para consultar tus estadías.");return;}
  const {data,error:staysError}=await db.rpc("hotel_customer_stays");
  if(staysError)throw staysError;
  const stays=data.filter(stay=>stay.status==="completed"&&Number(stay.total)>0);
  if(!stays.length){note("No tienes estadías cerradas con importe disponible.");return;}
  form.elements.reservation.replaceChildren(...stays.map(stay=>new Option("Habitación "+stay.room+" · "+stay.check_out+" · "+currency(Number(stay.total)*100,"PEN"),stay.id)));
  form.hidden=false;
  const selected=fromReturn.get("reserva");
  if(stays.some(stay=>stay.id===selected)){form.elements.reservation.value=selected;await run(quote);}
  else note("Selecciona una estadía para consultar los métodos.");
 }catch{note("No se pudo cargar la información de pagos.");}
})();
