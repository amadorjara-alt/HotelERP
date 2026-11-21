<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>HotelERP · Recepción</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&amp;family=Instrument+Serif&amp;display=swap" rel="stylesheet"><meta name="theme-color" content="#fbfaf7"><style>
:root{--ink:#172b2a;--muted:#52645f;--green:#174b43;--dark:#0e302b;--paper:#fbfaf7;--surface:#fff;--line:#dfe6de;--gold:#efd5a3;--field:#9baaa4;color-scheme:light}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.5 "DM Sans",system-ui,sans-serif}
[hidden]{display:none!important}
header{width:min(100% - 48px,1280px);margin:auto;display:flex;justify-content:space-between;align-items:center;min-height:82px;gap:14px;border-bottom:1px solid var(--line)}
.brand{display:inline-flex;gap:11px;align-items:center;font-size:1.31rem;font-weight:800;letter-spacing:-.045em;color:var(--dark)}
.brand em{font-style:normal;color:#326b60}
.mark,.module-icon{display:inline-grid;place-items:center;flex:none;border-radius:12px;width:42px;height:42px;background:var(--dark);color:var(--gold)}
svg{width:20px;height:20px;flex:none;vertical-align:middle}
.mark svg{width:25px;height:25px}
main{width:min(100% - 48px,1280px);margin:0 auto;padding-bottom:44px}
h1,h2,p{margin-top:0}
h1,h2{line-height:1.08}
#status{display:none;color:#174b43;font-weight:650;padding:12px 16px;margin:16px 0 0;background:#e9f3ec;border:1px solid #cde2d4;border-radius:12px}
#status:not(:empty){display:block}
#status.error{color:#82271f;background:#fff0eb;border-color:#edc7bd}
#login{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);align-items:stretch;margin:28px 0;min-height:620px;border:1px solid var(--line);border-radius:26px;overflow:hidden;background:var(--surface);box-shadow:0 18px 55px #142a2310}
.auth-visual{position:relative;overflow:hidden;display:grid;align-content:end;isolation:isolate;min-height:100%;background:var(--dark);color:#fff;padding:clamp(24px,4.5vw,58px)}
.auth-visual img,.auth-visual::after{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.auth-visual img{z-index:-2;object-position:50% 48%}
.auth-visual::after{content:"";z-index:-1;background:linear-gradient(180deg,#0e242715 8%,#12272448 38%,#0b211dea 100%)}
.visual-bell{border:1px solid #fff6;background:#142f2b99;color:var(--gold);margin-bottom:18px}
.auth-visual h2{font:400 clamp(2.5rem,5vw,4.4rem)/.99 "Instrument Serif",Georgia,serif;letter-spacing:-.01em;margin:0 0 15px;max-width:11ch}
.auth-visual p{color:#f2f3ed;margin:0 0 20px}
.photo-credit{color:#fff;font-size:.8rem;text-underline-offset:3px;width:fit-content}
.auth-card{margin:auto;width:min(100%,490px);padding:clamp(24px,5vw,59px)}
.auth-card h1{font:400 clamp(2.4rem,4.5vw,3.7rem)/.98 "Instrument Serif",Georgia,serif;letter-spacing:-.025em;margin:0 0 14px}
.auth-card>p{color:var(--muted);margin-bottom:26px}
.auth-label{display:inline-flex;gap:8px;align-items:center;color:#305d52;font-weight:750;font-size:.875rem;margin-bottom:14px}
label{display:grid;gap:6px;font-weight:680;font-size:.92rem;min-width:0}
input,select,button{font:inherit;border:1px solid var(--field);border-radius:10px;padding:10px 13px;min-width:0;min-height:44px}
input,select{background:white;color:var(--ink);width:100%}
button{cursor:pointer;background:var(--green);color:white;border-color:var(--green);font-weight:700}
button:hover{background:#103c34}
button.secondary,.google-button{background:#fff;color:var(--dark);border-color:var(--field)}
button.secondary:hover,.google-button:hover{background:#edf4ee}
button:disabled{opacity:.62;cursor:wait}
:focus-visible{outline:3px solid #a45925;outline-offset:3px}
form,.controls{display:flex;flex-wrap:wrap;gap:12px;align-items:end}
#login form{display:grid;gap:16px}
.google-button{width:100%;display:flex;align-items:center;justify-content:center;gap:11px}
.auth-divider{display:flex;align-items:center;gap:12px;margin:20px 0;color:var(--muted);font-size:.86rem}
.auth-divider::before,.auth-divider::after{content:"";height:1px;background:var(--line);flex:1}
.password{position:relative}
.password input{padding-right:52px}
.password button{position:absolute;right:4px;top:3px;background:transparent;border:0;color:var(--dark);min-height:38px;padding:6px 11px}
.password button:hover{background:#edf4ee}
#workspace{margin-top:22px}
.desk-head{background:var(--dark);border-radius:20px;color:white;padding:25px 28px;margin-bottom:18px;display:flex;align-items:center;gap:15px}
.desk-head h1{font:400 clamp(2.1rem,4vw,3.5rem)/1 "Instrument Serif",Georgia,serif;margin:0}
.desk-head .mark{background:#24554a;width:48px;height:48px}
nav{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 18px}
nav a{display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:8px 13px;color:var(--dark);background:#fff;border:1px solid var(--line);border-radius:10px;text-decoration:none;font-weight:700}
nav a:hover{background:#e7f1e8}
#workspace section{padding:clamp(16px,2.5vw,26px);background:white;border:1px solid var(--line);border-radius:18px;margin-bottom:18px;box-shadow:0 5px 18px #172b2a07;scroll-margin-top:12px}
#workspace h2{display:flex;align-items:center;gap:10px;font-size:1.22rem;margin-bottom:16px}
.module-icon{background:#e9f2eb;color:var(--green);border-radius:9px;width:34px;height:34px}
#registro>p{color:var(--muted)}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,390px),1fr));gap:18px}
.grid form>label{flex:1 1 155px}
.grid form>.controls{width:100%}
#voice{display:inline-flex;align-items:center;gap:7px}
.legend{padding:0;display:flex;flex-wrap:wrap;gap:10px 16px;margin:14px 0 0;list-style:none;font-size:.88rem;color:var(--muted)}
.legend li{display:flex;align-items:center;gap:6px}
.legend i{display:inline-block;width:12px;height:12px;border:1px solid #70867b;border-radius:4px;background:#e7f5e9}
.legend .reserved i{background:#ffedc4}
.legend .occupied i{background:#d6e9fb}
.legend .completed i{background:#eeebf4}
.table{overflow:auto;margin-top:12px;border:1px solid var(--line);border-radius:12px}
table{border-collapse:collapse;width:100%}
th,td{padding:8px;border-bottom:1px solid var(--line);text-align:left;white-space:nowrap}
thead th{background:#f2f5ef;color:#354d44;text-transform:capitalize;font-size:.875rem}
tbody tr:last-child>*{border-bottom:0}
#calendar button{width:100%;font-size:.875rem;padding:6px 8px;min-width:82px;color:#164133;background:#e7f5e9;border-color:#c5e0ca}
#calendar .reserved{background:#ffedc4;color:#5d3b0b;border-color:#e0c498}
#calendar .occupied{background:#d6e9fb;color:#174064;border-color:#b5d5ee}
#calendar .completed{background:#eeebf4;color:#4a4262;border-color:#d6cfe4}
#calendar button:hover{border-color:currentColor}
#selectedReservation{max-width:520px}
#reservationStatus{margin:14px 0;font-weight:700}
#total dl{display:grid;grid-template-columns:1fr auto;gap:10px 20px;background:#edf4ee;border-radius:14px;padding:16px;max-width:560px}
#total dl>:nth-last-child(-n+2){border-top:1px solid #b6cfbd;padding-top:10px;font-weight:800}
dd{margin:0;text-align:right}
hr{border:0;border-top:1px solid var(--line);margin:18px 0}
@media(max-width:740px){header,main{width:calc(100% - 28px)}header{min-height:65px}#login{grid-template-columns:1fr;margin-top:15px;min-height:0;border-radius:18px}.auth-visual{min-height:240px;padding:20px}.auth-visual h2{max-width:none;margin-bottom:8px}.auth-visual p{display:none}.visual-bell{margin-bottom:10px}.auth-card{padding:26px 20px 30px}.desk-head{padding:18px}.grid{gap:0}}
</style></head><body><header><strong class="brand"><span class="mark"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M5 21V8l7-5 7 5v13M9 21v-5h6v5M9 9h.01m6 0h.01M9 12h.01m6 0h.01"/></svg></span><span>Hotel<em>ERP</em></span></strong><button id="logout" class="secondary" hidden>Cerrar sesión</button></header>
<main><p id="status" role="status" aria-live="polite"></p>
<div id="login">
  <aside class="auth-visual" aria-label="Recepción hotelera">
    <img src="https://images.unsplash.com/photo-1560662105-57f8ad6ae2d1?auto=format&amp;fit=crop&amp;w=1500&amp;q=82" alt="Vestíbulo de hotel con mostrador de recepción y sala de espera" fetchpriority="high">
    <span class="mark visual-bell"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17h18M5 17v-2a7 7 0 0 1 14 0v2M12 5v3M10.5 5h3M4 20h16"/></svg></span>
    <h2>Tu hotel, desde recepción.</h2>
    <p>Habitaciones, huéspedes y estadías en un solo lugar.</p>
    <a class="photo-credit" href="https://unsplash.com/photos/empty-hotel-lobby-FPS7a7XQZ0w" target="_blank" rel="noopener noreferrer">Foto de Tim Photoguy en Unsplash</a>
  </aside>
  <section class="auth-card" aria-labelledby="auth-title">
    <div class="auth-label"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M15.5 14a5.5 5.5 0 1 1 4-1.7L15 17h-3v3H8v-4l5.7-5.7m3.8-3.8h.01"/></svg> Acceso del personal</div>
    <h1 id="auth-title">Bienvenido a HotelERP</h1>
    <p>Inicia sesión para gestionar la operación del hotel.</p>
    <button id="google" class="google-button" type="button"><svg aria-hidden="true" viewBox="0 0 48 48"><path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.8 6.1-15Z"/><path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.8l-6.6-5.1c-1.8 1.2-4.1 2-6.9 2-5.3 0-9.8-3.6-11.4-8.4H5.8v5.3A20 20 0 0 0 24 44Z"/><path fill="#FBBC05" d="M12.6 27.7a12 12 0 0 1 0-7.4V15H5.8a20 20 0 0 0 0 18l6.8-5.3Z"/><path fill="#EA4335" d="M24 11.9c3 0 5.7 1 7.8 3.1l5.8-5.8C34.1 6 29.5 4 24 4A20 20 0 0 0 5.8 15l6.8 5.3c1.6-4.8 6.1-8.4 11.4-8.4Z"/></svg> Continuar con Google</button>
    <div class="auth-divider">o con tu correo</div>
    <form id="loginForm">
      <label>Correo electrónico<input name="email" type="email" autocomplete="username" required></label>
      <label for="password">Contraseña</label>
      <div class="password"><input id="password" name="password" type="password" autocomplete="current-password" required>
        <button id="togglePassword" type="button" aria-label="Mostrar contraseña" aria-pressed="false"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/></svg></button>
      </div>
      <button type="submit">Iniciar sesión</button>
    </form>
  </section>
</div>
<div id="workspace" hidden><div class="desk-head"><span class="mark"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17h18M5 17v-2a7 7 0 0 1 14 0v2M12 5v3M10.5 5h3M4 20h16"/></svg></span><h1>Panel de recepción</h1></div><nav aria-label="Módulos"><a href="#agenda"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4m-5 3h18m-13 5h2m4 0h2"/></svg> Calendario</a><a href="#registro"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="7.5" r="3.5"/><path d="M5 21v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v2"/></svg> Huéspedes</a><a href="#reserva"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M15.5 14a5.5 5.5 0 1 1 4-1.7L15 17h-3v3H8v-4l5.7-5.7m3.8-3.8h.01"/></svg> Reservas</a><a href="#cuenta"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3l3 2 3-2 3 2 3-2v18l-3-2-3 2-3-2-3 2V3zm3 6h6m-6 4h6"/></svg> Liquidación</a></nav>
<section id="agenda"><h2><span class="module-icon"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-8m18 8v-5a2 2 0 0 0-2-2H3m0 5h18M5 11V7h14v4M9 7v4m6-4v4"/></svg></span>Calendario de habitaciones</h2><div class="controls"><button id="previous" class="secondary">Semana anterior</button><label>Desde <input id="firstDay" type="date"></label><button id="next" class="secondary">Semana siguiente</button><button id="refresh" class="secondary">Actualizar</button></div><ul class="legend" aria-label="Estados de ocupación"><li><i aria-hidden="true"></i>Libre</li><li class="reserved"><i aria-hidden="true"></i>Reservada</li><li class="occupied"><i aria-hidden="true"></i>Ocupada</li><li class="completed"><i aria-hidden="true"></i>Finalizada</li></ul><div class="table" tabindex="0" aria-label="Calendario desplazable"><table id="calendar" aria-label="Ocupación por noche"></table></div></section>
<div class="grid"><section id="registro"><h2><span class="module-icon"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="7.5" r="3.5"/><path d="M5 21v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v2"/></svg></span>Registrar huésped</h2><p>Revisa y confirma los datos antes de guardar.</p><form id="guestForm"><label>Nombre completo<input name="full_name" autocomplete="name" required maxlength="120"></label><label>Documento<input name="document_number" required maxlength="40"></label><label>Correo (opcional)<input name="email" type="email" maxlength="120"></label><div class="controls"><button type="button" id="voice" class="secondary"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M6 10v2a6 6 0 0 0 12 0v-2m-6 8v3m-3 0h6"/></svg> Iniciar registro por voz</button><button type="button" id="read" class="secondary">Leer datos</button><button type="button" id="stop" class="secondary">Detener voz</button><button>Confirmar y guardar</button></div></form></section>
<section id="reserva"><h2><span class="module-icon"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M15.5 14a5.5 5.5 0 1 1 4-1.7L15 17h-3v3H8v-4l5.7-5.7m3.8-3.8h.01"/></svg></span>Nueva reserva</h2><form id="reservationForm"><label>Habitación<select name="room_id" required></select></label><label>Huésped<select name="guest_id" required></select></label><label>Ingreso<input name="check_in" type="date" required></label><label>Salida<input name="check_out" type="date" required></label><button>Guardar reserva</button></form></section></div>
<section id="cuenta"><h2><span class="module-icon"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3l3 2 3-2 3 2 3-2v18l-3-2-3 2-3-2-3 2V3zm3 6h6m-6 4h6"/></svg></span>Reservas y liquidación</h2><label>Reserva<select id="selectedReservation"></select></label><div id="reservationActions" hidden><p id="reservationStatus"></p><div class="controls" id="actions"></div><hr><form id="serviceForm"><label>Servicio<select name="service_id" required></select></label><label>Cantidad<input name="quantity" type="number" min="1" max="1000" value="1" required></label><button>Registrar consumo</button></form><ul id="charges"></ul><div id="total"></div></div></section></div></main>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script><script>
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
  byId("status").textContent=text;
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
bind(byId("loginForm"),async data=>{check(await db.auth.signInWithPassword(data));byId("loginForm").reset();});
byId("togglePassword").onclick=()=>{
  const field=byId("password");
  const show=field.type==="password";
  field.type=show?"text":"password";
  byId("togglePassword").setAttribute("aria-pressed",String(show));
  byId("togglePassword").setAttribute("aria-label",show?"Ocultar contraseña":"Mostrar contraseña");
};
byId("google").onclick=handle(byId("google"),async()=>check(await db.auth.signInWithOAuth({provider:"google",options:{redirectTo}})));
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

const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
let recognizer;
let voiceVersion=0;
function stopVoice(){
  voiceVersion++;
  recognizer?.abort();
  recognizer=null;
  window.speechSynthesis?.cancel();
}
function speak(text,next){
  if(!window.speechSynthesis){next?.();return;}
  const utterance=new SpeechSynthesisUtterance(text);
  utterance.lang="es-PE";
  utterance.onend=next||null;
  utterance.onerror=event=>{
    if(!["canceled","interrupted"].includes(event.error)) message("La lectura en voz alta no está disponible.",true);
  };
  window.speechSynthesis.speak(utterance);
}
function listen(prompt,onResult,version){
  if(version!==voiceVersion) return;
  message(prompt);
  speak(prompt,()=>{
    if(version!==voiceVersion) return;
    const speech=new Recognition();
    recognizer=speech;
    speech.lang="es-PE";
    speech.onresult=event=>{
      if(version===voiceVersion) onResult(event.results[0][0].transcript.trim());
    };
    speech.onerror=event=>{
      if(version===voiceVersion) message("No se pudo reconocer la voz ("+event.error+"). Puedes reintentar o escribir los datos.",true);
    };
    try{speech.start();}catch(error){message(explain(error),true);}
  });
}
function readback(){
  const fields=guestForm.elements;
  return "Nombre: "+(fields.full_name.value||"pendiente")+". Documento: "+(fields.document_number.value||"pendiente")+". Correo: "+(fields.email.value||"sin correo")+".";
}
function review(version){
  listen(readback()+" Di confirmar, corregir nombre, corregir documento o detener.",answer=>{
    const command=answer.toLowerCase().replace(/[.!?]/g,"").trim();
    if(command==="confirmar"){guestForm.requestSubmit();return;}
    if(command==="corregir nombre"){nameStep(version,true);return;}
    if(command==="corregir documento"){documentStep(version);return;}
    if(command!=="detener") message("Comando no reconocido. Revisa los campos y usa Confirmar y guardar.",true);
  },version);
}
function documentStep(version){
  listen("Indica el número de documento, dígito por dígito.",answer=>{
    const digits={cero:"0",uno:"1",dos:"2",tres:"3",cuatro:"4",cinco:"5",seis:"6",siete:"7",ocho:"8",nueve:"9"};
    const normalized=answer.toLowerCase().replace(/[.,]/g,"").split(/\s+/).map(word=>digits[word]??word).join("");
    guestForm.elements.document_number.value=normalized;
    review(version);
  },version);
}
function nameStep(version,correction=false){
  listen("Por favor, indica tu nombre completo.",answer=>{
    guestForm.elements.full_name.value=answer;
    if(correction) review(version);
    else documentStep(version);
  },version);
}
byId("voice").onclick=()=>{
  stopVoice();
  if(!Recognition||!window.speechSynthesis){message("El registro por voz requiere un navegador compatible. Puedes usar teclado y lector de pantalla.",true);return;}
  nameStep(voiceVersion);
};
byId("read").onclick=()=>{stopVoice();speak(readback());message(readback());};
byId("stop").onclick=()=>{stopVoice();message("Registro por voz detenido.");};
db.auth.onAuthStateChange((event,session)=>{
  if(!["INITIAL_SESSION","SIGNED_IN","SIGNED_OUT"].includes(event)) return;
  const version=++sessionVersion;
  setTimeout(async()=>{
    try{
      if(version!==sessionVersion) return;
      byId("workspace").hidden=true;
      byId("logout").hidden=!session;
      byId("login").hidden=!!session;
      stopVoice();
      if(!session){if(event==="SIGNED_OUT") message("Sesión cerrada.");return;}
      const profile=check(await db.from("profiles").select("role").eq("id",session.user.id).maybeSingle());
      if(version!==sessionVersion) return;
      if(!profile){message("Tu cuenta inició sesión. Pide al administrador que active tu perfil de personal.",true);return;}
      await refresh();
      if(version===sessionVersion){byId("workspace").hidden=false;message("Sesión iniciada.");}
    }catch(error){if(version===sessionVersion)message(explain(error),true);}
  },0);
});
</script></body></html>
