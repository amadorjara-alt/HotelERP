# HotelERP

Mini-ERP acadÃ©mico para el Caso 3 de Sistemas de InformaciÃ³n. El proyecto de Supabase ya tiene la migraciÃ³n inicial y el catÃ¡logo ficticio.

## Puesta en marcha

1. Sube `index.html` a la raÃ­z de `amadorjara-alt/HotelERP` y publica desde la raÃ­z de `main` en GitHub Pages.
2. En Supabase Auth, registra la URL del sitio `https://amadorjara-alt.github.io/HotelERP/` como Site URL y redirecciÃ³n permitida.
3. Para Google, habilita el proveedor en Supabase y configura un cliente OAuth web en Google Auth Platform con origen `https://amadorjara-alt.github.io` y callback `https://ynnulzfgsfkojvgbhgua.supabase.co/auth/v1/callback`. Configura el secreto Ãºnicamente en el panel de Supabase.
4. Tras el primer acceso, un administrador debe insertar un perfil `receptionist` o `admin` con el UUID de la cuenta autorizado en `auth.users`. La alternativa por correo y contraseÃ±a usa cuentas creadas en Supabase Auth.

## DemostraciÃ³n

Usa nombres y documentos ficticios. Reserva 204 durante tres noches. Agrega una lavanderÃ­a y un desayuno y observa el total de S/ 520. Intenta crear otra reserva cruzada para ver el mensaje de error. Repite el registro de un huÃ©sped mediante dictado en un navegador con Web Speech API y comprueba el recorrido con un lector de pantalla.

La prueba SQL confirmÃ³ el total, la restricciÃ³n de no superposiciÃ³n y el control de acceso RLS. El inicio de sesiÃ³n con Google y la experiencia de micrÃ³fono y lector de pantalla requieren verificaciÃ³n en el sitio publicado.

