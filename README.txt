MÉDICO AMIGO v1.0.6 — RECETA FINAL

Correcciones:
1. NUEVA RECETA ya no reutiliza las pantallas antiguas de pacientes.
   - Abre un selector propio.
   - Buscar por nombre, CI o teléfono.
   - Tocar al paciente abre directamente la receta.
   - Ya no debe mandar a Nuevo paciente.

2. DOCUMENTO DE RECETA
   - Después de guardar ya no usa el documento básico de emergencia.
   - Abre el generador profesional ya existente de Médico Amigo.
   - Ese generador incluye datos del médico, matrícula, teléfono, firma configurada,
     paciente, fecha, código, diagnóstico, medicamento, presentación, dosis, vía,
     frecuencia, duración, instrucciones e indicaciones generales.

3. Se conservan:
   - edición de paciente corregida
   - navegación corregida
   - Historia Clínica mejorada
   - receta independiente con consultation_id NULL

No requiere SQL adicional.

Prueba principal:
Inicio > Nueva receta > seleccionar William > llenar receta > GUARDAR Y CONTINUAR.
Debe guardarse y abrir la receta profesional.
