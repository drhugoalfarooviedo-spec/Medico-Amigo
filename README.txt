MÉDICO AMIGO v1.0.10 — FIX RECETA PROFESIONAL / PDF

Problema corregido:
La receta independiente ya llegaba a guardarse, pero al construir el documento
profesional el objeto del paciente nuevo/independiente no incluía la propiedad
"meta" que el generador de receta esperaba. Eso producía:
Cannot read properties of null (reading 'meta')

Corrección:
- normaliza el paciente antes de entrar a receta;
- paciente nuevo incluye meta;
- antes del documento profesional se normaliza nuevamente el contexto;
- la consulta virtual de receta independiente incluye meta vacío para que el
  generador profesional no dependa de una consulta clínica real.

No cambia:
- selector de Nueva receta;
- alta rápida de paciente;
- Historia Clínica;
- consultas;
- cobros;
- aislamiento por médico;
- base de datos.

No requiere SQL.
