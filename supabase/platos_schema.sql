-- ═══════════════════════════════════════════════════════════════════════════
-- TABLA platos — catálogo central de platos colombianos
-- Ejecutar una sola vez en Supabase → SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS platos (
  id                    uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre                text        NOT NULL,
  region                text        NOT NULL,   -- debe coincidir con REGIONES del frontend
  tiempo                text        NOT NULL CHECK (tiempo IN ('desayuno', 'almuerzo', 'cena')),
  descripcion           text        NOT NULL DEFAULT '',
  ingredientes          text[]      NOT NULL DEFAULT '{}',
  tip                   text        NOT NULL DEFAULT '',
  saludable             boolean     NOT NULL DEFAULT false,
  economico             boolean     NOT NULL DEFAULT false,
  rapido                boolean     NOT NULL DEFAULT false,
  dieta                 text[]      NOT NULL DEFAULT '{}',  -- 'vegetariano','vegano','sinGluten','sinLacteos'
  imagen_url            text,                               -- URL de Pexels u otra fuente; null = se busca en tiempo real
  -- Receta completa (se llena progresivamente)
  tiempo_preparacion_min integer,
  porciones             text,
  dificultad            text,
  pasos                 jsonb,                              -- [{descripcion, tiempo_minutos, tip}]
  valor_nutricional     jsonb,                              -- {Calorias, Proteina, ...}
  activo                boolean     NOT NULL DEFAULT true,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now(),
  UNIQUE (nombre, region, tiempo)
);

-- Índice para la consulta más frecuente: region + tiempo + activo
CREATE INDEX IF NOT EXISTS platos_region_tiempo_idx ON platos (region, tiempo, activo);

-- RLS: lecturas públicas; escritura solo vía service role key (el backend)
ALTER TABLE platos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "platos_public_read" ON platos;
CREATE POLICY "platos_public_read" ON platos FOR SELECT USING (activo = true);

-- Auto-actualizar updated_at en cada UPDATE
CREATE OR REPLACE FUNCTION _update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS trg_platos_updated_at ON platos;
CREATE TRIGGER trg_platos_updated_at
  BEFORE UPDATE ON platos
  FOR EACH ROW EXECUTE FUNCTION _update_updated_at();


-- ═══════════════════════════════════════════════════════════════════════════
-- DATOS INICIALES
-- Columnas: nombre, region, tiempo, descripcion, ingredientes, tip,
--           saludable, economico, rapido, dieta
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── BOGOTÁ — DESAYUNO ───────────────────────────────────────────────────────
INSERT INTO platos (nombre, region, tiempo, descripcion, ingredientes, tip, saludable, economico, rapido, dieta) VALUES
('Calentado bogotano',
 'Bogotá', 'desayuno',
 'Arroz y fríjoles del día anterior salteados con hogao, acompañados de arepa tostada y huevo frito.',
 ARRAY['Arroz cocinado', 'Fríjoles', 'Hogao (tomate y cebolla)', 'Huevos', 'Arepa', 'Aceite'],
 'El calentado queda mejor cuando el arroz tiene al menos un día en la nevera.', false, true, true, ARRAY[]::text[]),

('Changua con huevo pochado',
 'Bogotá', 'desayuno',
 'Sopa de leche con cebolla larga y cilantro, con un huevo escalfado adentro y pan mogolla.',
 ARRAY['Leche', 'Agua', 'Huevos', 'Cebolla larga', 'Cilantro', 'Pan mogolla', 'Sal'],
 'Agrega el huevo cuando la leche esté caliente pero sin hervir para que quede bien pochado.', true, true, true, ARRAY['vegetariano']),

('Huevos pericos con arepa',
 'Bogotá', 'desayuno',
 'Huevos revueltos con tomate picado y cebolla larga, servidos con arepa blanca y chocolate.',
 ARRAY['Huevos', 'Tomate', 'Cebolla larga', 'Aceite', 'Arepa blanca', 'Sal', 'Cilantro'],
 'Revuelve a fuego medio-bajo para que los huevos queden cremosos y no resecos.', true, true, true, ARRAY['vegetariano']),

('Huevos con tocineta y tostadas',
 'Bogotá', 'desayuno',
 'Huevos fritos o revueltos con tocineta crocante, tostadas de pan y jugo de naranja.',
 ARRAY['Huevos', 'Tocineta', 'Pan de molde', 'Mantequilla', 'Sal', 'Pimienta'],
 'Deja escurrir la tocineta en papel absorbente para que quede bien crocante.', false, false, true, ARRAY[]::text[]),

('Arepas con queso y chocolate caliente',
 'Bogotá', 'desayuno',
 'Arepas blancas tostadas rellenas de queso campesino, con chocolate santafereño bien caliente.',
 ARRAY['Arepas blancas', 'Queso campesino', 'Chocolate de mesa', 'Leche', 'Panela'],
 'El chocolate queda más cremoso con mitad leche y mitad agua.', true, true, true, ARRAY['vegetariano']),

('Tamales bogotanos',
 'Bogotá', 'desayuno',
 'Tamal de masa de maíz relleno de pollo, cerdo, papa, zanahoria y arveja, envuelto en hoja de plátano.',
 ARRAY['Masa de maíz', 'Pollo', 'Cerdo', 'Papa', 'Zanahoria', 'Arveja', 'Hogao', 'Hojas de plátano'],
 'Si los compras hechos, caliéntalos al vapor 15 minutos para que no se resequen.', false, false, false, ARRAY[]::text[]),

('Avena con banano y canela',
 'Bogotá', 'desayuno',
 'Avena en hojuelas cocinada con leche, endulzada con panela y servida con rodajas de banano.',
 ARRAY['Avena en hojuelas', 'Leche', 'Banano', 'Panela', 'Canela en polvo', 'Sal'],
 'Endulza al final para controlar mejor la cantidad de panela.', true, true, true, ARRAY['vegetariano']),

