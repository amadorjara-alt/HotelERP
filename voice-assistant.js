export function createVoiceAssistant({db,guestForm,byId,message,ids}){
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
  listen(prompt, async answer => {
    let command = voiceCommand(answer);
    const supported=["guardar","confirmar","detener","corregir nombre","corregir documento","corregir correo","corregir correo electronico"];
    if(!supported.includes(command)&&byId(ids.ai).checked){
      try{
        const {data,error}=await db.functions.invoke("process-voice",{body:{text:answer.slice(0,160)}});
        if(!error&&data?.intent&&data.intent!=="confirmar") command=data.intent;
      }catch{/* Repeat a supported command or use the form. */}
      if(version!==voiceVersion) return;
    }
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

byId(ids.voice).onclick = () => {
  stopVoice();
  if (!Recognition || !window.speechSynthesis) {
    message("El registro por voz requiere un navegador compatible. Puedes usar teclado y lector de pantalla.", true);
    return;
  }
  const version=voiceVersion;
  speak("Bienvenido a HotelERP. Vamos a registrar tus datos.",()=>{if(version===voiceVersion) collectVoiceFields(0,version);});
};
byId(ids.read).onclick = () => {
  stopVoice();
  const summary = readback();
  speak(summary);
  message(summary);
};
byId(ids.stop).onclick = () => {
  stopVoice();
  message("Registro por voz detenido.");
};


return {stop:stopVoice};
}
