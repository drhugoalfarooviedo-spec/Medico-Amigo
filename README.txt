MÉDICO AMIGO v1.0.8 — MÓDULO DE RECETAS LIMPIO

Esta versión corrige la causa observada en el video, no agrega otro parche encima.

SE RETIRÓ:
- El manejador antiguo de "Nueva receta" que enviaba a Pacientes.
- El módulo v1.0.5 que competía con el selector nuevo.
- La dependencia de una consulta activa para recetas independientes.

RECETA INDEPENDIENTE:
Inicio > Nueva receta > selector flotante > paciente > receta > Guardar.
- consultation_id = NULL
- no crea consulta
- no crea cobro
- guarda prescriptions
- guarda prescription_items
- abre el documento profesional al terminar

DOCUMENTO PROFESIONAL:
La ventana del PDF se reserva antes de esperar a Supabase para evitar que
Chrome/Safari la bloqueen como popup después del guardado.
Conserva datos del médico, matrícula, teléfono, paciente, código, medicamentos,
pauta, indicaciones y firma configurada.

RECETA VINCULADA A CONSULTA:
Sigue usando el flujo clínico normal y conserva consultation_id.

VOLVER:
Desde una receta independiente vuelve a Inicio, no a Consulta.

No requiere SQL nuevo. La migración consultation_id nullable ya aplicada se conserva.