('Arepa de choclo con queso',
 'Bogotá', 'desayuno',
 'Arepa dulce de maíz tierno con queso derretido encima, servida con café negro.',
 ARRAY['Maíz tierno (choclo)', 'Queso campesino', 'Mantequilla', 'Azúcar', 'Sal', 'Harina de maíz'],
 'Si usas maíz de lata escúrrelo bien antes de triturar.', true, true, false, ARRAY['vegetariano']),

('Caldo de papa con arepa',
 'Bogotá', 'desayuno',
 'Caldo ligero de papa criolla con cilantro, cebolla larga y un huevo escalfado.',
 ARRAY['Papa criolla', 'Cebolla larga', 'Cilantro', 'Ajo', 'Huevo', 'Arepa', 'Sal'],
 'Usar papa criolla (la amarilla pequeña) da un sabor mucho más rico que la papa pastusa.', true, true, true, ARRAY['vegetariano']),

('Pandeyucas con café de olla',
 'Bogotá', 'desayuno',
 'Pandeyucas esponjosos recién horneados acompañados de café negro con panela.',
 ARRAY['Almidón de yuca', 'Queso costeño', 'Huevo', 'Mantequilla', 'Sal', 'Café', 'Panela'],
 'Si los compras en panadería, caliéntalos 2 minutos en el tostador.', false, true, true, ARRAY['sinGluten', 'vegetariano'])
ON CONFLICT (nombre, region, tiempo) DO NOTHING;

-- ─── BOGOTÁ — ALMUERZO ───────────────────────────────────────────────────────
INSERT INTO platos (nombre, region, tiempo, descripcion, ingredientes, tip, saludable, economico, rapido, dieta) VALUES
('Arroz con pollo casero',
 'Bogotá', 'almuerzo',
 'Arroz cocinado con pollo desmechado, zanahoria, arveja y hogao, todo en una sola olla.',
 ARRAY['Arroz', 'Pechuga de pollo', 'Zanahoria', 'Arveja', 'Hogao', 'Comino', 'Color', 'Ajo'],
 'Cocina el pollo en el mismo caldo que usarás para el arroz, da mucho sabor.', true, true, false, ARRAY[]::text[]),

('Sudado de pollo con arroz',
 'Bogotá', 'almuerzo',
 'Pollo en presas cocinado a fuego lento en hogao, papa y especias, servido con arroz blanco.',
 ARRAY['Pollo en presas', 'Papa pastusa', 'Hogao', 'Ajo', 'Comino', 'Color', 'Cilantro', 'Arroz'],
 'El sudado queda mejor tapado y a fuego bajo para que el pollo absorba todo el sabor.', true, true, false, ARRAY[]::text[]),

('Bandeja bogotana sencilla',
 'Bogotá', 'almuerzo',
 'Arroz blanco, fríjoles rojos, carne molida guisada, plátano maduro frito y ensalada de repollo.',
 ARRAY['Arroz', 'Fríjoles rojos', 'Carne molida', 'Plátano maduro', 'Repollo', 'Tomate', 'Aceite'],
 'Fríe el plátano maduro a fuego medio para que caramelice sin quemarse.', false, true, false, ARRAY[]::text[]),

('Fríjoles rojos con arroz y chicharrón',
 'Bogotá', 'almuerzo',
 'Fríjoles rojos cocinados con costilla ahumada y hogao, servidos con arroz y chicharrón crocante.',
 ARRAY['Fríjoles rojos', 'Costilla ahumada', 'Hogao', 'Cilantro', 'Arroz', 'Chicharrón', 'Plátano'],
 'Deja remojar los fríjoles toda la noche para reducir el tiempo de cocción.', false, true, false, ARRAY[]::text[]),

('Arroz con lentejas y chicharrón',
 'Bogotá', 'almuerzo',
 'Lentejas guisadas con hogao servidas sobre arroz blanco, acompañadas de chicharrón y aguacate.',
 ARRAY['Lentejas', 'Arroz', 'Hogao', 'Chicharrón', 'Aguacate', 'Comino', 'Ajo'],
 'Las lentejas no necesitan remojo, con 30 minutos de cocción están perfectas.', true, true, false, ARRAY[]::text[]),

('Carne asada con papa criolla',
 'Bogotá', 'almuerzo',
 'Punta de anca sazonada y asada a la plancha, con papa criolla dorada y hogao casero.',
 ARRAY['Punta de anca', 'Papa criolla', 'Ajo', 'Comino', 'Color', 'Hogao', 'Cilantro', 'Aceite'],
 'Deja marinar la carne al menos 30 minutos con ajo, comino y color.', false, false, false, ARRAY[]::text[]),

('Pechuga asada con arroz y ensalada',
 'Bogotá', 'almuerzo',
 'Pechuga de pollo marinada y asada a la plancha, servida con arroz blanco y ensalada de zanahoria.',
 ARRAY['Pechuga de pollo', 'Arroz', 'Zanahoria', 'Lechuga', 'Limón', 'Ajo', 'Orégano', 'Aceite de oliva'],
 'Aplana la pechuga con un mazo para que se cocine parejo y quede más jugosa.', true, false, true, ARRAY[]::text[]),

('Ajiaco santafereño',
 'Bogotá', 'almuerzo',
 'Sopa bogotana con tres tipos de papa, pollo, guascas y mazorca, servida con crema y alcaparras.',
 ARRAY['Papa criolla', 'Papa pastusa', 'Papa sabanera', 'Pollo', 'Guascas', 'Mazorca', 'Crema de leche', 'Alcaparras'],
 'Las guascas son el ingrediente secreto — sin ellas no es ajiaco.', true, false, false, ARRAY[]::text[]),

('Sobrebarriga al horno con papas',
 'Bogotá', 'almuerzo',
 'Sobrebarriga marinada en cerveza y especias, horneada hasta quedar tierna, con papas doradas.',
 ARRAY['Sobrebarriga', 'Cerveza', 'Hogao', 'Papa pastusa', 'Ajo', 'Comino', 'Tomillo', 'Laurel'],
 'Hornea a 160°C tapada por 2 horas, los últimos 15 minutos sin tapa para que dore.', false, false, false, ARRAY[]::text[]),

