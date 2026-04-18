-- ========================================================
-- DESBLOQUEO TOTAL DE LECTURA (PARA DIAGNÓSTICO)
-- ========================================================

-- 1. Habilitar RLS en todas las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.motores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paneles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hilos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imanes ENABLE ROW LEVEL SECURITY;

-- 2. POLÍTICAS DE LECTURA UNIVERSAL (SELECT)
-- Esto asegura que NADA en la base de datos bloquee la carga de la web.
DROP POLICY IF EXISTS "Lectura universal motores" ON public.motores;
CREATE POLICY "Lectura universal motores" ON public.motores FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Lectura universal paneles" ON public.paneles;
CREATE POLICY "Lectura universal paneles" ON public.paneles FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Lectura universal hilos" ON public.hilos;
CREATE POLICY "Lectura universal hilos" ON public.hilos FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Lectura universal imanes" ON public.imanes;
CREATE POLICY "Lectura universal imanes" ON public.imanes FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Lectura universal profiles" ON public.profiles;
CREATE POLICY "Lectura universal profiles" ON public.profiles FOR SELECT TO authenticated, anon USING (true);

-- 3. POLÍTICA DE CREACIÓN/EDICIÓN/BORRADO (INSERT/UPDATE/DELETE)
-- Mantenemos la seguridad mínima para que no cualquiera pueda borrar datos.

-- 3.1. Asegurar columnas de descripción en motores
ALTER TABLE public.motores ADD COLUMN IF NOT EXISTS subtitulo text;
ALTER TABLE public.motores ADD COLUMN IF NOT EXISTS explicacion text;
ALTER TABLE public.motores ADD COLUMN IF NOT EXISTS etiquetas text[] DEFAULT '{}';
ALTER TABLE public.motores ADD COLUMN IF NOT EXISTS notas text[] DEFAULT '{}';

-- 3.2. Políticas de perfiles
DROP POLICY IF EXISTS "Usuarios pueden crear su propio perfil" ON public.profiles;
CREATE POLICY "Usuarios pueden crear su propio perfil" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins pueden actualizar perfiles" ON public.profiles;
CREATE POLICY "Admins pueden actualizar perfiles" ON public.profiles FOR UPDATE TO authenticated USING (rol = 'admin' OR auth.email() = 'josecarlosmillandecortes@unizar.es');

-- 3.3. Políticas para Motores (Administración)
DROP POLICY IF EXISTS "Admins pueden actualizar motores" ON public.motores;
CREATE POLICY "Admins pueden actualizar motores" ON public.motores 
FOR UPDATE TO authenticated 
USING (
  (SELECT rol FROM public.profiles WHERE id = auth.uid()) = 'admin' 
  OR auth.email() = 'josecarlosmillandecortes@unizar.es'
);

DROP POLICY IF EXISTS "Admins pueden borrar motores" ON public.motores;
CREATE POLICY "Admins pueden borrar motores" ON public.motores 
FOR DELETE TO authenticated 
USING (
  (SELECT rol FROM public.profiles WHERE id = auth.uid()) = 'admin' 
  OR auth.email() = 'josecarlosmillandecortes@unizar.es'
);
