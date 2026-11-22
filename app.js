import { createVoiceAssistant } from "./voice-assistant.js?v=7";
import { createPublicPortal, renderDesk } from "./hotel-ui.js?v=7";
"use strict";
const supabaseUrl="https://ynnulzfgsfkojvgbhgua.supabase.co";
const publishableKey="sb_publishable_mZFB2d_rNKfUal18HRA6iQ_6JZ_xTL-";
const db=supabase.createClient(supabaseUrl,publishableKey);
const byId = id => document.getElementById(id);
const dateFormat = new Intl.DateTimeFormat("en-CA",{timeZone:"America/Lima",year:"numeric",month:"2-digit",day:"2-digit"});
const shortDate = new Intl.DateTimeFormat("es-PE",{timeZone:"UTC",weekday:"short",day:"numeric",month:"short"});
const currency = new Intl.NumberFormat("es-PE",{style:"currency",currency:"PEN"});
const names = {reserved:"Reservada",occupied:"Ocupada",completed:"Finalizada",cancelled:"Cancelada"};
const today = dateFormat.format(new Date());
const firstDay = byId("firstDay");
firstDay.value = today;
const reservationForm = byId("reservationForm");
const guestForm = byId("guestForm");
const serviceForm = byId("serviceForm");
const reservationSelect = byId("selectedReservation");
const routeParams=new URLSearchParams(location.search);
const route=routeParams.get("acceso")||"inicio";
const accessMode=()=>route==="cliente"?"customer":"hotel";
const redirectUrl=new URL("./",location.href);
redirectUrl.searchParams.set("acceso",route==="cliente"?"cliente":"personal");
redirectUrl.searchParams.set("ingresar","1");
const redirectTo=redirectUrl.href;
let rooms=[], guests=[], reservations=[], services=[], totals=[], charges=[];
let sessionVersion=0;
function message(text,error=false){
  const status = byId("status");
  status.setAttribute("role", error ? "alert" : "status");
  status.setAttribute("aria-live", error ? "assertive" : "polite");
  status.setAttribute("aria-atomic", "true");
  status.classList.toggle("error", error);
  status.textContent = text;
}
function check(result){
  if(result.error) throw result.error;
  return result.data;
}
function explain(error){
  if(error.code==="23P01") return "La habitación ya está reservada en parte de ese período. Elige otras fechas.";
  if(error.code==="23505") return "Ya existe un registro con ese documento.";
  return error.message || "La operación no pudo completarse.";
}
function handle(button,action){
  return async event=>{
    event.preventDefault();
    if(button.disabled) return;
    button.disabled=true;
    try{await action(event);}catch(error){message(explain(error),true);}
    finally{button.disabled=false;}
  };
}
function datePlus(value,days){
  const date=new Date(value+"T00:00:00Z");
  date.setUTCDate(date.getUTCDate()+days);
  return date.toISOString().slice(0,10);
}
function setOptions(select,items,caption,describe){
  const previous=select.value;
  select.replaceChildren(new Option(caption,""),...items.map(item=>new Option(describe(item),item.id)));
  if(items.some(item=>item.id===previous)) select.value=previous;
}
function cell(row,tag,content){
  const element=document.createElement(tag);
  if(typeof content==="string") element.textContent=content;
  else element.append(content);
  row.append(element);
  return element;
}
function drawCalendar(){
  const days=Array.from({length:7},(_,i)=>datePlus(firstDay.value||today,i));
  const table=byId("calendar");
  table.replaceChildren();
  const heading=table.createTHead().insertRow();
  cell(heading,"th","Habitación").scope="col";
  days.forEach(day=>cell(heading,"th",shortDate.format(new Date(day))).scope="col");
  const body=table.createTBody();
  for(const room of rooms){
    const row=body.insertRow();
    cell(row,"th",room.number+" · "+room.name).scope="row";
    for(const day of days){
      const booking=reservations.find(r=>r.room_id===room.id&&r.status!=="cancelled"&&r.check_in<=day&&day<r.check_out);
      const button=document.createElement("button");
      button.type="button";
      button.className=booking?.status||"";
      button.textContent=booking?names[booking.status]:"Libre";
      button.setAttribute("aria-label",room.number+", "+day+", "+button.textContent);
      button.onclick=()=>{
        if(booking){reservationSelect.value=booking.id;drawReservation();reservationSelect.focus();return;}
        reservationForm.elements.room_id.value=room.id;
        reservationForm.elements.check_in.value=day;
        reservationForm.elements.check_out.value=datePlus(day,1);
        reservationEstimate();
        reservationForm.elements.guest_id.focus();
      };
      cell(row,"td",button);
    }
  }
}
function drawReservation(){
  const reservation=reservations.find(r=>r.id===reservationSelect.value);
  byId("reservationActions").hidden=!reservation;
  if(!reservation) return;
  const room=rooms.find(item=>item.id===reservation.room_id);
  const guest=guests.find(item=>item.id===reservation.guest_id);
  byId("stayDetails").textContent=[byId("hotelName").textContent,"Habitación "+(room?.number||""),guest?.full_name,reservation.check_in+" al "+reservation.check_out].filter(Boolean).join(" · ");
  byId("reservationStatus").textContent=names[reservation.status];
  byId("actions").replaceChildren();
  const transitions={reserved:[["Marcar ingreso","occupied"],["Cancelar reserva","cancelled"]],occupied:[["Cerrar estadía","completed"]]};
  for(const [label,status] of transitions[reservation.status]||[]){
    const button=document.createElement("button");
    button.textContent=label;
    button.className="secondary";
    button.onclick=handle(button,async()=>{
      const updated=check(await db.from("reservations").update({status}).eq("id",reservation.id).eq("status",reservation.status).select("id"));
      await refresh();
      if(!updated.length) throw new Error("La reserva cambió. Revisa el estado actualizado.");
      message("Estado actualizado.");
    });
    byId("actions").append(button);
  }
  if(reservation.status==="reserved"){
    const edit=document.createElement("button");
    edit.type="button";
    edit.className="secondary";
    edit.textContent="Editar reserva";
    edit.onclick=()=>openEdit(reservation);
    byId("actions").append(edit);
  }
  byId("printAction").hidden=reservation.status==="cancelled";
  serviceForm.hidden=!["reserved","occupied"].includes(reservation.status);
  byId("charges").replaceChildren();
  for(const charge of charges.filter(c=>c.reservation_id===reservation.id)){
    const item=document.createElement("li");
    item.textContent=services.find(s=>s.id===charge.service_id)?.name+" × "+charge.quantity+" · "+currency.format(charge.quantity*charge.unit_price);
    byId("charges").append(item);
  }
  const total=totals.find(t=>t.reservation_id===reservation.id);
  byId("total").replaceChildren();
  if(!total) return;
  const dl=document.createElement("dl");
  for(const [label,value] of [[total.nights+" noches × "+currency.format(total.nightly_rate),total.lodging_total],["Servicios",total.services_total],["Total a pagar",total.total]]){
    const dt=document.createElement("dt");
    const dd=document.createElement("dd");
    dt.textContent=label;
    dd.textContent=currency.format(value);
    dl.append(dt,dd);
  }
  byId("total").append(dl);
}
async function refresh(){
  const version=sessionVersion;
  const data=await Promise.all([
    db.from("rooms").select().order("number"), db.from("guests").select().order("full_name"),
    db.from("reservations").select().order("check_in",{ascending:false}), db.from("services").select().order("name"),
    db.from("reservation_totals").select(), db.from("reservation_services").select()
  ]);
  if(version!==sessionVersion) return;
  [rooms,guests,reservations,services,totals,charges]=data.map(check);
  setOptions(reservationForm.elements.room_id,rooms,"Seleccionar",r=>r.number+" · "+r.name);
  setOptions(reservationForm.elements.guest_id,guests,"Seleccionar",g=>g.full_name+" · "+g.document_number);
  setOptions(serviceForm.elements.service_id,services,"Seleccionar",s=>s.name+" · "+currency.format(s.price));
  setOptions(reservationSelect,reservations,"Seleccionar reserva",r=>{
    const room=rooms.find(x=>x.id===r.room_id);
    const guest=guests.find(x=>x.id===r.guest_id);
    return (room?.number||"")+" · "+(guest?.full_name||"")+" · "+r.check_in+" · "+names[r.status];
  });
  drawCalendar();
  drawReservation();
  renderLists();
  reservationEstimate();
}
function bind(form,action){form.onsubmit=handle(form.querySelector("button:not([type=button])"),()=>action(Object.fromEntries(new FormData(form))));}

