const supabaseUrl=Deno.env.get("SUPABASE_URL");
const serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const site="https://amadorjara-alt.github.io/HotelERP/pagos.html";
const paypalHost="https://api-m.sandbox.paypal.com";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, apikey, x-client-info, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const stripeKey=Deno.env.get("STRIPE_TEST_SECRET_KEY");
const paypalId=Deno.env.get("PAYPAL_SANDBOX_CLIENT_ID");
const paypalSecret=Deno.env.get("PAYPAL_SANDBOX_CLIENT_SECRET");
const configured={stripe:/^(sk|rk)_test_/.test(stripeKey||""),paypal:Boolean(paypalId&&paypalSecret)};
const json=(body,status=200)=>Response.json(body,{status,headers:cors});

async function fetchJson(url,options={}){
 const response=await fetch(url,{...options,signal:AbortSignal.timeout(9000)});
 if(!response.ok) throw new Error("request failed");
 return response.json();
}
const stripe=(path,options={})=>fetchJson("https://api.stripe.com/v1"+path,{
 ...options,headers:{authorization:"Bearer "+stripeKey,...options.headers}
});
async function paypalToken(){
 const response=await fetchJson(paypalHost+"/v1/oauth2/token",{
  method:"POST",headers:{authorization:"Basic "+btoa(paypalId+":"+paypalSecret),"content-type":"application/x-www-form-urlencoded"},
  body:"grant_type=client_credentials"
 });
 return response.access_token;
}
const paypal=(token,path,options={})=>fetchJson(paypalHost+path,{
 ...options,headers:{authorization:"Bearer "+token,"content-type":"application/json",...options.headers}
});
function safeCheckout(raw,provider){
 const url=new URL(raw);
 const allowed=provider==="stripe"?["checkout.stripe.com"]:["www.sandbox.paypal.com","sandbox.paypal.com"];
 if(url.protocol!=="https:"||!allowed.includes(url.hostname)) throw new Error("invalid checkout URL");
 return url.href;
}
const cents=value=>Math.round(Number(value)*100);
async function transport(row){
 if(row.provider==="stripe"){
  const body=new URLSearchParams({
   mode:"payment",success_url:site+"?reserva="+row.reservation_id+"&volver=1",
   cancel_url:site+"?reserva="+row.reservation_id,"payment_method_types[0]":"card",
   "line_items[0][quantity]":"1","line_items[0][price_data][currency]":"pen",
   "line_items[0][price_data][unit_amount]":String(row.charged_cents),
   "line_items[0][price_data][product_data][name]":"Estadía HotelERP (prueba)",
   client_reference_id:row.id
  });
  const session=await stripe("/checkout/sessions",{method:"POST",body,headers:{"Idempotency-Key":row.id}});
  if(session.livemode!==false) throw new Error("live Stripe session refused");
  return {external_id:session.id,checkout_url:safeCheckout(session.url,"stripe")};
 }
 const token=await paypalToken();
 const order=await paypal(token,"/v2/checkout/orders",{
  method:"POST",headers:{"PayPal-Request-Id":row.id},
  body:JSON.stringify({intent:"CAPTURE",purchase_units:[{
   reference_id:row.id,amount:{currency_code:"USD",value:(row.charged_cents/100).toFixed(2)}
  }],payment_source:{paypal:{experience_context:{
   return_url:site+"?reserva="+row.reservation_id+"&volver=1",cancel_url:site+"?reserva="+row.reservation_id,user_action:"PAY_NOW"
  }}}})
 });
 const link=order.links?.find(item=>["payer-action","approve"].includes(item.rel))?.href;
 return {external_id:order.id,checkout_url:safeCheckout(link,"paypal")};
}
async function providerPaid(row){
 if(!row.external_id) return false;
 if(row.provider==="stripe"){
  const session=await stripe("/checkout/sessions/"+encodeURIComponent(row.external_id));
  return session.livemode===false&&session.payment_status==="paid"&&session.currency==="pen"&&
   session.amount_total===row.charged_cents&&session.client_reference_id===row.id;
 }
 const token=await paypalToken();
 const path="/v2/checkout/orders/"+encodeURIComponent(row.external_id);
 let order=await paypal(token,path);
 if(order.status==="APPROVED"){
  try { order=await paypal(token,path+"/capture",{method:"POST",headers:{"PayPal-Request-Id":row.id+"-capture"},body:"{}"}); }
  catch { order=await paypal(token,path); }
 }
 const unit=order.purchase_units?.find(item=>item.reference_id===row.id);
 const captures=unit?.payments?.captures||[];
 return order.status==="COMPLETED"&&captures.length===1&&captures[0].status==="COMPLETED"&&
  captures[0].amount?.currency_code==="USD"&&cents(captures[0].amount?.value)===row.charged_cents;
}
Deno.serve(async request=>{
 if(request.method==="OPTIONS") return new Response(null,{status:204,headers:cors});
 if(request.method!=="POST") return json({error:"Método no permitido"},405);
 const authorization=request.headers.get("authorization");
 const apikey=request.headers.get("apikey");
 if(!authorization?.startsWith("Bearer ")||!apikey) return json({error:"Inicia sesión"},401);
 try{
  const authHeaders={authorization,apikey};
  const auth=await fetch(supabaseUrl+"/auth/v1/user",{headers:authHeaders,signal:AbortSignal.timeout(5000)});
  if(!auth.ok) return json({error:"Sesión inválida"},401);
  const user=await auth.json();
  const raw=await request.text();
  if(raw.length>1100) return json({error:"Solicitud demasiado larga"},413);
  let body;
  try{body=JSON.parse(raw);}catch{return json({error:"Solicitud no válida"},400);}
  if(!uuid.test(body.reservation||"")||!["quote","create","verify"].includes(body.action)) return json({error:"Selecciona una estadía válida"},400);
  const stays=await fetchJson(supabaseUrl+"/rest/v1/rpc/hotel_customer_stays",{
   method:"POST",headers:{...authHeaders,"content-type":"application/json"},body:"{}"
  });
  const stay=stays.find(item=>item.id===body.reservation&&item.status==="completed");
  const total=cents(stay?.total);
  if(!stay||!Number.isSafeInteger(total)||total<=0||total>99999999) return json({error:"Se requiere una liquidación cerrada de tu cuenta"},403);
  if(!serviceKey) return json({error:"Almacenamiento de pagos no disponible"},503);
  const security={apikey:serviceKey,authorization:"Bearer "+serviceKey,"content-type":"application/json"};
  const table=supabaseUrl+"/rest/v1/sandbox_payments";
  const filter="?reservation_id=eq."+stay.id+"&select=*";
  const lookup=()=>fetchJson(table+filter,{headers:security}).then(rows=>rows[0]);
  let row=await lookup();
  if(row&&row.customer_id!==user.id) return json({error:"Pago no disponible para esta cuenta"},403);
  if(body.action==="quote"){
   let paypalCents=null;
   if(configured.paypal){
    try{
     const fx=await fetchJson("https://api.frankfurter.dev/v2/rate/PEN/USD");
     if(Number.isFinite(fx.rate)&&fx.rate>0) paypalCents=Math.round(total*fx.rate);
    }catch{/* The PayPal option stays disabled when a quote is unavailable. */}
   }
   return json({configured,pen_cents:total,paypal_cents:row?.provider==="paypal"?row.charged_cents:paypalCents,
    provider:row?.provider,status:row?.status||"none",checkout_url:row?.status==="pending"?row.checkout_url:null});
  }
  if(row?.status==="paid") return json({status:"paid"});
  if(body.action==="verify"){
   if(!row||!configured[row.provider]||!(await providerPaid(row))) return json({status:"pending"});
   await fetchJson(table+"?id=eq."+row.id,{method:"PATCH",headers:{...security,Prefer:"return=representation"},body:JSON.stringify({status:"paid"})});
   return json({status:"paid"});
  }
  if(!["stripe","paypal"].includes(body.provider)||!configured[body.provider]) return json({error:"Este proveedor de prueba aún no está configurado"},503);
  if(row&&row.provider!==body.provider) return json({error:"Ya existe un flujo de prueba para esta liquidación"},409);
  if(!row){
   let charged=total;
   if(body.provider==="paypal"){
    const rate=await fetchJson("https://api.frankfurter.dev/v2/rate/PEN/USD");
    charged=Math.round(total*rate.rate);
    if(!Number.isSafeInteger(charged)||charged<=0||charged!==body.expected_cents) return json({error:"La referencia cambió. Vuelve a ver la cotización"},409);
   }
   const created=await fetchJson(table+"?on_conflict=reservation_id",{
    method:"POST",headers:{...security,Prefer:"resolution=ignore-duplicates,return=representation"},
    body:JSON.stringify({reservation_id:stay.id,customer_id:user.id,provider:body.provider,pen_cents:total,
     charged_cents:charged,currency:body.provider==="stripe"?"PEN":"USD"})
   });
   row=created[0]||await lookup();
  }
  if(!row||row.provider!==body.provider||row.customer_id!==user.id) return json({error:"Ya existe otro flujo de prueba"},409);
  if(row.status==="paid") return json({status:"paid"});
  if(row.checkout_url) return json({status:"pending",checkout_url:safeCheckout(row.checkout_url,row.provider)});
  const checkout=await transport(row);
  await fetchJson(table+"?id=eq."+row.id,{method:"PATCH",headers:{...security,Prefer:"return=representation"},body:JSON.stringify(checkout)});
  return json({status:"pending",checkout_url:checkout.checkout_url});
 }catch{
  return json({error:"No se pudo completar la operación de prueba. Inténtalo de nuevo."},502);
 }
});
