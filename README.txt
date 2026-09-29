MÉDICO AMIGO v1.0 ESTABLE — PWA INSTALABLE

Base clínica:
- Derivada directamente de v1.5.3 (dashboard definitivo).
- Mantiene aislamiento Hugo/Omar, Supabase, RLS, pacientes, consultas,
  recetas, cobros, firmas y edición/eliminación.

PWA:
- manifest.json
- sw.js
- icon-192.png
- icon-512.png
- modo standalone
- instalación desde Chrome/Edge
- service worker con estrategia network-first
- Supabase/Auth/API NO se almacenan en caché
- cada nueva publicación intenta buscar la versión más reciente

ARCHIVOS A SUBIR A GITHUB:
1. index.html
2. styles.css
3. app.js
4. README.txt
5. manifest.json
6. sw.js
7. icon-192.png
8. icon-512.png

INSTALACIÓN:
Después del deployment, abrir Médico Amigo en Chrome/Edge.
Usar el icono de instalación de la barra de direcciones o
Menú > Instalar Médico Amigo / Instalar aplicación.

No requiere SQL adicional.
