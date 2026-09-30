MÉDICO AMIGO v1.0.9 — NUEVA RECETA COMPLETA

Nueva receta permite:
1) Seleccionar un paciente registrado.
2) + NUEVO PACIENTE: registro rápido y paso directo a receta, sin consulta ni cobro.

Registro rápido: nombre, CI/documento, fecha de nacimiento, sexo y teléfono.

También se corrigió el código de receta:
- se genera un identificador RX aleatorio único;
- si hubiera una colisión, se genera otro y se reintenta automáticamente.

La receta independiente guarda prescriptions + prescription_items con consultation_id NULL
y conserva la salida profesional/PDF y la firma configurada.

No requiere SQL adicional.
