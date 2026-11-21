const byId=id=>document.getElementById(id);
const make=(tag,value)=>{
  const node=document.createElement(tag);
  if(value!==undefined) node.textContent=value;
  return node;
};
const photos=["19889107","20653866","19425327"];
const storeKey="hotelerp-booking-draft";

function fillTable(id,caption,headers,data){
  const container=byId(id);
  container.replaceChildren();
  if(!data.length){container.append(make("p","Sin registros para mostrar."));return;}
  const table=make("table");
  table.setAttribute("aria-label",caption);
  const headings=table.createTHead().insertRow();
  for(const header of headers){const th=make("th",header);th.scope="col";headings.append(th);}
  const body=table.createTBody();
  for(const record of data){
    const row=body.insertRow();
    for(const value of record){
      const cell=row.insertCell();
      if(value instanceof Node) cell.append(value); else cell.textContent=value??"";
    }
  }
  container.append(table);
}

export function renderDesk({rooms,guests,reservations,services,today,currency,names,guestFilter,reservationFilter,openBooking}){
  const active=reservations.filter(r=>r.status==="reserved"||r.status==="occupied");
  const tonight=active.filter(r=>r.check_in<=today&&today<r.check_out);
  const occupied=tonight.filter(r=>r.status==="occupied").length;
  const metrics=[
    ["Habitaciones",rooms.length],["Disponibles hoy",Math.max(0,rooms.length-tonight.length)],
    ["Ocupadas hoy",occupied],["Reservas activas",active.length],
    ["Llegadas programadas",active.filter(r=>r.check_in===today&&r.status==="reserved").length],
    ["Salidas programadas",active.filter(r=>r.check_out===today).length]
  ];
  byId("metrics").replaceChildren(...metrics.map(([label,count])=>{
    const card=make("div");card.className="metric";card.append(make("strong",count),make("span",label));return card;
  }));
  const progress=make("progress");
  progress.max=Math.max(1,rooms.length);
  progress.value=occupied;
  progress.setAttribute("aria-label","Habitaciones ocupadas hoy");
  byId("occupancyMetric").replaceChildren(make("p",occupied+" de "+rooms.length+" habitaciones ocupadas hoy"),progress);
  fillTable("roomInventory","Habitaciones",["Número","Tipo","Capacidad","Tarifa por noche"],
    rooms.map(r=>[r.number,r.name,r.capacity,currency.format(r.nightly_rate)]));
  const q=guestFilter.trim().toLocaleLowerCase("es");
  fillTable("guestList","Huéspedes",["Nombre","Documento","Correo"],
    guests.filter(g=>(g.full_name+" "+g.document_number).toLocaleLowerCase("es").includes(q)).map(g=>[g.full_name,g.document_number,g.email]));
  fillTable("serviceInventory","Servicios",["Servicio","Precio"],services.map(s=>[s.name,currency.format(s.price)]));
  const roomMap=new Map(rooms.map(r=>[r.id,r.number]));
  const guestMap=new Map(guests.map(g=>[g.id,g.full_name]));
  fillTable("reservationList","Reservas del hotel",["Habitación","Huésped","Ingreso","Salida","Estado","Detalle"],
    reservations.filter(r=>!reservationFilter||r.status===reservationFilter).map(r=>{
      const button=make("button","Ver reserva");button.type="button";button.className="secondary";button.onclick=()=>openBooking(r.id);
      return [roomMap.get(r.room_id),guestMap.get(r.guest_id),r.check_in,r.check_out,names[r.status],button];
    }));
}