const onboardingForm=byId("onboardingForm");
const accessKey="hotelerp-access";
byId("registerTitle").textContent=route==="cliente"?"Registro de clientes":"Registro de hoteles y personal";
function registrationMode(active){
  byId("loginForm").hidden=active;
  byId("registerForm").hidden=!active;
  byId(active?"registerTitle":"auth-title").setAttribute("tabindex","-1");
  byId(active?"registerTitle":"auth-title").focus();
}
byId("showRegister").onclick=()=>registrationMode(true);
byId("showLogin").onclick=()=>registrationMode(false);
bind(byId("registerForm"),async credentials=>{
  sessionStorage.setItem(accessKey,accessMode());
  const data=check(await db.auth.signUp({...credentials,options:{emailRedirectTo:redirectTo}}));
  if(!data.session) message("Revisa tu correo y confirma el enlace. Luego podrás completar tu perfil.");
});
function updateOnboarding(){
  const kind=onboardingForm.elements.kind.value;
  byId("inviteLabel").hidden=kind!=="staff";
  byId("displayNameLabel").hidden=kind!=="admin";
  onboardingForm.elements.invite_code.required=kind==="staff";
  onboardingForm.elements.display_name.required=kind==="admin";
}
onboardingForm.elements.kind.onchange=updateOnboarding;
bind(onboardingForm,async data=>{
  check(await db.rpc("hotel_finish_registration",{
    kind:data.kind,full_name:data.full_name.trim(),age:Number(data.age),gender:data.gender,dni:data.dni.trim(),
    hotel_name:data.kind==="admin"?data.display_name.trim():null,
    invite_code:data.kind==="staff"?data.invite_code.trim():null
  }));
  onboardingForm.reset();
  const session=check(await db.auth.getSession()).session;
  await showSession(session,"SIGNED_IN");
});
for(const [formId,table,label] of [["roomForm","rooms","Habitación"],["catalogForm","services","Servicio"]]){
  const form=byId(formId);
  bind(form,async data=>{
    for(const key of Object.keys(data)) data[key]=data[key].trim();
    check(await db.from(table).insert(data));
    form.reset();
    await refresh();
    message(label+" guardado.");
  });
}
byId("inviteStaff").onclick=handle(byId("inviteStaff"),async()=>{
  byId("staffCode").value=check(await db.rpc("hotel_invite_staff"));
  byId("staffCodeLabel").hidden=false;
  byId("staffCode").focus();
  byId("staffCode").select();
  message("Invitación creada. Comparte el código con el miembro del personal.");
});

