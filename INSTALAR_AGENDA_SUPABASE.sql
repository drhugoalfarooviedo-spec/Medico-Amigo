-- Médico Amigo v1.0.31 — Agenda de citas
-- Ejecutar una sola vez en Supabase > SQL Editor.
-- No modifica las tablas existentes.
CREATE TABLE IF NOT EXISTS public.medical_appointments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 doctor_id uuid NOT NULL REFERENCES auth.users(id),
 patient_id uuid NOT NULL REFERENCES public.patients(id),
 starts_at timestamp without time zone NOT NULL,
 reason text NOT NULL DEFAULT '',
 notes text NOT NULL DEFAULT '',
 status text NOT NULL DEFAULT 'scheduled' CHECK(status IN ('scheduled','completed','cancelled','no_show')),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS medical_appointments_doctor_date_idx ON public.medical_appointments(doctor_id,starts_at);
ALTER TABLE public.medical_appointments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS appointments_doctor_select ON public.medical_appointments;
CREATE POLICY appointments_doctor_select ON public.medical_appointments FOR SELECT TO authenticated USING (doctor_id = (select auth.uid()));
DROP POLICY IF EXISTS appointments_doctor_insert ON public.medical_appointments;
CREATE POLICY appointments_doctor_insert ON public.medical_appointments FOR INSERT TO authenticated WITH CHECK (
 doctor_id = (select auth.uid()) AND EXISTS (SELECT 1 FROM public.patients p WHERE p.id = patient_id AND p.doctor_id = (select auth.uid()))
);
DROP POLICY IF EXISTS appointments_doctor_update ON public.medical_appointments;
CREATE POLICY appointments_doctor_update ON public.medical_appointments FOR UPDATE TO authenticated
 USING (doctor_id = (select auth.uid()))
 WITH CHECK (doctor_id = (select auth.uid()) AND EXISTS (SELECT 1 FROM public.patients p WHERE p.id = patient_id AND p.doctor_id = (select auth.uid())));
REVOKE ALL ON public.medical_appointments FROM anon;
GRANT SELECT, INSERT, UPDATE ON public.medical_appointments TO authenticated;
