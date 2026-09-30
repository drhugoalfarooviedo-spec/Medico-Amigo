MÉDICO AMIGO v1.0.2 — RECETA + HISTORIA CLÍNICA

Correcciones sobre v1.0.1:
- Historia clínica rediseñada en formato A4 más ordenado y profesional.
- Omite bloques vacíos innecesarios en vez de repetir “No registrado”.
- Cada consulta consulta su receta asociada por consultation_id.
- La historia clínica muestra medicamentos, presentación, dosis, vía, frecuencia,
  duración, instrucciones e indicaciones generales de la receta.
- Apertura reforzada de “Rx RECETA” desde la ficha del paciente.
- Mantiene edición de consulta, edición de paciente, PWA y aislamiento por médico.
- Cache PWA actualizado a v1.0.2.

No requiere SQL nuevo ni cambios en RLS.

Después de subir los 8 archivos:
1. Esperar el deployment.
2. Cerrar por completo la PWA.
3. Abrir nuevamente.
4. Probar Rx RECETA desde la ficha.
5. Abrir una historia clínica de una consulta que ya tenga receta y verificar tratamiento.
