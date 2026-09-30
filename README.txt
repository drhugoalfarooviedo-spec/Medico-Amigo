MÉDICO AMIGO v1.0.1 — CORRECCIONES

Incluye:
- Interfaz móvil separada de escritorio: una pantalla a la vez y formularios adaptables.
- Edición completa del paciente, incluido contacto de emergencia y antecedentes clínicos.
- Acceso a consulta guardada y edición del mismo registro (PATCH; no duplica consulta).
- Ver/editar/regenerar receta asociada desde historial.
- Receta independiente sin crear una nueva consulta.
- Firma privada convertida a imagen embebida para mayor compatibilidad en documentos móviles.
- Historia clínica deja de descargarse como .html: abre documento imprimible/guardable como PDF.
- Tratamiento/receta visible al abrir una consulta del historial.
- PWA actualizada a caché v1.0.1.

No requiere SQL nuevo y no modifica las políticas RLS existentes.

PRUEBAS RECOMENDADAS:
1) Android/iPhone: editar paciente.
2) Abrir consulta antigua > Editar consulta > guardar.
3) Abrir consulta antigua > Ver/editar receta > reimprimir.
4) Generar receta independiente.
5) Ver historia clínica y Guardar/Compartir como PDF.
6) Confirmar firma en receta.
7) Cambiar Hugo/Omar y confirmar aislamiento.
