-- Script para crear la tabla de analíticas de uso

CREATE TABLE IF NOT EXISTS public.analiticas_uso (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) NOT NULL UNIQUE,
    tiempo_total_minutos integer DEFAULT 0,
    secciones_visitadas jsonb DEFAULT '{}'::jsonb,
    ultima_conexion timestamp with time zone DEFAULT now(),
    actualizado_en timestamp with time zone DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.analiticas_uso ENABLE ROW LEVEL SECURITY;

-- Políticas
DROP POLICY IF EXISTS "Usuarios pueden ver sus propias analíticas" ON public.analiticas_uso;
CREATE POLICY "Usuarios pueden ver sus propias analíticas" ON public.analiticas_uso FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins pueden ver todas las analíticas" ON public.analiticas_uso;
CREATE POLICY "Admins pueden ver todas las analíticas" ON public.analiticas_uso FOR SELECT TO authenticated USING (
    (SELECT rol FROM public.profiles WHERE id = auth.uid()) = 'admin' 
    OR auth.email() = 'josecarlosmillandecortes@unizar.es'
);

DROP POLICY IF EXISTS "Usuarios pueden insertar sus analíticas" ON public.analiticas_uso;
CREATE POLICY "Usuarios pueden insertar sus analíticas" ON public.analiticas_uso FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios pueden actualizar sus analíticas" ON public.analiticas_uso;
CREATE POLICY "Usuarios pueden actualizar sus analíticas" ON public.analiticas_uso FOR UPDATE TO authenticated USING (auth.uid() = user_id);
