# HotelERP · Mini-ERP para hoteles en Perú

HotelERP es una aplicación académica para la operación diaria de recepción de un hotel peruano. Es el **Caso 3 de Sistemas de Información**. La interfaz está en español, el calendario usa la zona horaria de Lima y los importes se muestran en soles peruanos (PEN).

- **Aplicación web:** [Abrir HotelERP](https://amadorjara-alt.github.io/HotelERP/)
- **Repositorio:** [Código en GitHub](https://github.com/amadorjara-alt/HotelERP)
- **Documento técnico:** [Google Docs](https://docs.google.com/document/d/1-vH_95P3sX0SCpoaMc2h4i511bz1YJVyL-2edw-fce0/edit)
- **Presentación:** [Google Slides](https://docs.google.com/presentation/d/1BW6JLi7ELmSbfEwjXilAoTM2G3T0m40gV7CIah1fnHI/edit)

## Qué es un ERP y a quién le sirve

ERP significa *Enterprise Resource Planning* o planificación de recursos empresariales. En HotelERP, un **mini-ERP** reúne operaciones que comparten los mismos datos: la habitación reservada cambia la disponibilidad del calendario, el huésped registrado queda asociado a la reserva y los consumos de esa reserva se suman a la liquidación.

Está dirigido a hoteles pequeños y a sus equipos de recepción en Perú. Los administradores crean un hotel y preparan su catálogo. El personal gestiona la operación diaria. Los clientes pueden registrar y consultar su propio perfil.

## Alcance

| Módulo | Qué permite hacer |
| --- | --- |
| Calendario | Ver siete noches por habitación, navegar entre semanas y seleccionar una fecha libre o una reserva. |
| Reservas | Crear reservas y gestionar ingreso, cancelación y cierre. PostgreSQL rechaza los cruces para la misma habitación. |
| Huéspedes | Capturar nombre y documento mediante teclado o dictado en español. La lectura en voz alta permite revisar, corregir y confirmar antes de guardar. |
| Estancias y servicios | Registrar consumos y calcular alojamiento, servicios y total con las tarifas guardadas. |
| Administración | Crear un hotel, agregar habitaciones y servicios y generar invitaciones para el personal. |
| Portal de clientes | Crear una cuenta de cliente y consultar el nombre y correo propios. |

El alcance del portal de clientes se limita al perfil. El flujo de reservas y liquidaciones corresponde al personal del hotel.

## Inicio de sesión y registro

**Autenticación** verifica quién inicia sesión. La gestiona Supabase Auth. **Autorización** determina qué datos y acciones corresponden a cada cuenta. PostgreSQL la aplica mediante políticas de seguridad por fila (RLS).

1. Elige **Trabajo en un hotel** o **Soy cliente** en la pantalla de acceso.
2. Para una cuenta nueva, elige **Crear cuenta**, ingresa correo y contraseña y confirma el correo cuando Supabase lo solicite. El botón de Google usa OAuth y requiere activar el proveedor en Supabase.
3. Completa el perfil. **Administrador** crea un hotel. **Personal** ingresa el código de un administrador. **Cliente** guarda su nombre y accede a su portal.
4. Cada invitación permite unir una cuenta a un hotel. Se consume al usarla y caduca en 24 horas.

El perfil almacenado determina el acceso. La opción elegida en la pantalla solo ayuda a escoger el tipo de registro. Cada cuenta tiene un perfil y cada miembro del personal pertenece a un hotel. Las referencias de la base de datos también impiden asociar habitaciones, huéspedes y servicios de otro hotel.

## Archivos del proyecto

| Archivo | Función |
| --- | --- |
| [`index.html`](index.html) | Estructura semántica del acceso, registro, portal de clientes y panel de recepción. |
| [`styles.css`](styles.css) | Estilos adaptables, iconos, formularios, foco visible y colores con etiquetas para el calendario. |
| [`app.js`](app.js) | Autenticación, control de vistas y formularios, calendario, reservas, consumos, liquidación y Web Speech API. |
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

1. Entra como administrador, agrega la habitación 204 a S/ 150 por noche y registra lavandería a S/ 30 y desayuno a S/ 40.
2. Registra a un huésped ficticio mediante voz, corrige un dato después de escucharlo y confirma.
3. Reserva tres noches. Intenta crear otra reserva que se cruce para ver el error. Una reserva contigua puede comenzar el día de la salida.
4. Agrega los dos consumos a la reserva original. La liquidación debe mostrar **S/ 450 + S/ 70 = S/ 520**.
5. Crea un cliente e inicia sesión para comprobar que su portal muestra su propio perfil.
