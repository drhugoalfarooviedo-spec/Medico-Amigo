MÉDICO AMIGO v1.5.3 — DASHBOARD DEFINITIVO

CAUSA IDENTIFICADA
La aplicación todavía conservaba un dashboard antiguo que leía
`medicoAmigoConsultations` desde sessionStorage. Al cambiar de médico,
ese módulo podía volver a dibujar los datos de la sesión anterior encima
del dashboard real de Supabase.

CORRECCIÓN
- Se deshabilitó el dashboard local/legado.
- Supabase queda como única fuente de verdad para las estadísticas y consultas recientes.
- Al salir se limpian también los datos clínicos legados de sessionStorage.
- Se mantienen el filtro explícito por doctor_id y las políticas RLS.
- No requiere SQL nuevo.

PRUEBA
1. Subir los cuatro archivos.
2. Ctrl + Shift + R.
3. Salir e ingresar como Omar: 1 consulta / Bs 50 / TEST-OMAR-01.
4. Salir e ingresar como Hugo: deben volver únicamente los registros de Hugo.
5. Volver a Omar: debe reaparecer únicamente su información.