('Arroz con atún y aguacate',
 'Bogotá', 'almuerzo',
 'Arroz blanco mezclado con atún, maíz dulce, tomate y cebolla, acompañado de aguacate fresco.',
 ARRAY['Arroz', 'Atún en lata', 'Maíz dulce', 'Tomate', 'Cebolla', 'Aguacate', 'Limón', 'Mayonesa'],
 'El aguacate se agrega al final, fuera del fuego, para que no se oxide.', true, true, true, ARRAY[]::text[])
ON CONFLICT (nombre, region, tiempo) DO NOTHING;

-- ─── BOGOTÁ — CENA ───────────────────────────────────────────────────────────
INSERT INTO platos (nombre, region, tiempo, descripcion, ingredientes, tip, saludable, economico, rapido, dieta) VALUES
('Caldo de costilla con arepa',
 'Bogotá', 'cena',
 'Caldo sustancioso de costilla de res con papa, cilantro y cebolla larga, servido con arepa.',
 ARRAY['Costilla de res', 'Papa criolla', 'Cebolla larga', 'Cilantro', 'Ajo', 'Comino', 'Arepa'],
 'Este caldo es el remedio bogotano para reponer fuerzas al final del día.', true, true, false, ARRAY[]::text[]),

('Papas chorreadas con pollo',
 'Bogotá', 'cena',
 'Papas pastusas cocinadas bañadas en hogao con crema de leche, acompañadas de pollo al ajillo.',
 ARRAY['Papa pastusa', 'Crema de leche', 'Hogao', 'Pollo', 'Ajo', 'Cilantro', 'Mantequilla'],
 'Las papas chorreadas saben mejor con papa pastusa grande, no criolla.', false, true, false, ARRAY['vegetariano']),

('Mazorca asada con mantequilla',
 'Bogotá', 'cena',
 'Mazorca entera asada a la brasa o plancha, con mantequilla, sal y queso rallado encima.',
 ARRAY['Mazorca', 'Mantequilla', 'Queso rallado', 'Sal'],
 'Asada directamente a la llama el maíz carameliza y sabe infinitamente mejor.', true, true, true, ARRAY['sinGluten', 'vegetariano']),

('Huevos fritos con plátano maduro',
 'Bogotá', 'cena',
 'Dos huevos fritos con plátano maduro dorado y arroz blanco, cena sencilla y reconfortante.',
 ARRAY['Huevos', 'Plátano maduro', 'Arroz', 'Aceite', 'Sal'],
 'El plátano maduro se fríe a fuego medio-bajo para que caramelice por dentro.', false, true, true, ARRAY['sinGluten', 'vegetariano']),

('Arroz con pollo desmechado',
 'Bogotá', 'cena',
 'Arroz blanco servido con pollo desmechado en salsa de hogao, cena rápida y rendidora.',
 ARRAY['Arroz', 'Pollo cocinado', 'Hogao', 'Cilantro', 'Comino', 'Ajo'],
 'Desmecha el pollo con dos tenedores mientras está caliente, es mucho más fácil.', true, true, true, ARRAY[]::text[]),

('Tostadas con huevo revuelto',
 'Bogotá', 'cena',
 'Pan tostado con mantequilla y huevos revueltos con cebolla y tomate, ideal para noche liviana.',
 ARRAY['Pan de molde', 'Huevos', 'Tomate', 'Cebolla', 'Mantequilla', 'Sal'],
 'Tuesta el pan en la sartén con un poco de mantequilla para que quede más sabroso.', true, true, true, ARRAY['vegetariano']),

('Sopa de lentejas con plátano',
 'Bogotá', 'cena',
 'Lentejas cocinadas con hogao y plátano verde picado, sopa espesa y nutritiva.',
 ARRAY['Lentejas', 'Plátano verde', 'Hogao', 'Comino', 'Ajo', 'Cilantro', 'Sal'],
 'El plátano verde espesa naturalmente la sopa — no hace falta añadir maicena.', true, true, false, ARRAY['vegetariano']),

('Mazamorra con panela y leche',
 'Bogotá', 'cena',
 'Maíz peto cocinado hasta quedar suave, servido con leche fría y panela rallada encima.',
 ARRAY['Maíz peto', 'Leche', 'Panela', 'Agua', 'Sal'],
 'La mazamorra bogotana va con leche fría encima, no caliente.', true, true, false, ARRAY['sinGluten', 'vegetariano'])
ON CONFLICT (nombre, region, tiempo) DO NOTHING;

-- ─── TOLIMA — DESAYUNO ───────────────────────────────────────────────────────
INSERT INTO platos (nombre, region, tiempo, descripcion, ingredientes, tip, saludable, economico, rapido, dieta) VALUES
('Tamal tolimense',
 'Tolima', 'desayuno',
 'Tamal de arroz con cerdo, pollo, huevo y vegetales, envuelto en hoja de bijao.',
 ARRAY['Masa de arroz', 'Cerdo', 'Pollo', 'Arveja', 'Zanahoria', 'Huevo', 'Hogao', 'Hojas de bijao'],
 'Los tamales tolimenses son más grandes que los bogotanos y usan arroz en vez de maíz.', false, false, false, ARRAY[]::text[]),
('Calentado tolimense con arepa',
 'Tolima', 'desayuno',
 'Sobrantes del almuerzo salteados con hogao, acompañados de arepa de maíz y café negro.',
 ARRAY['Arroz cocinado', 'Fríjoles o lentejas', 'Hogao', 'Arepa de maíz', 'Huevo', 'Café'],
 'En el Tolima el calentado suele incluir carne asada desmechada del día anterior.', false, true, true, ARRAY[]::text[]),
('Envuelto de mazorca con hogao',
 'Tolima', 'desayuno',
 'Masa de maíz tierno envuelta en hoja de mazorca y cocinada al vapor, acompañada de hogao.',
 ARRAY['Maíz tierno', 'Mantequilla', 'Sal', 'Hogao', 'Azúcar'],
 'Prueba la masa antes de envolver: debe quedar ligeramente dulce.', true, true, false, ARRAY['sinGluten', 'vegetariano']),
