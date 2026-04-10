-- =======================================================
-- CONFIGURACIÓN DE SEGURIDAD PARA STORAGE (BUCKET: motores)
-- =======================================================

-- 1. Permitir que cualquier persona vea los vídeos (Acceso Público)
CREATE POLICY "Vídeos públicos para todos"
ON storage.objects FOR SELECT
USING ( bucket_id = 'motores' );

-- 2. Permitir que solo los administradores suban vídeos
CREATE POLICY "Admins pueden subir vídeos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'motores' 
  AND (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND rol = 'admin'
  ))
);

-- 3. Permitir que los administradores actualicen/borren vídeos
CREATE POLICY "Admins pueden editar o borrar vídeos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'motores' 
  AND (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND rol = 'admin'
  ))
);

CREATE POLICY "Admins pueden eliminar vídeos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'motores' 
  AND (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND rol = 'admin'
  ))
);
