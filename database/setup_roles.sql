-- ========================================================
-- PERMISOS PARA GESTIÓN DE ROLES (SOLO ADMINISTRADORES)
-- ========================================================

-- Primero eliminamos cualquier política antigua de actualización si existe para evitar conflictos
-- Nota: Esta política es para la tabla 'profiles'

CREATE POLICY "Admins pueden actualizar cualquier perfil"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  (SELECT rol FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Si la política anterior da error por recursión, usa esta versión simplificada (válida si el trigger de perfil ya establece el rol base):
/*
ALTER POLICY "Admins pueden actualizar cualquier perfil"
ON public.profiles
USING (
  auth.jwt() ->> 'email' IN ('josecarlosmillan@unizar.es', 'tu_email@ejemplo.com') -- Email de respaldo
  OR 
  (rol = 'admin') -- O si ya es admin en la tabla
);
*/
