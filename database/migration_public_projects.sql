-- =======================================================
-- MIGRACIÓN: PROYECTOS Y COMPONENTES PÚBLICOS
-- =======================================================

-- 1. Añadir columna 'es_publico' a las tablas de datos
ALTER TABLE IF EXISTS public.paneles ADD COLUMN IF NOT EXISTS es_publico BOOLEAN DEFAULT FALSE;
ALTER TABLE IF EXISTS public.hilos ADD COLUMN IF NOT EXISTS es_publico BOOLEAN DEFAULT FALSE;
ALTER TABLE IF EXISTS public.imanes ADD COLUMN IF NOT EXISTS es_publico BOOLEAN DEFAULT FALSE;
ALTER TABLE IF EXISTS public.motores ADD COLUMN IF NOT EXISTS es_publico BOOLEAN DEFAULT FALSE;
ALTER TABLE IF EXISTS public.motores ADD COLUMN IF NOT EXISTS autor_nombre TEXT;

-- 2. Actualizar políticas RLS para permitir lectura de objetos públicos
-- Borramos las antiguas políticas de SELECT para recrearlas incluyendo es_publico

-- Paneles
DROP POLICY IF EXISTS "Paneles de usuario o admin" ON public.paneles;
CREATE POLICY "Paneles visibles para el dueño, admin o si es público" ON public.paneles FOR SELECT TO authenticated 
USING (usuario_id = auth.uid() OR es_publico = true OR public.is_admin());
CREATE POLICY "Gestión de paneles por el dueño o admin" ON public.paneles FOR ALL TO authenticated 
USING (usuario_id = auth.uid() OR public.is_admin()) 
WITH CHECK (usuario_id = auth.uid() OR public.is_admin());

-- Hilos
DROP POLICY IF EXISTS "Hilos de usuario o admin" ON public.hilos;
CREATE POLICY "Hilos visibles para el dueño, admin o si es público" ON public.hilos FOR SELECT TO authenticated 
USING (usuario_id = auth.uid() OR es_publico = true OR public.is_admin());
CREATE POLICY "Gestión de hilos por el dueño o admin" ON public.hilos FOR ALL TO authenticated 
USING (usuario_id = auth.uid() OR public.is_admin()) 
WITH CHECK (usuario_id = auth.uid() OR public.is_admin());

-- Imanes
DROP POLICY IF EXISTS "Imanes de usuario o admin" ON public.imanes;
CREATE POLICY "Imanes visibles para el dueño, admin o si es público" ON public.imanes FOR SELECT TO authenticated 
USING (usuario_id = auth.uid() OR es_publico = true OR public.is_admin());
CREATE POLICY "Gestión de imanes por el dueño o admin" ON public.imanes FOR ALL TO authenticated 
USING (usuario_id = auth.uid() OR public.is_admin()) 
WITH CHECK (usuario_id = auth.uid() OR public.is_admin());

-- Motores
DROP POLICY IF EXISTS "Motores de usuario o admin" ON public.motores;
CREATE POLICY "Motores visibles para el dueño, admin o si es público" ON public.motores FOR SELECT TO authenticated 
USING (usuario_id = auth.uid() OR es_publico = true OR public.is_admin());
CREATE POLICY "Gestión de motores por el dueño o admin" ON public.motores FOR ALL TO authenticated 
USING (usuario_id = auth.uid() OR public.is_admin()) 
WITH CHECK (usuario_id = auth.uid() OR public.is_admin());

-- 3. MIGRACIÓN DE DATOS (PROYECTOS OFICIALES)
-- Insertar paneles básicos públicos si no existen
INSERT INTO public.paneles (nombre, l, a, voc, isc, v, i, es_publico) VALUES
('Aliexpress 53x18', 53, 18, 0.501, 133.3, 0.468, 101.3, TRUE),
('Mono 157x13 (Ali)', 157, 13, 0.534, 155, 0.35, 134, TRUE)
ON CONFLICT (nombre) DO UPDATE SET es_publico = TRUE;

