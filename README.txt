MÉDICO AMIGO v1.0.5 — NUEVA RECETA DIRECTA

Cambio específico:
Inicio > Nueva receta > Seleccionar paciente > Formulario de receta.

- Elimina el aviso que decía que había que entrar manualmente a la ficha.
- Al pulsar Nueva receta se abre Pacientes en modo selección.
- Al tocar el paciente se abre directamente el formulario Rx.
- La receta queda marcada como independiente (consultation_id = NULL).
- No crea una consulta ni un cobro.
- El botón Rx RECETA de la ficha utiliza el mismo flujo.
- Conserva las correcciones de navegación de v1.0.4.
- Conserva la Historia Clínica mejorada.

REQUISITO:
La migración de v1.0.4 (DROP NOT NULL de prescriptions.consultation_id)
debe estar aplicada. Si ya mostró Success, NO volver a ejecutarla.

PRUEBA:
1. Inicio > Nueva receta.
2. Debe aparecer Pacientes sin alerta.
3. Tocar William Alfaro.
4. Debe abrir inmediatamente el formulario de receta.
5. Completar medicamento > Guardar y continuar.
6. Confirmar que no aumenta el número de consultas.
