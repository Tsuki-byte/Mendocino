-- 1. Tabla de Usuarios Administradores (o Alumnos con niveles)
CREATE TABLE IF NOT EXISTS public.usuarios_mendocino (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nombre TEXT UNIQUE NOT NULL,
    nivel TEXT NOT NULL CHECK (nivel IN ('basico', 'avanzado', 'experto')),
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla de Paneles Solares (Por Usuario)
CREATE TABLE IF NOT EXISTS public.paneles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    usuario_creador TEXT REFERENCES public.usuarios_mendocino(nombre) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    l NUMERIC NOT NULL,
    a NUMERIC NOT NULL,
    voc NUMERIC NOT NULL,
    isc NUMERIC NOT NULL,
    v NUMERIC NOT NULL,
    i NUMERIC NOT NULL,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabla de Hilos de Cobre (Por Usuario)
CREATE TABLE IF NOT EXISTS public.hilos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    usuario_creador TEXT REFERENCES public.usuarios_mendocino(nombre) ON DELETE CASCADE,
    diametro NUMERIC NOT NULL,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (usuario_creador, diametro)
);

-- 4. Tabla de Imanes (Por Usuario)
CREATE TABLE IF NOT EXISTS public.imanes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    usuario_creador TEXT REFERENCES public.usuarios_mendocino(nombre) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    forma TEXT NOT NULL,
    l NUMERIC NOT NULL,
    a NUMERIC NOT NULL,
    h NUMERIC NOT NULL,
    br NUMERIC NOT NULL,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabla de Proyectos/Motores (Por Usuario)
CREATE TABLE IF NOT EXISTS public.motores (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    id_unico TEXT UNIQUE NOT NULL, -- Ej: 'mi-motor-123'
    titulo TEXT NOT NULL,
    subtitulo TEXT,
    etiquetas JSONB,
    ficha JSONB,
    notas JSONB,
    explicacion TEXT,
    config JSONB NOT NULL,
    usuario_creador TEXT REFERENCES public.usuarios_mendocino(nombre) ON DELETE CASCADE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Opcional: Desactivar RLS (Row Level Security) temporalmente para que tu web en Vanilla JS pueda leer/escribir sin tokens de usuario
-- ADVERTENCIA: En un entorno de producción, deberías activar RLS y configurar políticas de autenticación reales.
ALTER TABLE public.usuarios_mendocino DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.paneles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.hilos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.imanes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.motores DISABLE ROW LEVEL SECURITY;

-- 6. Insertar el Usuario "demo" por Defecto (Nivel Básico)
INSERT INTO public.usuarios_mendocino (nombre, nivel) VALUES ('demo', 'basico') ON CONFLICT DO NOTHING;

-- Insertar los datos por Defecto PARA EL USUARIO DEMO
INSERT INTO public.hilos (usuario_creador, diametro)
VALUES 
('demo', 0.10), ('demo', 0.15), ('demo', 0.25), ('demo', 0.28), ('demo', 0.315), 
('demo', 0.40), ('demo', 0.50), ('demo', 0.55), ('demo', 0.63), ('demo', 0.90), ('demo', 1.0)
ON CONFLICT (usuario_creador, diametro) DO NOTHING;

INSERT INTO public.paneles (usuario_creador, nombre, l, a, voc, isc, v, i) VALUES
('demo', 'Aliexpress 48x21', 48, 21, 0.6, 129, 0.41, 166.5),
('demo', 'Aliexpress 53x18', 53, 18, 0.501, 133.3, 0.468, 101.3),
('demo', 'Aliexpress 53x29', 53, 29, 5.78, 13.8, 4.55, 9.3)
ON CONFLICT DO NOTHING;

INSERT INTO public.imanes (usuario_creador, nombre, forma, l, a, h, br) VALUES
('demo', 'Bloque 30x15x6 (42SH)', 'Bloque', 30, 15, 6, 1.32),
('demo', 'Aro 25x4.2x5 (N45)', 'Aro', 25, 4.2, 5, 1.37)
ON CONFLICT DO NOTHING;
