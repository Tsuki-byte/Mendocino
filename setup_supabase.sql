-- =======================================================
-- MIGRACIÓN A SUPABASE AUTH (USUARIOS REALES) + RLS
-- =======================================================

-- 1. Tabla de Perfiles públicos vinculada a la Autenticación de Supabase (auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    nombre TEXT,
    rol TEXT DEFAULT 'alumno' CHECK (rol IN ('admin', 'alumno')),
    nivel TEXT DEFAULT 'basico' CHECK (nivel IN ('basico', 'avanzado', 'experto')),
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS en profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Política: Todos los usuarios autenticados pueden ver perfiles
CREATE POLICY "Perfiles visibles para usuarios logueados" ON public.profiles FOR SELECT TO authenticated USING (true);
-- Política: Los usuarios solo pueden editar su propio perfil (nombre), excepto los admins que pueden todo
CREATE POLICY "Usuarios pueden editar su perfil" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins pueden editar cualquier perfil" ON public.profiles FOR ALL TO authenticated USING (
    (SELECT rol FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- =======================================================
-- TABLAS DE DATOS (Motores y Componentes)
-- =======================================================

-- 2. Tabla de Paneles Solares
CREATE TABLE IF NOT EXISTS public.paneles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    usuario_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    l NUMERIC NOT NULL,
    a NUMERIC NOT NULL,
    voc NUMERIC NOT NULL,
    isc NUMERIC NOT NULL,
    v NUMERIC NOT NULL,
    i NUMERIC NOT NULL,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabla de Hilos de Cobre
CREATE TABLE IF NOT EXISTS public.hilos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    usuario_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    diametro NUMERIC NOT NULL,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (usuario_id, diametro)
);

-- 4. Tabla de Imanes
CREATE TABLE IF NOT EXISTS public.imanes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    usuario_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    forma TEXT NOT NULL,
    l NUMERIC NOT NULL,
    a NUMERIC NOT NULL,
    h NUMERIC NOT NULL,
    br NUMERIC NOT NULL,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabla de Proyectos/Motores
CREATE TABLE IF NOT EXISTS public.motores (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    id_unico TEXT UNIQUE NOT NULL,
    titulo TEXT NOT NULL,
    subtitulo TEXT,
    etiquetas JSONB,
    ficha JSONB,
    notas JSONB,
    explicacion TEXT,
    config JSONB NOT NULL,
    usuario_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =======================================================
-- SEGURIDAD (RLS) PARA LOS DATOS (El corazón de la privacidad)
-- =======================================================

ALTER TABLE public.paneles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hilos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imanes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.motores ENABLE ROW LEVEL SECURITY;

-- Ayudante: Función para verificar si el usuario es ADMIN
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- POLÍTICAS: Los alumnos solo ven/tocan lo suyo. Los Admins ven/tocan todo.
-- (Aplican a todas las tablas de datos)

-- Paneles
CREATE POLICY "Paneles de usuario o admin" ON public.paneles FOR ALL TO authenticated 
USING (usuario_id = auth.uid() OR public.is_admin()) 
WITH CHECK (usuario_id = auth.uid() OR public.is_admin());

-- Hilos
CREATE POLICY "Hilos de usuario o admin" ON public.hilos FOR ALL TO authenticated 
USING (usuario_id = auth.uid() OR public.is_admin()) 
WITH CHECK (usuario_id = auth.uid() OR public.is_admin());

-- Imanes
CREATE POLICY "Imanes de usuario o admin" ON public.imanes FOR ALL TO authenticated 
USING (usuario_id = auth.uid() OR public.is_admin()) 
WITH CHECK (usuario_id = auth.uid() OR public.is_admin());

-- Motores
CREATE POLICY "Motores de usuario o admin" ON public.motores FOR ALL TO authenticated 
USING (usuario_id = auth.uid() OR public.is_admin()) 
WITH CHECK (usuario_id = auth.uid() OR public.is_admin());


-- =======================================================
-- TRIGGERS DE AUTOMATIZACIÓN
-- =======================================================

-- Función que se ejecuta automáticamente cada vez que un Alumno se Registra
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
    new_nombre TEXT;
BEGIN
    -- Extraer el nombre del meta dato, si no existe, usar la parte antes del @ del email.
    new_nombre := COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1));

    -- 1. Crear el perfil del usuario
    INSERT INTO public.profiles (id, email, nombre, rol)
    VALUES (NEW.id, NEW.email, new_nombre, 'alumno');

    -- 2. Asignarle el inventario por defecto
    
    -- Hilos
    INSERT INTO public.hilos (usuario_id, diametro) VALUES 
    (NEW.id, 0.10), (NEW.id, 0.15), (NEW.id, 0.25), (NEW.id, 0.28), (NEW.id, 0.315), 
    (NEW.id, 0.40), (NEW.id, 0.50), (NEW.id, 0.55), (NEW.id, 0.63), (NEW.id, 0.90), (NEW.id, 1.0)
    ON CONFLICT DO NOTHING;

    -- Paneles
    INSERT INTO public.paneles (usuario_id, nombre, l, a, voc, isc, v, i) VALUES
    (NEW.id, 'Aliexpress 48x21', 48, 21, 0.6, 129, 0.41, 166.5),
    (NEW.id, 'Aliexpress 53x18', 53, 18, 0.501, 133.3, 0.468, 101.3),
    (NEW.id, 'Aliexpress 53x29', 53, 29, 5.78, 13.8, 4.55, 9.3)
    ON CONFLICT DO NOTHING;

    -- Imanes
    INSERT INTO public.imanes (usuario_id, nombre, forma, l, a, h, br) VALUES
    (NEW.id, 'Bloque 30x15x6 (42SH)', 'Bloque', 30, 15, 6, 1.32),
    (NEW.id, 'Aro 25x4.2x5 (N45)', 'Aro', 25, 4.2, 5, 1.37)
    ON CONFLICT DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear el Trigger real en la tabla de autenticación de Supabase
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Nota: Para que un usuario sea Superusuario (Admin), debes registrar su cuenta normal,
-- y luego, desde el SQL Editor de Supabase (o el Table Editor de profiles),
-- cambiar a mano su campo "rol" a 'admin'.