('Huevos con papa y hogao',
 'Tolima', 'desayuno',
 'Huevos revueltos servidos sobre papas cocinadas bañadas en hogao casero y cilantro.',
 ARRAY['Huevos', 'Papa pastusa', 'Hogao', 'Cilantro', 'Aceite', 'Sal'],
 'El hogao tolimense lleva más tomate que la versión bogotana.', true, true, true, ARRAY['vegetariano'])
ON CONFLICT (nombre, region, tiempo) DO NOTHING;

-- ─── TOLIMA — ALMUERZO ───────────────────────────────────────────────────────
INSERT INTO platos (nombre, region, tiempo, descripcion, ingredientes, tip, saludable, economico, rapido, dieta) VALUES
('Lechona tolimense',
 'Tolima', 'almuerzo',
 'Cerdo entero relleno de arroz, arveja y especias, horneado hasta quedar crocante por fuera.',
 ARRAY['Cerdo entero', 'Arroz', 'Arveja', 'Comino', 'Ajo', 'Color', 'Pimienta', 'Sal'],
 'La lechona tolimense auténtica se hornea por más de 10 horas. Busca una buena pieza en tu tienda local.', false, false, false, ARRAY[]::text[]),
('Viudo de pescado',
 'Tolima', 'almuerzo',
 'Sopa espesa de pescado de río con plátano verde, papa, yuca y hogao.',
 ARRAY['Pescado de río (bagre o capaz)', 'Plátano verde', 'Papa', 'Yuca', 'Hogao', 'Cilantro', 'Comino'],
 'El viudo debe ser con pescado fresco del río; el bagre grande da el mejor sabor.', true, false, false, ARRAY['sinGluten']),
('Fríjoles con costilla ahumada',
 'Tolima', 'almuerzo',
 'Fríjoles rojos con costilla de cerdo ahumada, papa y plátano maduro, servidos con arroz.',
 ARRAY['Fríjoles rojos', 'Costilla ahumada', 'Papa', 'Plátano maduro', 'Arroz', 'Hogao', 'Cilantro'],
 'La costilla ahumada elimina la necesidad de sal extra en la preparación.', false, true, false, ARRAY[]::text[]),
('Arroz con pollo a lo tolimense',
 'Tolima', 'almuerzo',
 'Arroz cocinado con pollo, hogao, color y cilantro al estilo casero del Tolima.',
 ARRAY['Arroz', 'Pollo', 'Hogao', 'Color', 'Cilantro', 'Comino', 'Ajo', 'Arroz'],
 'Añade un chorrito de cerveza al hogao para un sabor más profundo.', true, true, false, ARRAY[]::text[])
ON CONFLICT (nombre, region, tiempo) DO NOTHING;

-- ─── TOLIMA — CENA ───────────────────────────────────────────────────────────
INSERT INTO platos (nombre, region, tiempo, descripcion, ingredientes, tip, saludable, economico, rapido, dieta) VALUES
('Papa salada con hogao y huevo',
 'Tolima', 'cena',
 'Papas enteras cocinadas con sal, bañadas en hogao y acompañadas de huevo frito.',
 ARRAY['Papa pastusa', 'Hogao', 'Huevos', 'Cilantro', 'Sal'],
 'Cocina las papas con cáscara para que absorban menos agua.', true, true, true, ARRAY['vegetariano']),
('Caldo de costilla tolimense',
 'Tolima', 'cena',
 'Caldo de costilla de res con papa, cebolla y cilantro, reconfortante y rendidor.',
 ARRAY['Costilla de res', 'Papa', 'Cebolla larga', 'Cilantro', 'Ajo', 'Comino', 'Sal'],
 'Para una cena liviana sirve solo el caldo sin la carne.', true, true, false, ARRAY[]::text[]),
('Arroz con fríjoles y plátano',
 'Tolima', 'cena',
 'Arroz blanco con fríjoles guisados y plátano maduro frito, cena rápida y completa.',
 ARRAY['Arroz', 'Fríjoles', 'Plátano maduro', 'Hogao', 'Aceite', 'Sal'],
 'Cena rápida y nutritiva usando sobrantes del almuerzo.', false, true, true, ARRAY[]::text[])
ON CONFLICT (nombre, region, tiempo) DO NOTHING;

-- ─── ANTIOQUIA — DESAYUNO ────────────────────────────────────────────────────
INSERT INTO platos (nombre, region, tiempo, descripcion, ingredientes, tip, saludable, economico, rapido, dieta) VALUES
('Arepa paisa con queso',
 'Antioquia', 'desayuno',
 'Arepa antioqueña delgada y tostada con queso campesino derretido y café con leche.',
 ARRAY['Masa de arepa (maíz blanco)', 'Queso campesino', 'Mantequilla', 'Sal', 'Café', 'Leche'],
 'La arepa paisa auténtica es delgada; si queda gruesa amásala más.', true, true, true, ARRAY['sinGluten', 'vegetariano']),
('Calentado paisa completo',
 'Antioquia', 'desayuno',
 'Fríjoles, arroz y carne del día anterior fritos en una sartén, con chicharrón y huevo.',
 ARRAY['Fríjoles antioqueños', 'Arroz', 'Chicharrón', 'Huevos', 'Arepa', 'Hogao'],
 'El calentado paisa es el desayuno más completo de Colombia — no le falta nada.', false, true, true, ARRAY[]::text[]),
('Changua antioqueña',
 'Antioquia', 'desayuno',
 'Sopa de leche con huevo pochado, cilantro y calados de pan, versión paisa de la changua.',
 ARRAY['Leche', 'Agua', 'Huevos', 'Cebolla larga', 'Cilantro', 'Pan', 'Sal'],
 'En Antioquia la changua se sirve con pan de bono, no mogolla.', true, true, true, ARRAY['vegetariano']),
