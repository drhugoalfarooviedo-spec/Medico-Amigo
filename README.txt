MÉDICO AMIGO v1.0.3 — RECETA + NAVEGACIÓN

Corrección quirúrgica sobre v1.0.2.

1. NAVEGACIÓN
- Fuerza una sola pantalla visible.
- Evita que Pacientes y Editar paciente queden superpuestos.
- La clase hidden ahora siempre prevalece en PC y móvil.

2. RECETA INDEPENDIENTE
- Corrige el guardado de una receta sin consulta.
- Guarda prescriptions con consultation_id = null.
- Guarda prescription_items asociados a esa receta.
- No crea consulta ni cobro.
- Después del guardado intenta abrir el documento para imprimir/guardar PDF.

3. HISTORIA CLÍNICA
- Se conserva el diseño mejorado de v1.0.2.
- Se conserva la receta/tratamiento asociado a cada consulta.

No requiere SQL nuevo.
No modifica RLS.
No modifica la estructura de Supabase.

PRUEBAS:
A) Ficha > Rx RECETA > completar > guardar.
B) Confirmar que no aumenta el número de consultas.
C) Editar paciente y comprobar que Pacientes desaparece.
D) Abrir Historia Clínica y confirmar que sigue mostrando tratamiento.