export function createPublicPortal({db,byId,check,bind,message,currency,names,today,route}){
  let identity=null;
  let version=0;
  let selected=null;
  let queryVersion=0;
  const availability=byId("availabilityForm");
  const form=byId("customerBookingForm");
  availability.elements.arrival.min=today;
  availability.elements.departure.min=today;
  byId("privacyOpen").onclick=()=>byId("privacyDialog").showModal();

  async function catalog(dates={}){
    const [rooms,hotels]=await Promise.all([
      db.rpc("hotel_public_catalog",dates),db.rpc("hotel_public_room_names")
    ]).then(results=>results.map(check));
    const namesByRoom=new Map(hotels.map(r=>[r.id,r.hotel_name]));
    return rooms.map(room=>({...room,hotel:namesByRoom.get(room.id)||"Hotel"}));
  }
  function details(room){
    byId("roomDialogTitle").textContent=room.name+" · "+room.number;
    byId("roomDialogDetails").textContent=room.hotel+" · Capacidad: "+room.capacity+" · "+currency.format(room.nightly_rate)+" por noche. Imagen ilustrativa.";
    byId("roomDialogBook").hidden=route==="cliente";
    byId("roomDialog").showModal();
  }
  function cards(container,rooms,dates){
    container.replaceChildren();
    if(!rooms.length){container.append(make("p","No hay habitaciones publicadas."));return;}
    for(const [index,room] of rooms.entries()){
      const card=make("article");
      const photo=make("img"); photo.alt="";photo.loading="lazy";photo.width=420;photo.height=230;
      const code=photos[index%photos.length];
      photo.src="https://images.pexels.com/photos/"+code+"/pexels-photo-"+code+".jpeg?auto=compress&cs=tinysrgb&w=700";
      const body=make("div");body.className="room-card-body";
      body.append(make("h3",room.name+" · "+room.number),make("p",room.hotel),
        make("p",room.capacity+" "+(room.capacity===1?"persona":"personas")+" · "+currency.format(room.nightly_rate)+" por noche"));
      const controls=make("div");controls.className="controls";
      const button=make("button","Ver detalles");button.type="button";button.className="secondary";button.onclick=()=>details(room);
      controls.append(button);
      if(dates){
        if(room.available){
          const reserve=make("button","Reservar");reserve.type="button";reserve.onclick=()=>begin(room,dates);
          controls.append(reserve);
        }else controls.append(make("span","No disponible"));
      }
      body.append(controls);card.append(photo,body);container.append(card);
    }
  }
  function begin(room,dates){
    selected={room,...dates};
    sessionStorage.setItem(storeKey,JSON.stringify({room:room.id,...dates}));
    if(!identity){
      location.href="?acceso=cliente&ingresar=1";
      return;
    }
    if(!form.elements.full_name.value) form.elements.full_name.value=identity.full_name;
    if(!form.elements.email.value) form.elements.email.value=identity.email||"";
    byId("bookingSummary").textContent=room.hotel+" · Habitación "+room.number+" · "+dates.arrival+" al "+dates.departure+" · "+currency.format(room.nightly_rate)+" por noche";
    byId("customerBooking").hidden=false;
    form.elements.full_name.focus();
  }
  async function stays(expectedVersion){
    const records=check(await db.rpc("hotel_customer_stays"));
    if(expectedVersion!==version) return;
    const container=byId("customerStays");
    container.replaceChildren();
    if(!records.length){container.append(make("p","Todavía no tienes reservas."));return;}
    for(const stay of records){
      const article=make("article");article.className="stay-card";
      article.append(make("h3","Habitación "+stay.room),make("p",stay.check_in+" al "+stay.check_out+" · "+names[stay.status]));
      if(stay.total!==null){
        const details=make("details");
        details.append(make("summary","Ver detalle de la estadía"),
          make("p",stay.nights+" noches × "+currency.format(stay.nightly_rate)),
          make("p","Alojamiento "+currency.format(stay.lodging_total)+" · Servicios "+currency.format(stay.services_total)),
          make("strong","Total "+currency.format(stay.total)));
        article.append(details);
        if(stay.status==="completed"&&Number(stay.total)>0){
          const payment=make("a","Consultar pago de prueba");
          payment.href="./pagos.html?reserva="+encodeURIComponent(stay.id);
          article.append(payment);
        }
      }
      container.append(article);
    }
  }
  bind(availability,async dates=>{
    if(dates.arrival<today||dates.departure<=dates.arrival||Date.parse(dates.departure)-Date.parse(dates.arrival)>90*86400000){
      throw new Error("Selecciona una fecha de ingreso válida y una estadía de 1 a 90 noches.");
    }
    const request=++queryVersion;
    selected=null;
    byId("customerBooking").hidden=true;
    const rooms=await catalog(dates);
    if(request!==queryVersion) return;
    cards(byId("portalRooms"),rooms,dates);
    message("Disponibilidad actualizada.");
  });
  bind(form,async data=>{
    if(!identity||!selected) throw new Error("Selecciona una habitación y las fechas de tu estadía.");
    const booking=selected;
    check(await db.rpc("hotel_customer_book",{room:booking.room.id,arrival:booking.arrival,departure:booking.departure,
      guest_name:data.full_name.trim(),document:data.document_number.trim().toUpperCase(),guest_email:data.email.trim()||null}));
    sessionStorage.removeItem(storeKey);
    selected=null;
    form.reset();
    byId("customerBooking").hidden=true;
    try {
      const dates={arrival:booking.arrival,departure:booking.departure};
      await stays(version);
      cards(byId("portalRooms"),await catalog(dates),dates);
      message("Reserva confirmada. Puedes consultarla en Mis reservas.");
    } catch {
      message("Tu reserva se confirmó. Recarga la página para ver el detalle.");
    }
    byId("mis-reservas").scrollIntoView({block:"start"});
  });
  if(route==="inicio") catalog().then(rooms=>cards(byId("landingRooms"),rooms)).catch(()=>byId("landingRooms").replaceChildren(make("p","No se pudo cargar el catálogo. Actualiza la página.")));
  async function show(customer){
    if(route!=="cliente") return;
    identity=customer;
    const own=++version;
    queryVersion++;
    selected=null;
    byId("customerBooking").hidden=true;
    byId("customerGreeting").textContent=customer?"Bienvenido, "+customer.full_name+".":"Consulta disponibilidad y selecciona tu habitación.";
    byId("customerSignInHint").hidden=!!customer;
    byId("mi-perfil").hidden=!customer;
    byId("profileLink").hidden=!customer;
    byId("customerStays").replaceChildren();
    try{
      let draft=null;
      if(customer){
        try{draft=JSON.parse(sessionStorage.getItem(storeKey));}catch{/* No valid local draft. */}
        await stays(own);
      }
      const dates=draft?{arrival:draft.arrival,departure:draft.departure}:null;
      const request=queryVersion;
      const rooms=await catalog(dates||{});
      if(own!==version||request!==queryVersion) return;
      cards(byId("portalRooms"),rooms,dates);
      const chosen=rooms.find(r=>r.id===draft?.room&&r.available);
      if(chosen){
        availability.elements.arrival.value=dates.arrival;
        availability.elements.departure.value=dates.departure;
        begin(chosen,dates);
      }
    }catch{if(own===version)message("No se pudo cargar el portal. Actualiza la página para volver a intentar.",true);}
  }
  return {show};
}