('Pandebono con café negro',
 'Antioquia', 'desayuno',
 'Pandebonos recién horneados esponjosos y con sabor a queso, con café negro cargado.',
 ARRAY['Almidón de yuca', 'Queso costeño', 'Huevo', 'Mantequilla'],
 'El pandebono se come recién salido del horno cuando todavía está caliente.', false, true, true, ARRAY['sinGluten', 'vegetariano'])
ON CONFLICT (nombre, region, tiempo) DO NOTHING;

-- ─── ANTIOQUIA — ALMUERZO ────────────────────────────────────────────────────
INSERT INTO platos (nombre, region, tiempo, descripcion, ingredientes, tip, saludable, economico, rapido, dieta) VALUES
('Bandeja paisa completa',
 'Antioquia', 'almuerzo',
 'El plato emblemático: fríjoles, arroz, chicharrón, carne molida, chorizo, huevo frito, arepa y aguacate.',
 ARRAY['Fríjoles rojos', 'Arroz', 'Chicharrón', 'Carne molida', 'Chorizo', 'Huevo', 'Arepa', 'Aguacate'],
 'Sirve todo en una bandeja grande para la experiencia completa paisa.', false, false, false, ARRAY[]::text[]),
('Fríjoles antioqueños con arroz',
 'Antioquia', 'almuerzo',
 'Fríjoles cargamanto cocinados con cerdo, plátano y especias, servidos con arroz y aguacate.',
 ARRAY['Fríjoles cargamanto', 'Cerdo', 'Plátano verde', 'Hogao', 'Comino', 'Cilantro', 'Arroz', 'Aguacate'],
 'Los fríjoles antioqueños son más blandos que los bogotanos — cocínalos bien hasta que estén cremosos.', true, true, false, ARRAY[]::text[]),
('Sancocho de gallina antioqueño',
 'Antioquia', 'almuerzo',
 'Sopa espesa de gallina con papa, plátano, yuca y mazorca, el sancocho más famoso de Colombia.',
 ARRAY['Gallina', 'Papa', 'Plátano verde', 'Yuca', 'Mazorca', 'Cilantro', 'Hogao', 'Comino'],
 'La gallina criolla (no de granja) da un sabor incomparable al sancocho.', true, false, false, ARRAY[]::text[]),
('Arroz con pollo paisa',
 'Antioquia', 'almuerzo',
 'Arroz amarillo con pollo, arveja y zanahoria, estilo casero paisa.',
 ARRAY['Arroz', 'Pollo', 'Arveja', 'Zanahoria', 'Color', 'Ajo', 'Comino', 'Hogao'],
 'El color (azafrán de palo) le da el tono amarillo característico sin alterar el sabor.', true, true, false, ARRAY[]::text[])
ON CONFLICT (nombre, region, tiempo) DO NOTHING;

-- ─── ANTIOQUIA — CENA ────────────────────────────────────────────────────────
INSERT INTO platos (nombre, region, tiempo, descripcion, ingredientes, tip, saludable, economico, rapido, dieta) VALUES
('Mazamorra paisa con bocadillo',
 'Antioquia', 'cena',
 'Maíz pelao cocinado en agua hasta quedar suave, acompañado de bocadillo de guayaba.',
 ARRAY['Maíz pelao', 'Agua', 'Sal', 'Leche', 'Bocadillo de guayaba'],
 'La mazamorra paisa se sirve fría con leche y bocadillo al lado, no mezclados.', true, true, false, ARRAY['sinGluten', 'vegetariano']),
('Arepas con chicharrón',
 'Antioquia', 'cena',
 'Arepas antioqueñas tostadas acompañadas de chicharrón crocante y aguacate.',
 ARRAY['Arepas antioqueñas', 'Chicharrón', 'Aguacate', 'Sal', 'Limón'],
 'Cena paisa rápida y contundente para el final del día.', false, true, true, ARRAY['sinGluten'])
ON CONFLICT (nombre, region, tiempo) DO NOTHING;

-- ─── COSTA ATLÁNTICA — DESAYUNO ──────────────────────────────────────────────
INSERT INTO platos (nombre, region, tiempo, descripcion, ingredientes, tip, saludable, economico, rapido, dieta) VALUES
('Carimañola costeña',
 'Costa Atlántica', 'desayuno',
 'Croqueta de yuca rellena de carne molida sazonada y frita hasta quedar dorada.',
 ARRAY['Yuca', 'Carne molida', 'Hogao', 'Ajo', 'Comino', 'Aceite para freír', 'Sal'],
 'La yuca debe estar muy bien cocinada antes de amasarla para que no quede grumosa.', false, true, false, ARRAY['sinGluten']),
('Arepa de huevo costeña',
 'Costa Atlántica', 'desayuno',
 'Arepa de maíz frita con un huevo cocinado adentro, el ícono del desayuno caribeño.',
 ARRAY['Masa de maíz', 'Huevos', 'Aceite para freír', 'Sal'],
 'El secreto es hacer un hueco en la arepa precocida, meter el huevo crudo y volver a freír.', false, true, false, ARRAY['sinGluten']),
('Huevos con patacón',
 'Costa Atlántica', 'desayuno',
 'Patacones crocantes de plátano verde acompañados de huevos fritos y hogao costeño.',
 ARRAY['Plátano verde', 'Huevos', 'Hogao costeño', 'Ajo', 'Aceite', 'Sal'],
 'Aplana los trozos de plátano fritos entre dos superficies planas para un patacón parejo.', true, true, true, ARRAY['sinGluten'])
ON CONFLICT (nombre, region, tiempo) DO NOTHING;

-- ─── COSTA ATLÁNTICA — ALMUERZO ──────────────────────────────────────────────
INSERT INTO platos (nombre, region, tiempo, descripcion, ingredientes, tip, saludable, economico, rapido, dieta) VALUES
('Arroz con coco y pollo',
 'Costa Atlántica', 'almuerzo',
 'Arroz cocinado en leche de coco con pollo guisado en salsa criolla, el sabor del Caribe.',
 ARRAY['Arroz', 'Leche de coco', 'Pollo', 'Hogao costeño', 'Ajo', 'Color', 'Cilantro'],
 'El arroz con coco queda mejor cuando la leche de coco es fresca o de lata (no polvo).', true, false, false, ARRAY['sinGluten']),
