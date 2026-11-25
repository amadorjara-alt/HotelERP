# HotelERP · Mini-ERP para hoteles en Perú

HotelERP es una aplicación académica para la operación diaria de recepción de un hotel peruano. Es el **Caso 3 de Sistemas de Información**. La interfaz está en español, el calendario usa la zona horaria de Lima y los importes se muestran en soles peruanos (PEN).

- **Aplicación web:** [Abrir HotelERP](https://amadorjara-alt.github.io/HotelERP/)
- **Repositorio:** [Código en GitHub](https://github.com/amadorjara-alt/HotelERP)
- **Documento técnico:** [Google Docs](https://docs.google.com/document/d/1-vH_95P3sX0SCpoaMc2h4i511bz1YJVyL-2edw-fce0/edit)
- **Presentación:** [Google Slides](https://canva.link/u6ceiwtc5pacz9q)

## Qué es un ERP y a quién le sirve

ERP significa *Enterprise Resource Planning* o planificación de recursos empresariales. En HotelERP, un **mini-ERP** reúne operaciones que comparten los mismos datos: la habitación reservada cambia la disponibilidad del calendario, el huésped registrado queda asociado a la reserva y los consumos de esa reserva se suman a la liquidación.

Está dirigido a hoteles pequeños y a sus equipos de recepción en Perú. Los administradores crean un hotel y preparan su catálogo. El personal gestiona la operación diaria. Los clientes pueden consultar disponibilidad, reservar y revisar sus propias estadías.

## Alcance

| Módulo | Qué permite hacer |
| --- | --- |
| Calendario | Ver siete noches por habitación, navegar entre semanas y seleccionar una fecha libre o una reserva. |
| Reservas | Crear reservas y gestionar ingreso, cancelación y cierre. PostgreSQL rechaza los cruces para la misma habitación. |
| Huéspedes | Capturar nombre, documento y correo opcional con teclado o dictado en español. El sistema lee los tres campos y permite corregir cada uno antes de guardar. |
| Estancias y servicios | Registrar consumos y calcular alojamiento, servicios y total con las tarifas guardadas. |
| Administración | Crear un hotel, agregar habitaciones y servicios y generar invitaciones para el personal. |
| Portal de clientes | Explorar el catálogo, reservar con una cuenta de cliente y consultar sus propias estadías. |

La liquidación y los consumos se gestionan en recepción. **Disponibles hoy** usa la misma regla que el calendario: el ingreso cuenta, la salida queda fuera y una reserva finalizada sigue bloqueando las fechas que abarca. El cliente puede consultar los importes de sus propias estadías.

## Inicio de sesión y registro

**Autenticación** verifica quién inicia sesión. La gestiona Supabase Auth. **Autorización** determina qué datos y acciones corresponden a cada cuenta. PostgreSQL la aplica mediante políticas de seguridad por fila (RLS).

1. Desde la portada, pulsa **Comenzar** y elige **Soy cliente** o **Soy personal del hotel**.
2. Para una cuenta nueva, elige **Crear cuenta**, ingresa correo y contraseña y confirma el correo cuando Supabase lo solicite. El botón de Google usa OAuth y requiere activar el proveedor en Supabase.
3. Completa la ficha privada con nombre, edad, sexo y DNI. **Administrador** crea un hotel. **Personal** ingresa el código de un administrador. **Cliente** accede al catálogo y a sus propias reservas.
4. Cada invitación permite unir una cuenta a un hotel. Se consume al usarla y caduca en 24 horas.

El perfil almacenado determina el acceso. La opción elegida en la pantalla solo ayuda a escoger el tipo de registro. Cada cuenta tiene un perfil y cada miembro del personal pertenece a un hotel. Las referencias de la base de datos también impiden asociar habitaciones, huéspedes y servicios de otro hotel.

## Archivos del proyecto

| Archivo | Función |
| --- | --- |
| [`index.html`](index.html) | Estructura semántica del acceso, registro, portal de clientes y panel de recepción. |
| [`styles.css`](styles.css) | Estilos adaptables, iconos, formularios, foco visible y colores con etiquetas para el calendario. |
| [`app.js`](app.js) | Autenticación, control de vistas y formularios, calendario, reservas, consumos y liquidación. |
| [Migración inicial](supabase/migrations/202611200001_hotel_erp_initial_schema.sql) | Tablas operativas, RLS, restricción de exclusión de fechas, tarifas históricas y vista de liquidación. |
| [Migración de hoteles y clientes](supabase/migrations/202611200002_hotel_tenants_and_customer_registration.sql) | Hoteles, perfiles de clientes, invitaciones y aislamiento de datos por hotel. |

## Arquitectura y desarrollo

El navegador carga HTML, CSS y JavaScript desde GitHub Pages. Supabase Auth establece la sesión, la Data API ejecuta operaciones y PostgreSQL aplica RLS y las validaciones. La Web Speech API del navegador realiza reconocimiento y síntesis de voz. Para probar el dictado, usa un navegador compatible y permite el micrófono durante la demostración.

Para desarrollo, sirve la raíz del repositorio con un servidor HTTP local. Aplica las migraciones en orden en un proyecto nuevo de Supabase y ajusta la URL y la clave **publicable** en `app.js`. Configura en Supabase Auth el sitio y las redirecciones permitidas. Los secretos OAuth se guardan en Supabase.

- [Supabase Auth con Google](https://supabase.com/docs/guides/auth/social-sign-in/auth-google)
- [Seguridad por fila en Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [Foto del vestíbulo por Tim Photoguy en Unsplash](https://unsplash.com/photos/empty-hotel-lobby-FPS7a7XQZ0w)

## Guion de demostración

1. Usa la cuenta administradora de **Rodolfo** o **Hotel Demo ERP** y carga [HotelERP_seed.sql](HotelERP_seed.sql) en el SQL Editor después de aplicar las migraciones. El catálogo del hotel de prueba queda publicado.
2. En **Registrar huésped**, dicta nombre, documento y correo. Al oír el resumen, di «corregir correo», dicta el reemplazo, comprueba el nuevo resumen y di «guardar».
3. Reserva tres noches libres en **DEMO-105**. Intenta otra reserva que se cruce y comprueba el mensaje. Una reserva contigua puede empezar el día de la salida.
4. Registra dos **Demo Desayuno** y una **Demo Lavandería**. Con las tarifas del seed, la liquidación esperada es **S/ 1 170 + S/ 95 = S/ 1 265**.
5. Desde otra sesión, reserva como cliente con un documento ficticio nuevo y abre **Mis reservas**. Actualiza el calendario de recepción y verifica que aparezca la misma reserva.

La [guía de sustentación](HotelERP_Diagramas_y_Sustentacion.md) incluye los cuatro diagramas y los pasos detallados de la demostración.

## Portales y reservas por Internet

La URL raíz abre la presentación pública. **Comenzar** lleva a la selección de cliente o personal. El modo cliente permite explorar el catálogo, consultar fechas y reservar con una cuenta de cliente. En **Configuración**, un administrador puede publicar el catálogo de su hotel. El seed publica el hotel de ensayo seleccionado. El portal envía la reserva a `hotel_customer_book`, que crea o reutiliza el vínculo en `customer_guest_links` y registra la reserva que también se ve en recepción. Las fotografías son ilustrativas y los precios se leen de Supabase.

| Archivo nuevo | Responsabilidad |
| --- | --- |
| [hotel-ui.js](hotel-ui.js) | Tarjetas públicas, disponibilidad por fechas, portal de clientes, indicadores y tablas de recepción. |
| [voice-assistant.js](voice-assistant.js) | Reconocimiento y lectura en español, normalización del documento y correo, y corrección de los tres campos antes de confirmar. Comparte el flujo en recepción y en el portal. |
| [process-voice](supabase/functions/process-voice/index.js) | Interpreta comandos opcionales con Gemini. Verifica la sesión y el perfil antes de invocar al proveedor. |
| [sandbox-checkout](supabase/functions/sandbox-checkout/index.js) | Verifica la titularidad y el total de la estadía cerrada para Stripe y PayPal de prueba. |
| [Guía de diagramas y sustentación](HotelERP_Diagramas_y_Sustentacion.md) | Diagramas Mermaid, lógica empresarial y preguntas técnicas. |
| [Datos de muestra](HotelERP_seed.sql) | Registros ficticios para una demostración controlada. |

El dashboard permite editar reservas pendientes. PostgreSQL aplica la restricción de exclusión en inserciones y modificaciones, valida las transiciones de estado y bloquea consumos después del cierre. La liquidación se imprime desde su detalle.

### Configurar Supabase y la IA

1. Crea un proyecto, aplica los archivos de [migraciones](supabase/migrations) en orden y configura la URL y la clave publicable en `app.js`.
2. En Auth, configura la URL del sitio y permite los retornos de cliente y personal, por ejemplo `https://amadorjara-alt.github.io/HotelERP/**`. Comprueba la entrega del correo de confirmación y recuperación. Habilita Google OAuth si deseas utilizar el botón de Google.
3. Despliega `process-voice` con verificación JWT. En los secretos de Edge Functions guarda `GEMINI_API_KEY` y, si corresponde, `GEMINI_MODEL`. La clave privada se configura en Supabase. El registro manual y los comandos explícitos usan el formulario y Web Speech aunque no se configure Gemini.
4. Sirve el directorio raíz con `python -m http.server 8000` y abre `http://localhost:8000/`. Para publicar, configura GitHub Pages desde la raíz de `main`.
5. Crea un hotel de prueba, registra habitaciones y servicios, activa la publicación del catálogo y conserva el acceso de administrador. En otra sesión, accede como cliente y crea una reserva. Regresa al panel del hotel para comprobar su aparición, intentar un cruce, registrar consumos e imprimir la liquidación.

El formulario solicita autorización para enviar a Gemini instrucciones de corrección. Las transcripciones de nombre, documento y correo se rellenan mediante el reconocimiento del navegador. La confirmación para guardar requiere una acción explícita del huésped.

Fotografías de ejemplo: [Lisa Anna](https://www.pexels.com/photo/bed-in-a-hotel-room-19889107/), [Roshan Patel](https://www.pexels.com/photo/hotel-room-with-a-bed-20653866/) y [Alexandru Cojanu](https://www.pexels.com/photo/a-bed-in-a-hotel-room-19425327/).

## Privacidad, verificación y APIs

- [Aviso de privacidad](https://amadorjara-alt.github.io/HotelERP/privacidad.html) describe los datos, el uso de micrófono y las opciones de contacto.
- [Ayuda e integraciones](https://amadorjara-alt.github.io/HotelERP/integraciones.html) incluye un conversor referencial PEN/USD/EUR con la API de Frankfurter. La conversión se calcula en el navegador y la liquidación se mantiene en PEN.
- `account_details` separa nombre, edad, sexo y DNI de los perfiles operativos. RLS limita la lectura al titular. La función de registro guarda la ficha y asigna el perfil en una sola transacción.
- Para habilitar Google, crea un cliente OAuth web en Google Auth Platform. Usa `https://amadorjara-alt.github.io` como origen autorizado y `https://ynnulzfgsfkojvgbhgua.supabase.co/auth/v1/callback` como callback. Coloca el ID y secreto del cliente directamente en el proveedor Google del proyecto Supabase. Los retornos del portal cliente y del acceso del personal están en la lista de redirecciones autorizadas.

### Pagos de prueba con tarjeta y PayPal

[Pagos de prueba](https://amadorjara-alt.github.io/HotelERP/pagos.html) muestra únicamente estadías cerradas del cliente autenticado.
La Edge Function `sandbox-checkout` comprueba la propiedad y lee el importe de Supabase. Stripe Checkout usa PEN. PayPal Sandbox usa USD con cotización de referencia mostrada antes de continuar.
Para probar, configura `STRIPE_TEST_SECRET_KEY` o `PAYPAL_SANDBOX_CLIENT_ID` y `PAYPAL_SANDBOX_CLIENT_SECRET` en Supabase, y usa cuentas o medios de pago de prueba. El botón **Verificar pago de prueba** consulta al proveedor y solo registra la confirmación si coinciden el identificador, la moneda y el importe. El sistema usa un flujo por estadía para evitar duplicados.
El modo de prueba requiere una cuenta de comercio válida para configurar cada proveedor. Para producción, revisa elegibilidad, conciliación por webhooks, reintentos, devoluciones y requisitos del comercio.