bind(byId("loginForm"),async data=>{sessionStorage.setItem(accessKey,accessMode());check(await db.auth.signInWithPassword(data));byId("loginForm").reset();});
byId("togglePassword").onclick=()=>{
  const field=byId("password");
  const show=field.type==="password";
  field.type=show?"text":"password";
  byId("togglePassword").setAttribute("aria-pressed",String(show));
  byId("togglePassword").setAttribute("aria-label",show?"Ocultar contraseña":"Mostrar contraseña");
};
byId("google").onclick=handle(byId("google"),async()=>{
  const response=await fetch(supabaseUrl+"/auth/v1/settings",{
    headers:{apikey:publishableKey},signal:AbortSignal.timeout(8000)
  });
  if(!response.ok) throw new Error("No pudimos verificar el acceso con Google. Intenta de nuevo o ingresa con tu correo.");
  const settings=await response.json();
  if(settings.external?.google===false){
    message("El acceso con Google está pendiente de activación. Puedes ingresar o crear tu cuenta con correo.",true);
    return;
  }
  sessionStorage.setItem(accessKey,accessMode());
  check(await db.auth.signInWithOAuth({provider:"google",options:{redirectTo}}));
});
byId("logout").onclick=handle(byId("logout"),async()=>check(await db.auth.signOut()));
bind(guestForm,async data=>{
  for(const key of Object.keys(data)) data[key]=data[key].trim();
  if(!/^[A-Za-z0-9]{5,20}$/.test(data.document_number)) throw new Error("El documento debe tener de 5 a 20 letras o números.");
  data.document_number=data.document_number.toUpperCase();
  data.email ||= null;
  const guest=check(await db.from("guests").insert(data).select("id").single());
  guestForm.reset();
  await refresh();
  reservationForm.elements.guest_id.value=guest.id;
  message("Huésped registrado. Ya puedes crear su reserva.");
});
bind(reservationForm,async data=>{
  if(data.check_out<=data.check_in) throw new Error("La salida debe ser posterior al ingreso.");
  const booking=check(await db.from("reservations").insert(data).select("id").single());
  firstDay.value=data.check_in;
  await refresh();
  reservationSelect.value=booking.id;
  drawReservation();
  message("Reserva guardada.");
});
bind(serviceForm,async data=>{
  check(await db.from("reservation_services").insert({...data,quantity:Number(data.quantity),reservation_id:reservationSelect.value}));
  serviceForm.reset();
  await refresh();
  message("Consumo registrado y total actualizado.");
});
byId("previous").onclick=()=>{firstDay.value=datePlus(firstDay.value||today,-7);drawCalendar();};
byId("next").onclick=()=>{firstDay.value=datePlus(firstDay.value||today,7);drawCalendar();};
firstDay.onchange=drawCalendar;
reservationSelect.onchange=drawReservation;
byId("refresh").onclick=handle(byId("refresh"),async()=>{await refresh();message("Datos actualizados.");});


