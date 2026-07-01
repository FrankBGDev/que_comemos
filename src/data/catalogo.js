export const TIEMPO_LABELS = {
  desayuno: { label: "Desayuno", emoji: "🌅", hora: "6:00 – 9:00 am", sub: "Para arrancar" },
  almuerzo: { label: "Almuerzo", emoji: "🍲", hora: "12:00 – 2:00 pm", sub: "El fuerte" },
  cena: { label: "Cena", emoji: "🌙", hora: "6:00 – 8:00 pm", sub: "Algo liviano" },
};

export const REGIONES = ["Bogotá", "Tolima", "Antioquia", "Costa Atlántica", "Costa Pacífica", "Santander", "Eje Cafetero"];

// Mapea cada opción de dieta visible al tag interno con el que se etiquetan los platos del catálogo.
export const DIETA_TAGS = {
  "Vegetariano": "vegetariano",
  "Vegano": "vegano",
  "Sin gluten": "sinGluten",
  "Sin lácteos": "sinLacteos",
};

// "De todo" o cualquier valor desconocido no filtra nada.
export function cumpleDieta(plato, dietaLabel) {
  const tag = DIETA_TAGS[dietaLabel];
  if (!tag) return true;
  return !!plato.dieta?.includes(tag);
}

// Normaliza texto para comparar sin tildes ni mayúsculas.
export function normalizar(txt) {
  return (txt || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

// Convierte "camarones, frutos secos" en ["camarones", "frutos secos"].
export function listaDeTexto(txt) {
  return normalizar(txt).split(/[,;\n]/).map(s => s.trim()).filter(Boolean);
}

// true si el plato menciona (en nombre o ingredientes) alguna alergia o algo que la familia
// no quiere ver. Términos muy cortos (<3 letras) se ignoran para evitar falsos positivos.
export function chocaConPerfil(plato, perfil) {
  const terminos = [...listaDeTexto(perfil?.alergias), ...listaDeTexto(perfil?.noQuieren)].filter(t => t.length >= 3);
  if (!terminos.length) return false;
  const texto = normalizar(`${plato.nombre} ${plato.ingredientes.join(" ")}`);
  return terminos.some(t => texto.includes(t));
}

// Elige un plato del catálogo local de la región que cumpla la dieta y el perfil familiar,
// evitando los del historial reciente.
export function pickFromCatalogo(tiempo, historial = [], dieta = "De todo", region = "Bogotá", perfil = null) {
  const platosRegion = CATALOGO[region] || CATALOGO["Bogotá"];
  // Las alergias/platos no deseados se excluyen primero y sin reintroducirlos como respaldo:
  // a diferencia de la dieta (preferencia), esto puede ser un tema de seguridad.
  const todos = (platosRegion[tiempo] || []).filter(d => !chocaConPerfil(d, perfil));
  const aptos = todos.filter(d => cumpleDieta(d, dieta));
  const lista = aptos.length ? aptos : todos;
  if (!lista.length) return null;
  const nombresRecientes = historial.map(h => h.nombre);
  const frescos = lista.filter(d => !nombresRecientes.includes(d.nombre));
  const pool = frescos.length ? frescos : lista;
  return { ...pool[Math.floor(Math.random() * pool.length)], _local: true };
}

// ── CATÁLOGO LOCAL ────────────────────────────────────────────────────────────
// Respaldo curado por región, usado cuando la API falla o no hay internet.
export const CATALOGO = {
  "Bogotá": {
    desayuno: [
      { nombre: "Huevos pericos con arepa", descripcion: "Huevos revueltos con cebolla larga y tomate, con arepa asada y queso campesino.", ingredientes: ["Huevos", "Cebolla larga", "Tomate", "Arepa", "Queso"], saludable: true, economico: true, rapido: true, tip: "Cocina el tomate y la cebolla antes de echar el huevo.", dieta: ["vegetariano", "sinGluten"] },
      { nombre: "Calentado bogotano", descripcion: "Arroz, frijoles y carne salteados, con arepa y huevo frito encima.", ingredientes: ["Arroz", "Frijoles", "Carne", "Arepa", "Huevo"], saludable: false, economico: true, rapido: true, tip: "Aprovecha las sobras de la noche anterior.", dieta: ["sinGluten", "sinLacteos"] },
      { nombre: "Changua santafereña", descripcion: "Sopa de leche caliente con huevo pochado, cebolla larga y cilantro, con calado.", ingredientes: ["Leche", "Huevos", "Cebolla larga", "Cilantro", "Calado"], saludable: true, economico: true, rapido: true, tip: "Apaga el fuego apenas cuaje el huevo.", dieta: ["vegetariano"] },
      { nombre: "Caldo de costilla con papa", descripcion: "Caldo levanta-muertos de costilla con papa entera y cilantro.", ingredientes: ["Costilla", "Papa pastusa", "Cilantro", "Cebolla", "Arepa"], saludable: false, economico: true, rapido: false, tip: "Sírvelo bien caliente con arepa y café.", dieta: ["sinGluten", "sinLacteos"] },
      { nombre: "Chocolate santafereño con almojábanas", descripcion: "Chocolate caliente espumoso con almojábanas tibias y queso para hundir.", ingredientes: ["Chocolate", "Leche", "Almojábanas", "Queso", "Pan"], saludable: false, economico: false, rapido: true, tip: "Bate el chocolate con molinillo para la espuma.", dieta: ["vegetariano"] },
      { nombre: "Arepa de huevo", descripcion: "Arepa rellena de huevo y fritada hasta quedar dorada y crocante.", ingredientes: ["Masa de maíz", "Huevos", "Aceite", "Sal", "Suero"], saludable: false, economico: true, rapido: true, tip: "Sella bien los bordes para que el huevo no se salga.", dieta: ["vegetariano", "sinGluten"] },
      { nombre: "Huevos con tocineta y tostadas", descripcion: "Huevos al gusto con tocineta crocante y tostadas de pan con mantequilla.", ingredientes: ["Huevos", "Tocineta", "Pan", "Mantequilla", "Café"], saludable: false, economico: true, rapido: true, tip: "Fríe la tocineta primero y aprovecha la grasa para los huevos.", dieta: [] },
      { nombre: "Tamal tolimense con chocolate", descripcion: "Tamal de masa de maíz con pollo, cerdo y verduras, con chocolate.", ingredientes: ["Masa de maíz", "Pollo", "Cerdo", "Arveja", "Hoja"], saludable: false, economico: false, rapido: false, tip: "Caliéntalo al vapor 20 min para que quede jugoso.", dieta: ["sinGluten", "sinLacteos"] },
      { nombre: "Avena caliente con pan", descripcion: "Avena cremosa con canela y panela, acompañada de pan tajado.", ingredientes: ["Avena", "Leche", "Panela", "Canela", "Pan"], saludable: true, economico: true, rapido: true, tip: "Una pizca de sal realza el dulce de la panela.", dieta: ["vegetariano"] },
      { nombre: "Arepa con aguacate y tomate", descripcion: "Arepa asada con aguacate machacado, tomate fresco y un toque de limón.", ingredientes: ["Arepa", "Aguacate", "Tomate", "Limón", "Sal"], saludable: true, economico: true, rapido: true, tip: "Exprime el limón justo antes de servir para que el aguacate no se oxide.", dieta: ["vegetariano", "vegano", "sinGluten", "sinLacteos"] },
    ],
    almuerzo: [
      { nombre: "Ajiaco santafereño", descripcion: "Sopa de tres papas y pollo con guascas, crema, alcaparras y aguacate.", ingredientes: ["Pollo", "Papa criolla", "Mazorca", "Guascas", "Crema"], saludable: true, economico: false, rapido: false, tip: "La papa criolla se deshace y da el cuerpo cremoso.", dieta: ["sinGluten"] },
      { nombre: "Frijoles con arroz y patacón", descripcion: "Frijol cargamanto con arroz blanco, patacón crocante y aguacate.", ingredientes: ["Frijol", "Plátano", "Arroz", "Aguacate", "Carne"], saludable: false, economico: true, rapido: false, tip: "Un chorrito de aceite deja los frijoles más brillantes.", dieta: ["sinGluten", "sinLacteos"] },
      { nombre: "Bandeja paisa", descripcion: "Frijoles, arroz, chicharrón, carne molida, chorizo, huevo, arepa y aguacate.", ingredientes: ["Frijol", "Arroz", "Chicharrón", "Carne molida", "Huevo"], saludable: false, economico: false, rapido: false, tip: "El chicharrón al final para que quede crocante.", dieta: ["sinGluten", "sinLacteos"] },
      { nombre: "Sancocho de gallina", descripcion: "Sancocho con presa de gallina, yuca, plátano, papa y mazorca.", ingredientes: ["Gallina", "Yuca", "Plátano", "Papa", "Mazorca"], saludable: true, economico: false, rapido: false, tip: "Cocina la gallina a fuego lento para un caldo con cuerpo.", dieta: ["sinGluten", "sinLacteos"] },
      { nombre: "Arroz con pollo", descripcion: "Arroz amarillo salteado con pollo desmechado y verduras.", ingredientes: ["Arroz", "Pollo", "Zanahoria", "Arveja", "Pimentón"], saludable: false, economico: true, rapido: false, tip: "Sofríe el arroz antes de añadir el caldo.", dieta: ["sinGluten", "sinLacteos"] },
      { nombre: "Sobrebarriga en salsa criolla", descripcion: "Sobrebarriga blanda bañada en hogao, con papa salada y arroz.", ingredientes: ["Sobrebarriga", "Tomate", "Cebolla", "Papa", "Arroz"], saludable: false, economico: false, rapido: false, tip: "Cocínala en olla a presión para que quede tierna.", dieta: ["sinGluten", "sinLacteos"] },
      { nombre: "Lentejas con arroz y carne", descripcion: "Lentejas guisadas con verduras, arroz blanco y carne en bistec.", ingredientes: ["Lentejas", "Arroz", "Carne", "Zanahoria", "Plátano"], saludable: true, economico: true, rapido: false, tip: "No agregues sal hasta que las lentejas estén blandas.", dieta: ["sinGluten", "sinLacteos"] },
      { nombre: "Sudado de pollo", descripcion: "Pollo sudado en hogao con papa, yuca y zanahoria, con arroz.", ingredientes: ["Pollo", "Papa", "Yuca", "Tomate", "Arroz"], saludable: false, economico: true, rapido: false, tip: "Tapar la olla concentra el sabor del hogao.", dieta: ["sinGluten", "sinLacteos"] },
      { nombre: "Espagueti con carne molida", descripcion: "Pasta en salsa de tomate casera con carne molida y queso rallado.", ingredientes: ["Pasta", "Carne molida", "Tomate", "Cebolla", "Queso"], saludable: false, economico: true, rapido: true, tip: "Reserva agua de la pasta para soltar la salsa.", dieta: [] },
      { nombre: "Carne asada con papa criolla", descripcion: "Churrasco a la plancha con papa criolla dorada.", ingredientes: ["Carne", "Papa criolla", "Ajo", "Sal", "Aceite"], saludable: true, economico: false, rapido: false, tip: "Deja reposar la carne 5 min antes de cortarla.", dieta: ["sinGluten", "sinLacteos"] },
      { nombre: "Fríjoles vegetarianos con arroz y patacón", descripcion: "Fríjol cargamanto guisado con verduras, sin carne, con arroz blanco y patacón.", ingredientes: ["Frijol cargamanto", "Plátano", "Arroz", "Aguacate", "Zanahoria"], saludable: true, economico: true, rapido: false, tip: "Un sofrito de cebolla y zanahoria le da sabor sin necesidad de carne.", dieta: ["vegetariano", "vegano", "sinGluten", "sinLacteos"] },
      { nombre: "Lentejas guisadas con arroz y aguacate", descripcion: "Lentejas guisadas con zanahoria y cebolla, con arroz blanco y aguacate.", ingredientes: ["Lentejas", "Arroz", "Zanahoria", "Cebolla", "Aguacate"], saludable: true, economico: true, rapido: false, tip: "No agregues sal hasta que las lentejas estén blandas.", dieta: ["vegetariano", "vegano", "sinGluten", "sinLacteos"] },
    ],
    cena: [
      { nombre: "Caldo de costilla", descripcion: "Caldo de costilla de res con papa entera y mucho cilantro fresco.", ingredientes: ["Costilla", "Papa", "Cilantro", "Cebolla", "Ajo"], saludable: true, economico: true, rapido: false, tip: "Retira la espuma al hervir para un caldo más limpio.", dieta: ["sinGluten", "sinLacteos"] },
      { nombre: "Changua bogotana", descripcion: "Sopa de leche con huevos pochados, cebolla larga y cilantro, con calado.", ingredientes: ["Leche", "Huevos", "Cebolla larga", "Cilantro", "Calado"], saludable: false, economico: true, rapido: true, tip: "Cuaja el huevo justo antes de servir.", dieta: ["vegetariano"] },
      { nombre: "Crema de ahuyama", descripcion: "Crema suave de ahuyama con un toque de queso y crostones de pan.", ingredientes: ["Ahuyama", "Cebolla", "Caldo", "Crema", "Pan"], saludable: true, economico: true, rapido: false, tip: "Licúala bien caliente para una textura sedosa.", dieta: ["vegetariano"] },
      { nombre: "Sopa de pasta con verduras", descripcion: "Sopa ligera de pasta con zanahoria, papa y cilantro.", ingredientes: ["Pasta", "Zanahoria", "Papa", "Cilantro", "Caldo"], saludable: true, economico: true, rapido: true, tip: "Añade la pasta al final para que no se pase.", dieta: ["vegetariano", "vegano", "sinLacteos"] },
      { nombre: "Patacones con hogao y queso", descripcion: "Patacones crocantes con hogao y queso costeño rallado.", ingredientes: ["Plátano verde", "Tomate", "Cebolla", "Queso", "Aceite"], saludable: false, economico: true, rapido: true, tip: "Fríe el plátano dos veces, aplastándolo en medio.", dieta: ["vegetariano", "sinGluten"] },
      { nombre: "Tortilla de huevo con tocineta", descripcion: "Tortilla esponjosa con cebolla, tomate y tiras de tocineta crocante.", ingredientes: ["Huevos", "Tocineta", "Cebolla", "Tomate", "Aceite"], saludable: false, economico: true, rapido: true, tip: "Cocina a fuego medio-bajo para que quede jugosa por dentro.", dieta: ["sinGluten", "sinLacteos"] },
      { nombre: "Caldo de papa con huevo", descripcion: "Caldo sencillo de papa con huevo escalfado, cebolla larga y cilantro.", ingredientes: ["Papa", "Huevos", "Cebolla larga", "Cilantro", "Ajo"], saludable: false, economico: true, rapido: true, tip: "Escalfa el huevo directo en el caldo hirviendo.", dieta: ["vegetariano", "sinGluten", "sinLacteos"] },
      { nombre: "Arepa rellena de huevo y queso", descripcion: "Arepa asada rellena de huevo revuelto con queso fundido.", ingredientes: ["Arepa", "Huevos", "Queso", "Mantequilla", "Sal"], saludable: false, economico: true, rapido: true, tip: "Tapa la arepa para que el queso se derrita.", dieta: ["vegetariano", "sinGluten"] },
      { nombre: "Sopa de avena con pollo", descripcion: "Sopa cremosa de avena en hojuelas con pollo desmechado y verduras.", ingredientes: ["Avena", "Pollo", "Zanahoria", "Cebolla", "Cilantro"], saludable: true, economico: true, rapido: false, tip: "La avena espesa el caldo sin necesidad de harina.", dieta: ["sinGluten", "sinLacteos"] },
      { nombre: "Sopa de lentejas con verduras", descripcion: "Sopa de lentejas con zanahoria, papa, cebolla y cilantro.", ingredientes: ["Lentejas", "Zanahoria", "Papa", "Cilantro", "Cebolla"], saludable: true, economico: true, rapido: false, tip: "Licúa una parte de la sopa para que quede más espesa.", dieta: ["vegetariano", "vegano", "sinGluten", "sinLacteos"] },
    ],
  },

  "Tolima": {
    desayuno: [
      { nombre: "Tamal tolimense con chocolate", descripcion: "Tamal de masa de maíz con pollo, cerdo y verduras, envuelto en hoja de plátano.", ingredientes: ["Masa de maíz", "Pollo", "Cerdo", "Arveja", "Hoja de plátano"], saludable: false, economico: false, rapido: false, tip: "Caliéntalo al vapor 20 min para que quede jugoso.", dieta: ["sinGluten", "sinLacteos"] },
      { nombre: "Envuelto de mazorca con queso", descripcion: "Bollo de mazorca tierna rellena de queso, envuelto en hoja y cocido al vapor.", ingredientes: ["Mazorca", "Queso", "Mantequilla", "Sal", "Hoja de plátano"], saludable: true, economico: true, rapido: false, tip: "No abras el envuelto hasta que se enfríe un poco, así no se desarma.", dieta: ["vegetariano", "sinGluten"] },
      { nombre: "Arepa tolimense con aguacate", descripcion: "Arepa tolimense asada con aguacate machacado y tomate fresco.", ingredientes: ["Arepa tolimense", "Aguacate", "Tomate", "Sal", "Limón"], saludable: true, economico: true, rapido: true, tip: "Exprime el limón justo antes de servir.", dieta: ["vegetariano", "vegano", "sinGluten", "sinLacteos"] },
    ],
    almuerzo: [
      { nombre: "Lechona tolimense", descripcion: "Cerdo horneado relleno de arroz, arveja y especias, plato insignia del Tolima.", ingredientes: ["Cerdo", "Arroz", "Arveja", "Papa", "Especias"], saludable: false, economico: false, rapido: false, tip: "Acompáñala con insulso (arepa de maíz pelado) como se hace tradicionalmente.", dieta: ["sinGluten", "sinLacteos"] },
      { nombre: "Viudo de pescado bocachico", descripcion: "Bocachico envuelto en hoja de plátano con yuca, papa y cilantro, cocido al vapor.", ingredientes: ["Bocachico", "Plátano", "Yuca", "Papa", "Cilantro"], saludable: true, economico: false, rapido: false, tip: "Sella bien la hoja de plátano para que no se escape el vapor.", dieta: ["sinGluten", "sinLacteos"] },
      { nombre: "Arroz tolimense con verduras", descripcion: "Arroz salteado con zanahoria y arveja, servido con aguacate.", ingredientes: ["Arroz", "Zanahoria", "Arveja", "Aguacate", "Cebolla"], saludable: true, economico: true, rapido: true, tip: "Sofríe bien la cebolla antes de añadir el arroz.", dieta: ["vegetariano", "vegano", "sinGluten", "sinLacteos"] },
    ],
    cena: [
      { nombre: "Mondongo tolimense", descripcion: "Sopa espesa de mondongo con papa, yuca, zanahoria y cilantro.", ingredientes: ["Mondongo", "Papa", "Yuca", "Zanahoria", "Cilantro"], saludable: false, economico: true, rapido: false, tip: "Cocina el mondongo a fuego lento hasta que esté bien blando.", dieta: ["sinGluten", "sinLacteos"] },
      { nombre: "Changua con calado tolimense", descripcion: "Sopa de leche con huevo pochado, cebolla larga y cilantro, con calado.", ingredientes: ["Leche", "Huevos", "Cebolla larga", "Cilantro", "Calado"], saludable: true, economico: true, rapido: true, tip: "Apaga el fuego apenas cuaje el huevo.", dieta: ["vegetariano"] },
      { nombre: "Arepa tolimense con aguacate y tomate", descripcion: "Arepa tolimense asada con aguacate machacado y tomate fresco.", ingredientes: ["Arepa tolimense", "Aguacate", "Tomate", "Sal", "Limón"], saludable: true, economico: true, rapido: true, tip: "Exprime el limón justo antes de servir.", dieta: ["vegetariano", "vegano", "sinGluten", "sinLacteos"] },
    ],
  },

  "Antioquia": {
    desayuno: [
      { nombre: "Calentado paisa con chorizo", descripcion: "Arroz y frijoles del día anterior salteados con chorizo, arepa y huevo.", ingredientes: ["Arroz", "Frijoles", "Chorizo", "Arepa", "Huevo"], saludable: false, economico: true, rapido: true, tip: "Aprovecha las sobras de la noche anterior.", dieta: ["sinGluten", "sinLacteos"] },
      { nombre: "Arepa antioqueña con aguacate", descripcion: "Arepa blanca asada con aguacate machacado y tomate fresco.", ingredientes: ["Arepa antioqueña", "Aguacate", "Tomate", "Sal", "Limón"], saludable: true, economico: true, rapido: true, tip: "Exprime el limón justo antes de servir.", dieta: ["vegetariano", "vegano", "sinGluten", "sinLacteos"] },
      { nombre: "Mazamorra antioqueña con panela", descripcion: "Maíz cocido en leche con panela y canela, desayuno tradicional paisa.", ingredientes: ["Maíz", "Leche", "Panela", "Canela"], saludable: true, economico: true, rapido: false, tip: "Cocina el maíz el día anterior para que esté bien blando.", dieta: ["vegetariano", "sinGluten"] },
    ],
    almuerzo: [
      { nombre: "Bandeja paisa", descripcion: "Frijoles, arroz, chicharrón, carne molida y huevo, el plato más representativo de Antioquia.", ingredientes: ["Frijol", "Arroz", "Chicharrón", "Carne molida", "Huevo"], saludable: false, economico: false, rapido: false, tip: "El chicharrón al final para que quede crocante.", dieta: ["sinGluten", "sinLacteos"] },
      { nombre: "Mondongo antioqueño", descripcion: "Sopa espesa de mondongo con papa, yuca, zanahoria y cilantro.", ingredientes: ["Mondongo", "Papa", "Yuca", "Zanahoria", "Cilantro"], saludable: false, economico: true, rapido: false, tip: "Cocina el mondongo a fuego lento hasta que esté bien blando.", dieta: ["sinGluten", "sinLacteos"] },
      { nombre: "Fríjoles antioqueños con arroz", descripcion: "Fríjol cargamanto guisado con verduras, sin carne, con arroz y aguacate.", ingredientes: ["Frijol cargamanto", "Arroz", "Plátano", "Aguacate", "Zanahoria"], saludable: true, economico: true, rapido: false, tip: "Un sofrito de cebolla y zanahoria le da sabor sin necesidad de carne.", dieta: ["vegetariano", "vegano", "sinGluten", "sinLacteos"] },
    ],
    cena: [
      { nombre: "Arepa paisa con frijoles", descripcion: "Arepa antioqueña acompañada de frijoles, queso y aguacate.", ingredientes: ["Arepa antioqueña", "Frijol", "Queso", "Cebolla", "Aguacate"], saludable: true, economico: true, rapido: true, tip: "Calienta los frijoles del almuerzo para no empezar de cero.", dieta: ["vegetariano", "sinGluten"] },
      { nombre: "Sancocho de gallina antioqueño", descripcion: "Sancocho con presa de gallina, yuca, plátano, papa y cilantro.", ingredientes: ["Gallina", "Yuca", "Plátano", "Papa", "Cilantro"], saludable: true, economico: false, rapido: false, tip: "Cocina la gallina a fuego lento para un caldo con cuerpo.", dieta: ["sinGluten", "sinLacteos"] },
      { nombre: "Patacón con guacamole", descripcion: "Patacón crocante acompañado de guacamole fresco con limón.", ingredientes: ["Plátano verde", "Aguacate", "Tomate", "Cebolla", "Limón"], saludable: true, economico: true, rapido: true, tip: "Machaca el aguacate justo antes de servir.", dieta: ["vegetariano", "vegano", "sinGluten", "sinLacteos"] },
    ],
  },

  "Costa Atlántica": {
    desayuno: [
      { nombre: "Arepa de huevo costeña", descripcion: "Arepa de maíz frita y rellena de huevo, clásico desayuno costeño.", ingredientes: ["Masa de maíz", "Huevos", "Aceite", "Sal", "Suero"], saludable: false, economico: true, rapido: true, tip: "Sella bien los bordes para que el huevo no se salga.", dieta: ["vegetariano", "sinGluten"] },
      { nombre: "Mote de queso", descripcion: "Sopa cremosa de ñame con queso costeño, cebolla y cilantro.", ingredientes: ["Ñame", "Queso", "Leche", "Cebolla", "Cilantro"], saludable: true, economico: true, rapido: false, tip: "Machaca un poco el ñame contra la olla para que la sopa espese sola.", dieta: ["vegetariano", "sinGluten"] },
      { nombre: "Carimañola con guiso", descripcion: "Buñuelo de yuca rellena de un guiso de tomate, cebolla y pimentón.", ingredientes: ["Yuca", "Tomate", "Cebolla", "Pimentón", "Aceite"], saludable: true, economico: true, rapido: false, tip: "Amasa la yuca caliente para que sea más fácil de moldear.", dieta: ["vegetariano", "vegano", "sinGluten", "sinLacteos"] },
    ],
    almuerzo: [
      { nombre: "Sancocho de mariscos costeño", descripcion: "Sancocho con pescado y camarón, yuca, plátano y cilantro.", ingredientes: ["Pescado", "Camarón", "Yuca", "Plátano", "Cilantro"], saludable: true, economico: false, rapido: false, tip: "Agrega los mariscos al final para que no se pasen de cocción.", dieta: ["sinGluten", "sinLacteos"] },
      { nombre: "Arroz de lisa con coco", descripcion: "Arroz cocido con pescado lisa ahumado, coco y cebolla.", ingredientes: ["Arroz", "Lisa", "Coco", "Cebolla", "Ajo"], saludable: false, economico: true, rapido: false, tip: "Desmenuza bien el pescado para que se reparta en todo el arroz.", dieta: ["sinGluten"] },
      { nombre: "Arroz con coco y fríjol de cabecita negra", descripcion: "Arroz cocido en leche de coco con fríjol de cabecita negra.", ingredientes: ["Arroz", "Coco", "Fríjol de cabecita negra", "Cebolla", "Ajo"], saludable: true, economico: true, rapido: false, tip: "Tuesta el coco rallado antes de exprimirlo para más sabor.", dieta: ["vegetariano", "vegano", "sinGluten", "sinLacteos"] },
    ],
    cena: [
      { nombre: "Pescado frito con patacón", descripcion: "Pescado frito entero con patacón y limón.", ingredientes: ["Pescado", "Plátano verde", "Limón", "Ajo", "Aceite"], saludable: true, economico: false, rapido: false, tip: "Marina el pescado con limón y ajo unos minutos antes de freírlo.", dieta: ["sinGluten", "sinLacteos"] },
      { nombre: "Butifarra con bollo de yuca", descripcion: "Butifarra costeña a la parrilla acompañada de bollo de yuca.", ingredientes: ["Butifarra", "Yuca", "Cebolla", "Limón", "Hoja de plátano"], saludable: false, economico: true, rapido: false, tip: "Sirve la butifarra bien caliente, recién salida de la parrilla.", dieta: ["sinGluten", "sinLacteos"] },
      { nombre: "Patacones con guacamole costeño", descripcion: "Patacones crocantes acompañados de guacamole fresco con limón.", ingredientes: ["Plátano verde", "Aguacate", "Tomate", "Cebolla", "Limón"], saludable: true, economico: true, rapido: true, tip: "Machaca el aguacate justo antes de servir.", dieta: ["vegetariano", "vegano", "sinGluten", "sinLacteos"] },
    ],
  },

  "Costa Pacífica": {
    desayuno: [
      { nombre: "Arepa de chócolo con panela", descripcion: "Arepa dulce de maíz tierno endulzada con panela raspada.", ingredientes: ["Maíz tierno", "Panela", "Aceite", "Sal"], saludable: true, economico: true, rapido: true, tip: "No la cocines a fuego muy alto, se quema por fuera y queda cruda por dentro.", dieta: ["vegetariano", "vegano", "sinGluten", "sinLacteos"] },
      { nombre: "Empanada de camarón", descripcion: "Empanada de masa de maíz rellena de camarón guisado.", ingredientes: ["Masa de maíz", "Camarón", "Cebolla", "Aceite", "Sal"], saludable: false, economico: true, rapido: false, tip: "Pica el camarón pequeño para que se reparta bien en el relleno.", dieta: ["sinGluten", "sinLacteos"] },
      { nombre: "Pandeyuca con queso y jugo de borojó", descripcion: "Pandeyuca horneado con un vaso de jugo de borojó.", ingredientes: ["Yuca", "Queso", "Huevo", "Borojó", "Azúcar"], saludable: true, economico: true, rapido: false, tip: "El borojó es muy ácido y espeso, dilúyelo bien con agua o leche.", dieta: ["vegetariano", "sinGluten"] },
    ],
    almuerzo: [
      { nombre: "Encocado de pescado", descripcion: "Pescado guisado en leche de coco con plátano y cilantro.", ingredientes: ["Pescado", "Leche de coco", "Plátano", "Cilantro", "Ajo"], saludable: true, economico: false, rapido: false, tip: "No dejes hervir mucho la leche de coco o se puede cortar.", dieta: ["sinGluten", "sinLacteos"] },
      { nombre: "Arroz con coco y camarón", descripcion: "Arroz cocido en leche de coco con camarón y cebolla.", ingredientes: ["Arroz", "Coco", "Camarón", "Cebolla", "Ajo"], saludable: false, economico: false, rapido: false, tip: "Tuesta el coco rallado antes de exprimirlo para más sabor.", dieta: ["sinGluten", "sinLacteos"] },
      { nombre: "Sopa de plátano con coco", descripcion: "Sopa cremosa de plátano en leche de coco, sin pescado.", ingredientes: ["Plátano", "Leche de coco", "Cebolla", "Ajo", "Cilantro"], saludable: true, economico: true, rapido: true, tip: "Licúa la mitad de la sopa para que quede más espesa.", dieta: ["vegetariano", "vegano", "sinGluten", "sinLacteos"] },
    ],
    cena: [
      { nombre: "Ceviche de camarón pacífico", descripcion: "Camarón curado en limón con cebolla, tomate y cilantro.", ingredientes: ["Camarón", "Limón", "Cebolla", "Tomate", "Cilantro"], saludable: true, economico: false, rapido: true, tip: "Deja el camarón en el limón solo el tiempo justo para que no quede duro.", dieta: ["sinGluten", "sinLacteos"] },
      { nombre: "Tapao de pescado con plátano", descripcion: "Pescado cocido a fuego lento con plátano, yuca y cebolla.", ingredientes: ["Pescado", "Plátano", "Yuca", "Cebolla", "Cilantro"], saludable: true, economico: false, rapido: false, tip: "Tapa bien la olla para que el pescado se cocine en su propio vapor.", dieta: ["sinGluten", "sinLacteos"] },
      { nombre: "Patacones con encocado de verduras", descripcion: "Patacones acompañados de un guiso de zanahoria y cebolla en leche de coco.", ingredientes: ["Plátano verde", "Leche de coco", "Zanahoria", "Cebolla", "Cilantro"], saludable: true, economico: true, rapido: false, tip: "Fríe el plátano dos veces, aplastándolo en medio.", dieta: ["vegetariano", "vegano", "sinGluten", "sinLacteos"] },
    ],
  },

  "Santander": {
    desayuno: [
      { nombre: "Arepa santandereana con queso", descripcion: "Arepa de maíz pelao asada y rellena de queso.", ingredientes: ["Arepa de maíz pelao", "Queso", "Mantequilla", "Sal"], saludable: false, economico: true, rapido: true, tip: "Ásala en sartén bien caliente para que quede crocante por fuera.", dieta: ["vegetariano", "sinGluten"] },
      { nombre: "Mute santandereano", descripcion: "Sopa espesa de maíz, garbanzo, papa y carne, típica de Santander.", ingredientes: ["Maíz", "Garbanzo", "Papa", "Carne", "Cilantro"], saludable: true, economico: true, rapido: false, tip: "Remoja el maíz y el garbanzo la noche anterior.", dieta: ["sinGluten", "sinLacteos"] },
      { nombre: "Arepa santandereana con aguacate", descripcion: "Arepa de maíz pelao con aguacate machacado y tomate fresco.", ingredientes: ["Arepa de maíz pelao", "Aguacate", "Tomate", "Sal"], saludable: true, economico: true, rapido: true, tip: "Ásala en sartén bien caliente para que quede crocante por fuera.", dieta: ["vegetariano", "vegano", "sinGluten", "sinLacteos"] },
    ],
    almuerzo: [
      { nombre: "Cabro guisado santandereano", descripcion: "Carne de cabro guisada con papa, cebolla y tomate, servida con arroz.", ingredientes: ["Cabro", "Papa", "Cebolla", "Tomate", "Arroz"], saludable: false, economico: false, rapido: false, tip: "Marina la carne de cabro desde la noche anterior para suavizar su sabor.", dieta: ["sinGluten", "sinLacteos"] },
      { nombre: "Pepitoria santandereana", descripcion: "Guiso de vísceras de cabro con arroz, arveja y cilantro.", ingredientes: ["Vísceras de cabro", "Arroz", "Arveja", "Cilantro", "Ajo"], saludable: false, economico: true, rapido: false, tip: "Pica bien fino todos los ingredientes, así es la pepitoria tradicional.", dieta: ["sinGluten", "sinLacteos"] },
      { nombre: "Arroz santandereano con fríjol", descripcion: "Arroz con fríjol guisado y aguacate, sin carne.", ingredientes: ["Arroz", "Fríjol", "Aguacate", "Cebolla", "Zanahoria"], saludable: true, economico: true, rapido: false, tip: "Un sofrito de cebolla y zanahoria le da sabor sin necesidad de carne.", dieta: ["vegetariano", "vegano", "sinGluten", "sinLacteos"] },
    ],
    cena: [
      { nombre: "Bagre asado santandereano", descripcion: "Bagre asado marinado en limón, ajo y cilantro.", ingredientes: ["Bagre", "Limón", "Ajo", "Cilantro", "Aceite"], saludable: true, economico: false, rapido: false, tip: "Marina el bagre al menos 20 minutos antes de asarlo.", dieta: ["sinGluten", "sinLacteos"] },
      { nombre: "Arepa santandereana con aguacate", descripcion: "Arepa de maíz pelao con aguacate machacado y un toque de limón.", ingredientes: ["Arepa de maíz pelao", "Aguacate", "Limón", "Sal"], saludable: true, economico: true, rapido: true, tip: "Exprime el limón justo antes de servir.", dieta: ["vegetariano", "vegano", "sinGluten", "sinLacteos"] },
      { nombre: "Sopa de arroz con costilla", descripcion: "Sopa ligera de arroz con costilla, papa y cilantro.", ingredientes: ["Costilla", "Arroz", "Papa", "Cilantro", "Cebolla"], saludable: true, economico: true, rapido: false, tip: "Retira la espuma al hervir para un caldo más limpio.", dieta: ["sinGluten", "sinLacteos"] },
    ],
  },

  "Eje Cafetero": {
    desayuno: [
      { nombre: "Arepa valluna con aguacate", descripcion: "Arepa de maíz blanco asada con aguacate machacado y tomate fresco.", ingredientes: ["Arepa valluna", "Aguacate", "Tomate", "Sal", "Limón"], saludable: true, economico: true, rapido: true, tip: "Exprime el limón justo antes de servir.", dieta: ["vegetariano", "vegano", "sinGluten", "sinLacteos"] },
      { nombre: "Aborrajados de plátano maduro", descripcion: "Plátano maduro frito, bañado en una mezcla de harina y huevo.", ingredientes: ["Plátano maduro", "Harina de trigo", "Huevo", "Aceite", "Azúcar"], saludable: false, economico: true, rapido: true, tip: "Fríe a fuego medio para que se dore sin quemarse antes de cocinar por dentro.", dieta: ["vegetariano", "sinLacteos"] },
      { nombre: "Pandebono cafetero con chocolate", descripcion: "Pandebono recién horneado con chocolate caliente.", ingredientes: ["Pandebono", "Chocolate", "Leche", "Queso"], saludable: false, economico: true, rapido: false, tip: "Sirve el pandebono recién horneado, cuando aún está tibio y suave.", dieta: ["vegetariano"] },
    ],
    almuerzo: [
      { nombre: "Sancocho valluno", descripcion: "Sancocho de gallina con yuca, plátano, papa y cilantro.", ingredientes: ["Gallina", "Yuca", "Plátano", "Papa", "Cilantro"], saludable: true, economico: false, rapido: false, tip: "Cocina la gallina a fuego lento para un caldo con cuerpo.", dieta: ["sinGluten", "sinLacteos"] },
      { nombre: "Fríjoles con garra cafeteros", descripcion: "Fríjoles guisados con garra de res, arroz, plátano y aguacate.", ingredientes: ["Fríjol", "Garra de res", "Arroz", "Plátano", "Aguacate"], saludable: false, economico: true, rapido: false, tip: "Cocina la garra aparte hasta que esté bien blanda antes de mezclarla.", dieta: ["sinGluten", "sinLacteos"] },
      { nombre: "Fríjoles cafeteros con arroz", descripcion: "Fríjoles guisados sin carne, con arroz, plátano y aguacate.", ingredientes: ["Fríjol", "Arroz", "Aguacate", "Plátano", "Zanahoria"], saludable: true, economico: true, rapido: false, tip: "Un sofrito de cebolla y zanahoria le da sabor sin necesidad de carne.", dieta: ["vegetariano", "vegano", "sinGluten", "sinLacteos"] },
    ],
    cena: [
      { nombre: "Tamal vallecaucano", descripcion: "Tamal de masa de maíz con pollo, cerdo y verduras, envuelto en hoja de plátano.", ingredientes: ["Masa de maíz", "Pollo", "Cerdo", "Arveja", "Hoja de plátano"], saludable: false, economico: false, rapido: false, tip: "Caliéntalo al vapor 20 min para que quede jugoso.", dieta: ["sinGluten", "sinLacteos"] },
      { nombre: "Arepa valluna con hogao y queso", descripcion: "Arepa valluna con hogao de tomate y cebolla, cubierta de queso.", ingredientes: ["Arepa valluna", "Tomate", "Cebolla", "Queso", "Aceite"], saludable: true, economico: true, rapido: true, tip: "Cocina el hogao a fuego lento para que el tomate suelte todo su sabor.", dieta: ["vegetariano", "sinGluten"] },
      { nombre: "Sopa de plátano cafetera", descripcion: "Sopa ligera de plátano con papa, cebolla y cilantro.", ingredientes: ["Plátano", "Papa", "Cebolla", "Cilantro", "Caldo de verduras"], saludable: true, economico: true, rapido: true, tip: "Licúa una parte de la sopa para que quede más espesa.", dieta: ["vegetariano", "vegano", "sinGluten", "sinLacteos"] },
    ],
  },
};
