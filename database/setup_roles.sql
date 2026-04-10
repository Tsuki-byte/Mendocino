-- ========================================================
-- PERMISOS PARA GESTIÓN DE ROLES (VERSIÓN FINAL SIN BUCLES)
-- ========================================================

-- 1. Asegurar que RLS esté activo
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Limpiar políticas antiguas para evitar duplicados
DROP POLICY IF EXISTS "Lectura de perfiles" ON public.profiles;
DROP POLICY IF EXISTS "Usuarios pueden crear su propio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Admins pueden actualizar cualquier perfil" ON public.profiles;

-- 3. POLÍTICA DE LECTURA (SELECT) - SIN RECURSIÓN
-- Permitimos que cualquier usuario logueado lea los perfiles. 
-- Esto elimina el bucle infinito anterior.
CREATE POLICY "Lectura de perfiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- 4. POLÍTICA DE CREACIÓN (INSERT)
-- Permite que un usuario nuevo cree su propio registro
CREATE POLICY "Usuarios pueden crear su propio perfil"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- 5. POLÍTICA DE ACTUALIZACIÓN (UPDATE) - SIN RECURSIÓN
-- Para evitar el bucle, usamos los emails de administrador directamente o el rol de la sesión
CREATE POLICY "Admins pueden actualizar cualquier perfil"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  (auth.jwt() ->> 'email' IN ('josecarlosmillan@unizar.es', 'jcmillan@unizar.es', 'tu_admin@ejemplo.com'))
  OR 
  (rol = 'admin') -- Si ya eres admin, puedes editar
);
