MÉDICO AMIGO v1.3 — RECETA + COBRO

Flujo:
Paciente → Consulta (Supabase) → Receta / Omitir receta → Cobro → Finalizar.

NUEVO:
- La consulta recién guardada conserva su ID real.
- Recetas se guardan en prescriptions.
- Medicamentos se guardan en prescription_items.
- Se puede OMITIR RECETA.
- Cobros se guardan en payments.
- La firma se carga desde Configuración a un bucket PRIVADO de Supabase.
- La firma NO se guarda en GitHub.
- Los datos profesionales se obtienen de doctor_profiles.

ANTES DE USAR ESTA VERSIÓN:
Ejecutar en Supabase el SQL de seguridad/storage suministrado junto con el ZIP.
Después, entrar con Dr. Hugo → Configuración → seleccionar la foto de firma una sola vez.

Datos previstos para Dr. Hugo:
Dr. Hugo Alfaro Oviedo
Medicina General
Matrícula profesional A-4833274
