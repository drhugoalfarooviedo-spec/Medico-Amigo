MÉDICO AMIGO v1.0.4 — FLUJO ESTABLE

CORRECCIONES:
- Corrige la superposición Pacientes + Editar paciente.
- Volver desde Editar paciente retorna a la ficha del mismo paciente.
- Volver desde una CONSULTA EN EDICIÓN retorna a la ficha del paciente y cancela el modo edición.
- Conserva la Historia Clínica ordenada con tratamiento/receta asociada.
- Conserva receta independiente.

IMPORTANTE — UNA MIGRACIÓN SQL:
La captura de error confirmó que Supabase tiene prescriptions.consultation_id como NOT NULL.
Eso impide, a nivel de base de datos, guardar una receta independiente.

Ejecutar una sola vez el archivo:
MIGRACION_RECETA_INDEPENDIENTE.sql

La migración únicamente permite que consultation_id sea NULL.
No elimina datos, no cambia RLS y no afecta las recetas vinculadas a consultas.

PRUEBA:
1. Ejecutar la migración SQL.
2. Subir los archivos web a GitHub.
3. Esperar deployment y cerrar/reabrir PWA.
4. Paciente > Rx RECETA > llenar > GUARDAR Y CONTINUAR.
5. Confirmar que la receta se guarda sin aumentar el número de consultas.
6. Abrir consulta histórica > EDITAR CONSULTA > flecha atrás.
7. Debe volver a Ficha del paciente sin mostrar dos pantallas.