('Pescado frito con patacón y ensalada',
 'Costa Atlántica', 'almuerzo',
 'Mojarra o pargo frito entero con patacones, arroz con coco y ensalada de tomate y cebolla.',
 ARRAY['Mojarra o pargo', 'Plátano verde', 'Arroz', 'Leche de coco', 'Tomate', 'Cebolla', 'Limón', 'Ajo'],
 'Haz cortes diagonales en el pescado antes de freír para que quede bien cocido por dentro.', true, false, false, ARRAY['sinGluten']),
('Mote de queso',
 'Costa Atlántica', 'almuerzo',
 'Sopa costeña de ñame con queso costeño derretido y hogao, espesa y sabrosa.',
 ARRAY['Ñame', 'Queso costeño', 'Cebolla', 'Ajo', 'Hogao', 'Leche', 'Cilantro'],
 'El ñame se cocina hasta quedar casi deshecho para que espese la sopa naturalmente.', true, true, false, ARRAY['sinGluten', 'vegetariano']),
('Sancocho de mariscos costeño',
 'Costa Atlántica', 'almuerzo',
 'Sopa de camarones, jaiba y pescado con plátano, yuca y mazorca en caldo de coco.',
 ARRAY['Camarones', 'Jaiba', 'Pescado', 'Plátano verde', 'Yuca', 'Mazorca', 'Coco', 'Cilantro'],
 'Agrega los mariscos al final para que no se cocinen demasiado y queden gomosos.', true, false, false, ARRAY['sinGluten'])
ON CONFLICT (nombre, region, tiempo) DO NOTHING;

-- ─── COSTA ATLÁNTICA — CENA ──────────────────────────────────────────────────
INSERT INTO platos (nombre, region, tiempo, descripcion, ingredientes, tip, saludable, economico, rapido, dieta) VALUES
('Arroz con atún costeño',
 'Costa Atlántica', 'cena',
 'Arroz blanco mezclado con atún, maíz, pimentón y hogao costeño, cena ligera y rápida.',
 ARRAY['Arroz', 'Atún en lata', 'Maíz', 'Pimentón', 'Hogao', 'Limón'],
 'Agrega un chorrito de limón al final para realzar el sabor del atún.', true, true, true, ARRAY['sinGluten']),
('Tostones con pollo desmechado',
 'Costa Atlántica', 'cena',
 'Patacones fritos con pollo guisado y desmechado encima, con hogao y aguacate.',
 ARRAY['Plátano verde', 'Pollo', 'Hogao', 'Aguacate', 'Aceite', 'Sal'],
 'Cena costeña rápida y sabrosa con lo que quede del almuerzo.', true, true, true, ARRAY['sinGluten'])
ON CONFLICT (nombre, region, tiempo) DO NOTHING;

-- ─── COSTA PACÍFICA — DESAYUNO ───────────────────────────────────────────────
INSERT INTO platos (nombre, region, tiempo, descripcion, ingredientes, tip, saludable, economico, rapido, dieta) VALUES
('Arroz con coco dulce y plátano',
 'Costa Pacífica', 'desayuno',
 'Arroz cocinado en leche de coco con azúcar y canela, acompañado de plátano maduro asado.',
 ARRAY['Arroz', 'Leche de coco', 'Azúcar', 'Canela', 'Plátano maduro', 'Sal'],
 'Desayuno dulce del Pacífico, muy energético para empezar el día.', true, true, false, ARRAY['sinGluten', 'vegano']),
('Empanada de camarón pacífica',
 'Costa Pacífica', 'desayuno',
 'Empanada de masa de maíz rellena de camarones con hogao y coco rallado.',
 ARRAY['Masa de maíz', 'Camarones', 'Hogao', 'Coco rallado', 'Ajo', 'Cilantro', 'Aceite'],
 'El coco rallado en el relleno es el toque que diferencia la empanada pacífica.', false, true, false, ARRAY['sinGluten'])
ON CONFLICT (nombre, region, tiempo) DO NOTHING;

-- ─── COSTA PACÍFICA — ALMUERZO ───────────────────────────────────────────────
INSERT INTO platos (nombre, region, tiempo, descripcion, ingredientes, tip, saludable, economico, rapido, dieta) VALUES
('Encocado de pescado',
 'Costa Pacífica', 'almuerzo',
 'Pescado cocinado en salsa de coco con ají, cebolla y cilantro, servido con arroz con coco.',
 ARRAY['Pescado (corvina o pargo)', 'Leche de coco', 'Ají', 'Cebolla', 'Cilantro', 'Ajo', 'Arroz'],
 'El encocado no debe hervir fuerte para que la leche de coco no se corte.', true, false, false, ARRAY['sinGluten']),
('Arroz con mariscos pacífico',
 'Costa Pacífica', 'almuerzo',
 'Arroz amarillo con camarones, jaiba y calamar, cocinado en caldo de coco y especias.',
 ARRAY['Arroz', 'Camarones', 'Jaiba', 'Calamar', 'Leche de coco', 'Color', 'Ajo', 'Cilantro'],
 'Usa un caldo de cabezas de camarón para intensificar el sabor del arroz.', true, false, false, ARRAY['sinGluten']),
('Tapao de pescado',
 'Costa Pacífica', 'almuerzo',
 'Pescado entero cocinado tapado sobre cama de plátano verde, papa y especias del Pacífico.',
 ARRAY['Pescado entero', 'Plátano verde', 'Papa', 'Cebolla', 'Ajo', 'Cilantro', 'Comino', 'Sal'],
 'El tapao se cocina sin agua; los vegetales liberan suficiente humedad.', true, true, false, ARRAY['sinGluten']),