-- Insertar hilos básicos públicos
INSERT INTO public.hilos (diametro, es_publico) VALUES 
(0.15, TRUE), (0.25, TRUE), (0.28, TRUE), (0.55, TRUE)
ON CONFLICT DO NOTHING;

-- Insertar motores compartidos (Públicos)
INSERT INTO public.motores (id_unico, titulo, subtitulo, etiquetas, ficha, notas, explicacion, config, es_publico, autor_nombre) VALUES
(
    'official-rapido-4c',
    'Rotor de 4 caras · alta velocidad',
    'Diseño ligero, rápido y muy sensible a la iluminación.',
    '["Alta velocidad", "Baja inercia", "Arranque suave"]'::jsonb,
    '{"panel": "53x18 · 0,4V 101mA", "hilo": "Cu Ø 0.15 mm", "espiras": "28", "velocidad": "~2027 RPM", "peso": "~38 g"}'::jsonb,
    '["Tiene pocas espiras, así que la resistencia del devanado es baja y la respuesta es muy viva.", "La baja masa del rotor favorece que acelere con rapidez y que reaccione enseguida a la luz."]'::jsonb,
    'Gira más deprisa porque combina poca inercia con una oposición eléctrica reducida. Es ideal cuando se busca velocidad visual y respuesta rápida.',
    '{"caras": 4, "panelNombre": "Aliexpress 53x18", "material": "cobre", "hilo": 0.15, "margen": 0, "ranuraAncho": 6.5, "ranuraAlto": 3.5, "ranuraTipo": "trapecio", "calidad": "0.40"}'::jsonb,
    TRUE,
    'Oficial'
),
(
    'official-equilibrado-4c',
    'Rotor de 4 caras · equilibrio potencia/velocidad',
    'Muy buen compromiso entre velocidad, par y facilidad de construcción.',
    '["Equilibrado", "Uso general", "Par medio"]'::jsonb,
    '{"panel": "53x18 · 0,4V 101mA", "hilo": "Cu Ø 0.25 mm", "espiras": "79", "velocidad": "~1997 RPM", "peso": "~53 g"}'::jsonb,
    '["Más espiras mejoran la fuerza magnetomotriz y el par.", "Es una base excelente para quien fabrica su primer Mendocino serio."]'::jsonb,
    'No es el más rápido ni el más lento: funciona tan bien porque reparte de forma muy equilibrada masa, cobre y empuje magnético.',
    '{"caras": 4, "panelNombre": "Aliexpress 53x18", "material": "cobre", "hilo": 0.25, "margen": 0, "ranuraAncho": 6.5, "ranuraAlto": 3.5, "ranuraTipo": "trapecio", "calidad": "0.40"}'::jsonb,
    TRUE,
    'Oficial'
),
(
    'official-16c-inercia',
    'Rotor de 16 caras · gran inercia y giro muy suave',
    'Rotor masivo, muy vistoso y con comportamiento estable.',
    '["Gran inercia", "Muy suave", "Baja velocidad"]'::jsonb,
    '{"panel": "157x13 · 0,35V 134mA", "hilo": "Cu Ø 0.55 mm", "espiras": "64", "velocidad": "~110 RPM", "peso": "~1359 g"}'::jsonb,
    '["Las muchas caras suavizan la entrega de par y el giro parece muy continuo.", "La inercia es enorme, mantiene mejor el movimiento."]'::jsonb,
    'Gira más despacio porque el panel mueve una masa mucho mayor. Su punto fuerte no es la rapidez sino la estabilidad del giro y el efecto visual.',
    '{"caras": 16, "panelNombre": "Mono 157x13 (Ali)", "material": "cobre", "hilo": 0.55, "margen": 2.7, "ranuraAncho": 5.4, "ranuraAlto": 7, "ranuraTipo": "trapecio", "calidad": "0.40"}'::jsonb,
    TRUE,
    'Oficial'
)
ON CONFLICT (id_unico) DO NOTHING;
