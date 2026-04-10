-- ========================================================
-- PERMISOS PARA GESTIÓN DE ROLES Y PERFILES (RLS)
-- ========================================================

-- 1. Habilitar RLS en la tabla profiles (por si no lo está)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas antiguas para evitar conflictos
DROP POLICY IF EXISTS "Usuarios pueden ver su propio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Admins pueden ver todos los perfiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins pueden actualizar cualquier perfil" ON public.profiles;
DROP POLICY IF EXISTS "Usuarios pueden crear su propio perfil" ON public.profiles;

-- 3. POLÍTICA DE LECTURA (SELECT)
-- Los usuarios pueden ver su propio perfil y los admins pueden ver todos
CREATE POLICY "Lectura de perfiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id 
  OR 
  (SELECT rol FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- 4. POLÍTICA DE CREACIÓN (INSERT)
-- Permite que un usuario nuevo cree su propio registro en la tabla profiles
CREATE POLICY "Usuarios pueden crear su propio perfil"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- 5. POLÍTICA DE ACTUALIZACIÓN (UPDATE)
-- Solo los administradores pueden cambiar roles o niveles de otros
CREATE POLICY "Admins pueden actualizar cualquier perfil"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  (SELECT rol FROM public.profiles WHERE id = auth.uid()) = 'admin'
);