('Sancocho de bagre pacífico',
 'Costa Pacífica', 'almuerzo',
 'Sancocho de bagre de río con plátano, yuca y hierbas aromáticas del Pacífico.',
 ARRAY['Bagre', 'Plátano verde', 'Yuca', 'Cebolla', 'Ajo', 'Cilantro', 'Comino'],
 'El bagre tiene espinas fáciles de identificar; sírvelo así para que cada quien retire las suyas.', true, true, false, ARRAY['sinGluten'])
ON CONFLICT (nombre, region, tiempo) DO NOTHING;

-- ─── COSTA PACÍFICA — CENA ───────────────────────────────────────────────────
INSERT INTO platos (nombre, region, tiempo, descripcion, ingredientes, tip, saludable, economico, rapido, dieta) VALUES
('Arroz con coco y camarón',
 'Costa Pacífica', 'cena',
 'Arroz blanco con leche de coco y camarones salteados en hogao, cena ligera del Pacífico.',
 ARRAY['Arroz', 'Leche de coco', 'Camarones', 'Hogao', 'Ajo', 'Cilantro'],
 'Los camarones se saltean aparte y se agregan al final para que no queden duros.', true, false, true, ARRAY['sinGluten']),
('Plátano asado con queso costeño',
 'Costa Pacífica', 'cena',
 'Plátano maduro asado al carbón o plancha con queso costeño derretido encima.',
 ARRAY['Plátano maduro', 'Queso costeño', 'Mantequilla', 'Sal'],
 'Haz un corte longitudinal en el plátano asado e introduce el queso para que se derrita dentro.', true, true, true, ARRAY['sinGluten', 'vegetariano'])
ON CONFLICT (nombre, region, tiempo) DO NOTHING;

-- ─── SANTANDER — DESAYUNO ────────────────────────────────────────────────────
INSERT INTO platos (nombre, region, tiempo, descripcion, ingredientes, tip, saludable, economico, rapido, dieta) VALUES
('Arepa santandereana de maíz pelao',
 'Santander', 'desayuno',
 'Arepa de maíz pelao gruesa y tostada, con mantequilla y queso amarillo, sabor rústico santandereano.',
 ARRAY['Maíz pelao', 'Mantequilla', 'Queso amarillo', 'Sal', 'Agua'],
 'El maíz pelao (sin cáscara) le da a la arepa un sabor más fuerte y terroso.', true, true, false, ARRAY['sinGluten', 'vegetariano']),
('Calentado santandereano',
 'Santander', 'desayuno',
 'Sobrantes del almuerzo salteados con hogao santandereano y servidos con arepa y café.',
 ARRAY['Arroz', 'Fríjoles o mute', 'Carne', 'Hogao', 'Arepa de maíz pelao', 'Café'],
 'El hogao santandereano lleva pimentón y más ajo que en otras regiones.', false, true, true, ARRAY[]::text[]),
('Caldo de papa santandereano',
 'Santander', 'desayuno',
 'Caldo claro de papa criolla con cilantro y cebolla, acompañado de arepa tostada.',
 ARRAY['Papa criolla', 'Cebolla', 'Cilantro', 'Ajo', 'Arepa', 'Sal', 'Comino'],
 'Desayuno sencillo y reconfortante del campo santandereano.', true, true, true, ARRAY['sinGluten', 'vegetariano'])
ON CONFLICT (nombre, region, tiempo) DO NOTHING;

-- ─── SANTANDER — ALMUERZO ────────────────────────────────────────────────────
INSERT INTO platos (nombre, region, tiempo, descripcion, ingredientes, tip, saludable, economico, rapido, dieta) VALUES
('Pepitoria de cabro',
 'Santander', 'almuerzo',
 'Guiso de cabro con arroz, menudencias y especias, el plato más representativo de Santander.',
 ARRAY['Carne de cabro', 'Arroz', 'Menudencias', 'Hogao', 'Comino', 'Ajo', 'Color', 'Cilantro'],
 'La pepitoria auténtica incluye las vísceras del cabro, que le dan ese sabor único.', false, false, false, ARRAY[]::text[]),
('Mute santandereano',
 'Santander', 'almuerzo',
 'Sopa espesa de maíz, fríjoles, papa, costilla y especias, el cocido más robusto de Colombia.',
 ARRAY['Maíz trillado', 'Fríjoles', 'Papa', 'Costilla de res', 'Garbanzo', 'Comino', 'Color', 'Cilantro'],
 'El mute necesita al menos 2 horas de cocción para que el maíz quede bien suave.', true, false, false, ARRAY[]::text[]),
('Cabrito asado con papa',
 'Santander', 'almuerzo',
 'Chivo asado con ajo y especias santandereanas, servido con papa cocinada y hogao.',
 ARRAY['Carne de chivo', 'Ajo', 'Comino', 'Papas', 'Hogao', 'Cilantro'],
 'La carne de chivo necesita marinada mínimo 4 horas para suavizarse.', false, false, false, ARRAY[]::text[]),
('Bagre asado con arroz santandereano',
 'Santander', 'almuerzo',
 'Bagre del río Magdalena asado en horno o brasa con especias, servido con arroz y ensalada.',
 ARRAY['Bagre', 'Ajo', 'Comino', 'Limón', 'Arroz', 'Ensalada', 'Hogao'],
 'El bagre santandereano suele ser más grande y graso que el del Pacífico, ideal para asar.', true, false, false, ARRAY['sinGluten'])
ON CONFLICT (nombre, region, tiempo) DO NOTHING;

-- ─── SANTANDER — CENA ────────────────────────────────────────────────────────
INSERT INTO platos (nombre, region, tiempo, descripcion, ingredientes, tip, saludable, economico, rapido, dieta) VALUES
('Arepa santandereana con hogao',
 'Santander', 'cena',
 'Arepa de maíz pelao con hogao casero y queso rallado, cena rápida y tradicional.',
 ARRAY['Arepa de maíz pelao', 'Hogao', 'Queso amarillo', 'Mantequilla'],
 'Acompaña con una taza de chocolate caliente.', true, true, true, ARRAY['sinGluten', 'vegetariano']),
