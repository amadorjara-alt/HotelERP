"use strict";
const db = supabase.createClient("https://ynnulzfgsfkojvgbhgua.supabase.co", "sb_publishable_mZFB2d_rNKfUal18HRA6iQ_6JZ_xTL-");
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
const redirectTo = new URL("./",location.href).href;
let rooms=[], guests=[], reservations=[], services=[], totals=[], charges=[];
let sessionVersion=0;
function message(text,error=false){
  const status=byId("status");status.textContent=text;status.setAttribute("role",error?"alert":"status");status.setAttribute("aria-live",error?"assertive":"polite");status.setAttribute("aria-atomic","true");
  byId("status").classList.toggle("error",error);
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
}
function bind(form,action){form.onsubmit=handle(form.querySelector("button:not([type=button])"),()=>action(Object.fromEntries(new FormData(form))));}

const onboardingForm=byId("onboardingForm");
const accessKey="hotelerp-access";
const accessMode=()=>document.querySelector('#accessMode input:checked').value;
const previousAccess=sessionStorage.getItem(accessKey);
if(previousAccess==="customer") document.querySelector('#accessMode input[value="customer"]').checked=true;
function registrationTitle(){
  byId("registerTitle").textContent=accessMode()==="customer"?"Registro de clientes":"Registro de hoteles y personal";
}
byId("accessMode").onchange=()=>{
  sessionStorage.setItem(accessKey,accessMode());
  registrationTitle();
};
registrationTitle();
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
  const staff=kind==="staff";
  byId("inviteLabel").hidden=!staff;
  byId("displayNameLabel").hidden=staff;
  onboardingForm.elements.invite_code.required=staff;
  onboardingForm.elements.display_name.required=!staff;
  onboardingForm.elements.display_name.maxLength=kind==="admin"?100:120;
  byId("displayNameText").textContent=kind==="admin"?"Nombre del hotel":"Nombre completo";
}
onboardingForm.elements.kind.onchange=updateOnboarding;
bind(onboardingForm,async data=>{
  check(await db.rpc("hotel_onboard",{kind:data.kind,display_name:data.kind==="staff"?null:data.display_name.trim(),invite_code:data.kind==="staff"?data.invite_code.trim():null}));
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
byId("google").onclick=handle(byId("google"),async()=>{sessionStorage.setItem(accessKey,accessMode());check(await db.auth.signInWithOAuth({provider:"google",options:{redirectTo}}));});
byId("logout").onclick=handle(byId("logout"),async()=>check(await db.auth.signOut()));
bind(guestForm,async data=>{
  for(const key of Object.keys(data)) data[key]=data[key].trim();
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

const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognizer = null;
let activeUtterance = null;
let voiceVersion = 0;

function stopVoice() {
  voiceVersion++;
  const previousRecognizer = recognizer;
  recognizer = null;
  activeUtterance = null;
  previousRecognizer?.abort();
  window.speechSynthesis?.cancel();
}

function speak(text, next) {
  if (!window.speechSynthesis) {
    next?.();
    return;
  }
  const utterance = new SpeechSynthesisUtterance(text);
  activeUtterance = utterance;
  utterance.lang = "es-PE";
  utterance.onend = () => {
    if (activeUtterance !== utterance) return;
    activeUtterance = null;
    next?.();
  };
  utterance.onerror = event => {
    if (activeUtterance !== utterance) return;
    activeUtterance = null;
    if (!["canceled", "interrupted"].includes(event.error)) {
      message("La lectura en voz alta no está disponible. Puedes escribir los datos.", true);
    }
  };
  window.speechSynthesis.speak(utterance);
}

function listen(prompt, onResult, version) {
  if (version !== voiceVersion) return;
  message(prompt);
  speak(prompt, () => {
    if (version !== voiceVersion) return;
    const speech = new Recognition();
    recognizer = speech;
    speech.lang = "es-PE";
    speech.continuous = false;
    speech.interimResults = false;
    let transcript = "";
    let recognitionError = "";

    speech.onresult = event => {
      if (version !== voiceVersion || recognizer !== speech) return;
      const result = event.results[event.resultIndex];
      if (result?.isFinal) transcript = result[0].transcript.trim();
    };
    speech.onerror = event => {
      if (version === voiceVersion && recognizer === speech) recognitionError = event.error;
    };
    speech.onend = () => {
      if (version !== voiceVersion || recognizer !== speech) return;
      recognizer = null;
      // Wait for the microphone session to close before advancing the dialogue.
      if (transcript && !recognitionError) {
        onResult(transcript);
      } else {
        const detail = recognitionError ? " (" + recognitionError + ")" : "";
        message("No se pudo reconocer la voz" + detail + ". Puedes reintentar o escribir los datos.", true);
      }
    };
    try {
      speech.start();
    } catch (error) {
      recognizer = null;
      message(explain(error), true);
    }
  });
}

function plainVoiceText(text) {
  return text.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").trim();
}

function voiceCommand(text) {
  return plainVoiceText(text).replace(/[¿?¡!.,;:]/g, "").replace(/\s+/g, " ").trim();
}

function normalizeSpokenEmail(text) {
  const compact = plainVoiceText(text)
    .replace(/[.,!?]+$/, "")
    .replace(/\bguion[\s-]+bajo\b/g, "_")
    .replace(/\bguion\b/g, "-")
    .replace(/\b(?:arroba|at)\b/g, "@")
    .replace(/\bpunto\b/g, ".")
    .replace(/,/g, ".")
    .replace(/\s+/g, "");
  return compact.replace(/@(gmail|hotmail|outlook)$/, "@$1.com");
}

function normalizeSpokenDocument(text) {
  const digits = {
    cero: "0", uno: "1", dos: "2", tres: "3", cuatro: "4",
    cinco: "5", seis: "6", siete: "7", ocho: "8", nueve: "9"
  };
  return plainVoiceText(text)
    .replace(/\b(cero|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve)\b/g, word => digits[word])
    .replace(/[\s.,!?\p{Dash_Punctuation}−]+/gu, "")
    .toUpperCase();
}

const spokenFields = [
  {
    key: "full_name",
    initial: "Por favor, indica tu nombre completo.",
    correction: "Indique el nuevo nombre.",
    retry: "No escuché un nombre válido. Indique su nombre completo.",
    parse: answer => answer.trim(),
    valid: value => /\p{L}/u.test(value)
  },
  {
    key: "document_number",
    initial: "Indica tu documento. Puedes decir los dígitos uno por uno.",
    correction: "Indique el nuevo documento.",
    retry: "No reconocí el documento. Indique nuevamente sus números o letras.",
    parse: normalizeSpokenDocument,
    valid: value => /^[A-Z0-9]+$/.test(value)
  },
  {
    key: "email",
    initial: "Indica tu correo electrónico. Puedes decir arroba y punto, o decir sin correo.",
    correction: "Indique el nuevo correo electrónico. También puede decir sin correo.",
    retry: "No reconocí un correo válido. Diga arroba y punto, o diga sin correo.",
    parse: normalizeSpokenEmail,
    valid: (value, field) => Boolean(value) && !field.validity.typeMismatch
  }
];

function readback() {
  const fields = guestForm.elements;
  return "Nombre: " + (fields.full_name.value || "pendiente") +
    ". Documento: " + (fields.document_number.value || "pendiente") +
    ". Correo: " + (fields.email.value || "sin correo") + ".";
}

function captureVoiceField(step, prompt, next, version) {
  const field = guestForm.elements[step.key];
  listen(prompt, answer => {
    const command = voiceCommand(answer);
    if (command === "detener") {
      stopVoice();
      message("Registro por voz detenido.");
      return;
    }
    if (step.key === "email" && ["sin correo", "omitir correo", "no tengo correo", "sin correo electronico"].includes(command)) {
      field.value = "";
      next();
      return;
    }
    const value = step.parse(answer);
    field.value = value;
    if ((field.maxLength >= 0 && value.length > field.maxLength) || !step.valid(value, field)) {
      field.value = "";
      captureVoiceField(step, step.retry, next, version);
      return;
    }
    next();
  }, version);
}

function review(version, intro = "") {
  const prompt = intro + readback() + " Di guardar, corregir nombre, corregir documento, corregir correo o detener.";
  listen(prompt, answer => {
    const command = voiceCommand(answer);
    if (command === "guardar" || command === "confirmar") {
      stopVoice();
      guestForm.requestSubmit();
      return;
    }
    if (command === "detener") {
      stopVoice();
      message("Registro por voz detenido.");
      return;
    }
    const correction = ["corregir nombre", "corregir documento", "corregir correo"];
    const index = correction.indexOf(command === "corregir correo electronico" ? "corregir correo" : command);
    if (index === -1) {
      review(version, "No reconocí el comando. ");
      return;
    }
    const step = spokenFields[index];
    guestForm.elements[step.key].value = "";
    captureVoiceField(step, step.correction, () => review(version), version);
  }, version);
}

function collectVoiceFields(index, version) {
  if (index === spokenFields.length) {
    review(version);
    return;
  }
  const step = spokenFields[index];
  captureVoiceField(step, step.initial, () => collectVoiceFields(index + 1, version), version);
}

byId("voice").onclick = () => {
  stopVoice();
  if (!Recognition || !window.speechSynthesis) {
    message("El registro por voz requiere un navegador compatible. Puedes usar teclado y lector de pantalla.", true);
    return;
  }
  collectVoiceFields(0, voiceVersion);
};
byId("read").onclick = () => {
  stopVoice();
  const summary = readback();
  speak(summary);
  message(summary);
};
byId("stop").onclick = () => {
  stopVoice();
  message("Registro por voz detenido.");
};

async function showSession(session,event,version=++sessionVersion){
  try{
    if(version!==sessionVersion) return;
    byId("workspace").hidden=true;
    byId("customerArea").hidden=true;
    byId("onboarding").hidden=true;
    byId("logout").hidden=!session;
    byId("login").hidden=!!session;
    byId("staffCode").value="";
    byId("staffCodeLabel").hidden=true;
    stopVoice();
    if(!session){if(event==="SIGNED_OUT") message("Sesión cerrada.");return;}
    const [profile,customer]=await Promise.all([
      db.from("profiles").select("role,hotel_id,hotels(name)").eq("id",session.user.id).maybeSingle(),
      db.from("customers").select("full_name").eq("id",session.user.id).maybeSingle()
    ]).then(results=>results.map(check));
    if(version!==sessionVersion) return;
    if(profile){
      byId("hotelName").textContent=profile.hotels?.name||"";
      byId("adminPanel").hidden=profile.role!=="admin";
      await refresh();
      if(version!==sessionVersion) return;
      byId("workspace").hidden=false;
    }else if(customer){
      byId("customerName").textContent=customer.full_name;
      byId("customerEmail").textContent=session.user.email||"";
      byId("customerArea").hidden=false;
    }else{
      onboardingForm.elements.kind.value=sessionStorage.getItem(accessKey)==="customer"?"customer":"staff";
      updateOnboarding();
      byId("onboarding").hidden=false;
      message("Elige el perfil con el que vas a usar HotelERP.");
      onboardingForm.elements.kind.focus();
      return;
    }
    message("Sesión iniciada.");
  }catch(error){if(version===sessionVersion)message(explain(error),true);}
}
db.auth.onAuthStateChange((event,session)=>{
  if(!["INITIAL_SESSION","SIGNED_IN","SIGNED_OUT"].includes(event)) return;
  const version=++sessionVersion;
  setTimeout(()=>showSession(session,event,version),0);
});
