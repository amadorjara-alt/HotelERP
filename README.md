# HotelERP

Mini-ERP académico para el Caso 3 de Sistemas de Información. El proyecto de Supabase ya tiene la migración inicial y el catálogo ficticio.

## Puesta en marcha

1. Sube `index.html` a la raíz de `amadorjara-alt/HotelERP` y publica desde la raíz de `main` en GitHub Pages.
2. En Supabase Auth, registra la URL del sitio `https://amadorjara-alt.github.io/HotelERP/` como Site URL y redirección permitida.
3. Para Google, habilita el proveedor en Supabase y configura un cliente OAuth web en Google Auth Platform con origen `https://amadorjara-alt.github.io` y callback `https://ynnulzfgsfkojvgbhgua.supabase.co/auth/v1/callback`. Configura el secreto únicamente en el panel de Supabase.
4. Tras el primer acceso, un administrador debe insertar un perfil `receptionist` o `admin` con el UUID de la cuenta autorizado en `auth.users`. La alternativa por correo y contraseña usa cuentas creadas en Supabase Auth.

## Demostración

Usa nombres y documentos ficticios. Reserva 204 durante tres noches. Agrega una lavandería y un desayuno y observa el total de S/ 520. Intenta crear otra reserva cruzada para ver el mensaje de error. Repite el registro de un huésped mediante dictado en un navegador con Web Speech API y comprueba el recorrido con un lector de pantalla.

La prueba SQL confirmó el total, la restricción de no superposición y el control de acceso RLS. El inicio de sesión con Google y la experiencia de micrófono y lector de pantalla requieren verificación en el sitio publicado.