('Sopa de fríjoles con cerdo',
 'Santander', 'cena',
 'Caldo de fríjoles con costilla de cerdo, papa y cilantro, cena sustanciosa santandereana.',
 ARRAY['Fríjoles', 'Costilla de cerdo', 'Papa', 'Hogao', 'Cilantro', 'Comino'],
 'Aplasta algunos fríjoles contra el borde de la olla para espesar el caldo.', true, true, false, ARRAY[]::text[])
ON CONFLICT (nombre, region, tiempo) DO NOTHING;

-- ─── EJE CAFETERO — DESAYUNO ─────────────────────────────────────────────────
INSERT INTO platos (nombre, region, tiempo, descripcion, ingredientes, tip, saludable, economico, rapido, dieta) VALUES
('Arepa valluna con mantequilla',
 'Eje Cafetero', 'desayuno',
 'Arepa de maíz blanca, suave y gruesa, untada con mantequilla y acompañada de café negro.',
 ARRAY['Masa de maíz blanco', 'Mantequilla', 'Sal', 'Café'],
 'La arepa valluna es más húmeda que la paisa; agrégale un poco de mantequilla a la masa.', true, true, true, ARRAY['sinGluten', 'vegetariano']),
('Pandebono vallecaucano',
 'Eje Cafetero', 'desayuno',
 'Pan de yuca con queso del Valle, esponjoso y con sabor a queso, con café negro.',
 ARRAY['Almidón de yuca', 'Queso blanco del Valle', 'Huevo', 'Mantequilla'],
 'En el Valle el pandebono usa queso blanco fresco, más suave que el costeño.', false, true, true, ARRAY['sinGluten', 'vegetariano']),
('Calentado cafetero',
 'Eje Cafetero', 'desayuno',
 'Sobrantes del almuerzo con fríjoles de garra, arroz y chicharrón, con arepa valluna.',
 ARRAY['Arroz', 'Fríjoles de garra', 'Chicharrón', 'Arepa', 'Huevo', 'Café'],
 'En el Eje Cafetero el desayuno suele ser el más abundante del día.', false, true, true, ARRAY[]::text[])
ON CONFLICT (nombre, region, tiempo) DO NOTHING;

-- ─── EJE CAFETERO — ALMUERZO ─────────────────────────────────────────────────
INSERT INTO platos (nombre, region, tiempo, descripcion, ingredientes, tip, saludable, economico, rapido, dieta) VALUES
('Sancocho valluno de pollo',
 'Eje Cafetero', 'almuerzo',
 'Sopa de pollo con papa, plátano, mazorca y ñame, el sancocho más popular del suroccidente.',
 ARRAY['Pollo', 'Papa', 'Plátano verde', 'Mazorca', 'Ñame', 'Cebolla', 'Cilantro', 'Ajo', 'Comino'],
 'En el Valle el sancocho incluye ñame y no usa guascas como en Bogotá.', true, true, false, ARRAY['sinGluten']),
('Fríjoles con garra y arroz',
 'Eje Cafetero', 'almuerzo',
 'Fríjoles bolón cocinados con garra (pata) de cerdo y hogao, servidos con arroz y patacón.',
 ARRAY['Fríjoles bolón', 'Garra de cerdo', 'Hogao', 'Arroz', 'Plátano verde', 'Cilantro'],
 'La garra de cerdo le da gelatina natural al caldo, haciéndolo espeso y sabroso.', false, true, false, ARRAY[]::text[]),
('Arroz atollado valluno',
 'Eje Cafetero', 'almuerzo',
 'Arroz cremoso cocinado con pollo, cerdo, papa y hogao, de consistencia espesa como un risotto.',
 ARRAY['Arroz', 'Pollo', 'Costilla de cerdo', 'Papa', 'Hogao', 'Color', 'Cilantro', 'Comino'],
 'El arroz atollado debe quedar cremoso: usa más agua que para arroz normal.', true, false, false, ARRAY[]::text[]),
('Aborrajado con pollo y queso',
 'Eje Cafetero', 'almuerzo',
 'Plátano maduro relleno de queso y pollo, envuelto en masa y frito, especialidad valluna.',
 ARRAY['Plátano maduro', 'Queso', 'Pollo desmechado', 'Harina', 'Huevo', 'Aceite', 'Sal'],
 'El plátano debe estar muy maduro (casi negro) para que el aborrajado quede dulce.', false, true, false, ARRAY[]::text[])
ON CONFLICT (nombre, region, tiempo) DO NOTHING;

-- ─── EJE CAFETERO — CENA ─────────────────────────────────────────────────────
INSERT INTO platos (nombre, region, tiempo, descripcion, ingredientes, tip, saludable, economico, rapido, dieta) VALUES
('Sopa de pasta con verduras',
 'Eje Cafetero', 'cena',
 'Sopa de fideos con papa, zanahoria y pollo, sencilla y reconfortante.',
 ARRAY['Fideos', 'Papa', 'Zanahoria', 'Pollo', 'Cebolla', 'Cilantro', 'Sal', 'Comino'],
 'Sopa casera que también funciona como comida rápida de entre semana.', true, true, true, ARRAY[]::text[]),
('Arroz con pollo valluno',
 'Eje Cafetero', 'cena',
 'Arroz cocinado con pollo en caldo sazonado con hogao valluno y cilantro.',
 ARRAY['Arroz', 'Pollo', 'Hogao valluno', 'Cilantro', 'Color', 'Ajo'],
 'Aprovecha el pollo sobrante del sancocho para este arroz.', true, true, true, ARRAY[]::text[]),
('Tostadas con queso y aguacate',
 'Eje Cafetero', 'cena',
 'Pan tostado con queso blanco derretido y aguacate maduro, cena ligera cafetera.',
 ARRAY['Pan', 'Queso blanco', 'Aguacate', 'Tomate', 'Sal', 'Limón'],
 'El aguacate hass del Eje Cafetero es cremoso y perfecto para untar.', true, true, true, ARRAY['vegetariano'])
ON CONFLICT (nombre, region, tiempo) DO NOTHING;
