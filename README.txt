MÉDICO AMIGO v1.0.12 — SESIÓN AUTOMÁTICA

Corrige el error: JWT expired.

La aplicación ahora:
- revisa si el token está próximo a vencer;
- renueva la sesión mediante el refresh_token de Supabase;
- actualiza la sesión guardada;
- revisa la sesión al volver a la app;
- revisa periódicamente mientras permanece abierta;
- si una petición REST/Storage recibe JWT expired, renueva y reintenta una vez;
- si el refresh_token tampoco es válido, pide iniciar sesión nuevamente.

También se fuerza una sesión vigente antes de registrar un paciente rápido
y antes de guardar una receta independiente.

No cambia la base de datos, RLS, historia clínica, consultas ni cobros.
No requiere SQL.