function renderLists(){
  renderDesk({rooms,guests,reservations,services,today,currency,names,
    guestFilter:byId("guestFilter").value,reservationFilter:byId("reservationFilter").value,
    openBooking: id=>{
      reservationSelect.value=id;
      drawReservation();
      byId("cuenta").scrollIntoView({block:"start"});
      reservationSelect.focus({preventScroll:true});
    }
  });
}
byId("guestFilter").oninput=renderLists;
byId("reservationFilter").onchange=renderLists;
function reservationEstimate(){
  const room=rooms.find(item=>item.id===reservationForm.elements.room_id.value);
  const start=reservationForm.elements.check_in.value;
  const end=reservationForm.elements.check_out.value;
  const nights=start&&end?Math.round((Date.parse(end)-Date.parse(start))/86400000):0;
  byId("reserveEstimate").textContent=room&&nights>0?nights+" "+(nights===1?"noche":"noches")+" × "+currency.format(room.nightly_rate):"";
}
reservationForm.onchange=reservationEstimate;
const editModal=byId("editDialog");
const editForm=byId("editReservation");
let editingReservation=null;
function openEdit(booking){
  editingReservation=booking;
  setOptions(editForm.elements.room_id,rooms,"Seleccionar",r=>r.number+" · "+r.name);
  setOptions(editForm.elements.guest_id,guests,"Seleccionar",g=>g.full_name);
  for(const name of ["room_id","guest_id","check_in","check_out"]) editForm.elements[name].value=booking[name];
  byId("editStatus").textContent="";
  editModal.showModal();
}
byId("closeEdit").onclick=()=>editModal.close();
bind(editForm,async data=>{
  try{
    if(data.check_out<=data.check_in) throw new Error("La salida debe ser posterior al ingreso.");
    const updated=check(await db.from("reservations").update(data).eq("id",editingReservation.id).eq("status","reserved")
      .eq("room_id",editingReservation.room_id).eq("guest_id",editingReservation.guest_id)
      .eq("check_in",editingReservation.check_in).eq("check_out",editingReservation.check_out).select("id"));
    if(!updated.length) throw new Error("La reserva cambió. Cierra la edición y actualiza el calendario.");
    firstDay.value=data.check_in;
    editModal.close();
    await refresh();
    message("Reserva actualizada.");
  }catch(error){byId("editStatus").textContent=explain(error);}
});
byId("printAction").onclick=()=>{document.body.classList.add("printing");window.print();};
window.addEventListener("afterprint",()=>document.body.classList.remove("printing"));
byId("sideLogout").onclick=handle(byId("sideLogout"),async()=>check(await db.auth.signOut()));
for(const link of document.querySelectorAll(".side-nav a")){
  link.onclick=()=>{
    document.querySelector(".side-nav [aria-current]")?.removeAttribute("aria-current");
    link.setAttribute("aria-current","location");
  };
}
const staffVoice=createVoiceAssistant({db,guestForm,byId,message,ids:{voice:"voice",read:"read",stop:"stop",ai:"staffAi"}});
const customerVoice=createVoiceAssistant({db,guestForm:byId("customerBookingForm"),byId,message,ids:{voice:"customerVoice",read:"customerRead",stop:"customerStop",ai:"customerAi"}});
const stopVoice=()=>{staffVoice.stop();customerVoice.stop();};
const portal=createPublicPortal({db,byId,check,bind,message,currency,names,today,route});
byId("resetPassword").onclick=handle(byId("resetPassword"),async()=>{
  const field=byId("loginForm").elements.email;
  if(!field.reportValidity()) return;
  check(await db.auth.resetPasswordForEmail(field.value,{redirectTo}));
  message("Si tu correo tiene una cuenta, recibirás instrucciones para restablecer la contraseña.");
});
bind(byId("onlineBookingForm"),async ()=>{
  check(await db.rpc("hotel_set_online_booking",{enabled:byId("onlineBookingForm").elements.enabled.checked}));
  message("Disponibilidad pública actualizada.");
});
let recoveryOpen=false;
bind(byId("recoveryForm"),async data=>{
  check(await db.auth.updateUser(data));
  byId("recoveryForm").reset();
  recoveryOpen=false;
  await showSession(check(await db.auth.getSession()).session,"SIGNED_IN");
  message("Contraseña actualizada.");
});

async function showSession(session,event,version=++sessionVersion){
  try{
    if(version!==sessionVersion) return;
    if(recoveryOpen&&event!=="SIGNED_OUT"&&event!=="PASSWORD_RECOVERY") return;
    stopVoice();
    for(const id of ["workspace","customerArea","onboarding","login","recoveryPanel"]) byId(id).hidden=true;
    byId("logout").hidden=!session;
    byId("staffCode").value="";
    byId("staffCodeLabel").hidden=true;
    byId("landing").hidden=route!=="inicio";
    byId("chooseAccess").hidden=route!=="seleccionar";
    if(event==="PASSWORD_RECOVERY"){
      recoveryOpen=true;
      byId("landing").hidden=true;
      byId("chooseAccess").hidden=true;
      byId("recoveryPanel").hidden=false;
      return;
    }
    if(route==="inicio"||route==="seleccionar") return;
    byId("auth-title").textContent=route==="cliente"?"Acceso del cliente":"Acceso del personal";
    if(!session){
      recoveryOpen=false;
      const showLogin=route!=="cliente"||routeParams.has("ingresar");
      byId("login").hidden=!showLogin;
      byId("customerArea").hidden=showLogin;
      portal.show(null);
      if(event==="SIGNED_OUT") message("Sesión cerrada.");
      return;
    }
    const [profile,customer,account]=await Promise.all([
      db.from("profiles").select("role,hotel_id,hotels(name,accepts_online_booking)").eq("id",session.user.id).maybeSingle(),
      db.from("customers").select("full_name").eq("id",session.user.id).maybeSingle(),
      db.from("account_details").select("age,dni").eq("id",session.user.id).maybeSingle()
    ]).then(results=>results.map(check));
    if(version!==sessionVersion) return;
    if(route==="personal"&&profile){
      byId("hotelName").textContent=profile.hotels?.name||"";
      byId("staffRole").textContent=profile.role==="admin"?"Perfil: administrador":"Perfil: personal de recepción";
      byId("adminPanel").hidden=profile.role!=="admin";
      byId("onlineBookingForm").elements.enabled.checked=Boolean(profile.hotels?.accepts_online_booking);
      await refresh();
      if(version!==sessionVersion) return;
      byId("workspace").hidden=false;
    }else if(route==="cliente"&&customer){
      byId("customerName").textContent=customer.full_name;
      byId("customerEmail").textContent=session.user.email||"";
      byId("customerAge").textContent=account?String(account.age):"";
      byId("customerDni").textContent=account?"••••••"+account.dni.slice(-2):"";
      for(const field of ["ageTitle","customerAge","dniTitle","customerDni"]) byId(field).hidden=!account;
      byId("customerArea").hidden=false;
      portal.show({...customer,email:session.user.email});
    }else if(profile||customer){
      message("Esta cuenta pertenece a otro tipo de acceso. Selecciona el portal correspondiente o cierra la sesión.",true);
      byId("chooseAccess").hidden=false;
      return;
    }else{
      const kind=onboardingForm.elements.kind;
      for(const option of kind.options) option.hidden=route==="cliente"?option.value!=="customer":option.value==="customer";
      kind.value=route==="cliente"?"customer":"staff";
      updateOnboarding();
      onboardingForm.elements.verified_email.value=session.user.email||"";
      byId("onboarding").hidden=false;
      message("Completa tu perfil para continuar.");
      kind.focus();
      return;
    }
    message("Sesión iniciada.");
  }catch(error){if(version===sessionVersion)message(explain(error),true);}
}
db.auth.onAuthStateChange((event,session)=>{
  if(!["INITIAL_SESSION","SIGNED_IN","SIGNED_OUT","PASSWORD_RECOVERY"].includes(event)) return;
  const version=++sessionVersion;
  setTimeout(()=>showSession(session,event,version),0);
});
