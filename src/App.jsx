import { useState, useEffect, useRef } from "react";

const TIEMPO_LABELS = {
  desayuno: { label: "Desayuno", emoji: "🌅", hora: "6:00 – 9:00 am", sub: "Para arrancar" },
  almuerzo: { label: "Almuerzo", emoji: "🍲", hora: "12:00 – 2:00 pm", sub: "El fuerte" },
  cena: { label: "Cena", emoji: "🌙", hora: "6:00 – 8:00 pm", sub: "Algo liviano" },
};

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const REGIONES = ["Bogotá", "Tolima", "Antioquia", "Costa Atlántica", "Costa Pacífica", "Santander", "Eje Cafetero"];

const PREGUNTAS_CONTEXTO = [
  { id: "personas", label: "¿Cuántas personas en casa?", options: ["Solo", "2 personas", "3-4 personas", "5 o más"] },
  { id: "tiempo", label: "¿Cuánto tiempo tienes para cocinar?", options: ["Menos de 20 min", "20-40 min", "Más de 40 min"] },
  { id: "mercado", label: "¿Qué tan surtida está la nevera?", options: ["Casi vacía", "Lo básico", "Bien surtida"] },
  { id: "region", label: "¿De qué región es tu sazón?", options: REGIONES },
  { id: "dieta", label: "¿Alguna restricción alimentaria?", options: ["De todo", "Vegetariano", "Vegano", "Sin gluten", "Sin lácteos"] },
];

// Mapea cada opción de dieta visible al tag interno con el que se etiquetan los platos del catálogo.
const DIETA_TAGS = {
  "Vegetariano": "vegetariano",
  "Vegano": "vegano",
  "Sin gluten": "sinGluten",
  "Sin lácteos": "sinLacteos",
};

// "De todo" o cualquier valor desconocido no filtra nada.
function cumpleDieta(plato, dietaLabel) {
  const tag = DIETA_TAGS[dietaLabel];
  if (!tag) return true;
  return !!plato.dieta?.includes(tag);
}

// ── CATÁLOGO LOCAL ────────────────────────────────────────────────────────────
// Respaldo curado por región, usado cuando la API falla o no hay internet para
// que el usuario nunca se quede sin sugerencia. Cada región tiene su propio set
// de platos típicos; "Bogotá" es la región por defecto y la más completa.
const CATALOGO = {
  "Bogotá": {
  desayuno: [
    { nombre: "Huevos pericos con arepa", descripcion: "Huevos revueltos con cebolla larga y tomate, con arepa asada y queso campesino.", ingredientes: ["Huevos", "Cebolla larga", "Tomate", "Arepa", "Queso"], saludable: true, economico: true, rapido: true, tip: "Cocina el tomate y la cebolla antes de echar el huevo.", dieta: ["vegetariano", "sinGluten"] },
    { nombre: "Calentado bogotano", descripcion: "Arroz, frijoles y carne salteados, con arepa y huevo frito encima.", ingredientes: ["Arroz", "Frijoles", "Carne", "Arepa", "Huevo"], saludable: false, economico: true, rapido: true, tip: "Aprovecha las sobras de la noche anterior.", dieta: ["sinGluten", "sinLacteos"] },
    { nombre: "Changua santafereña", descripcion: "Sopa de leche caliente con huevo pochado, cebolla larga y cilantro, con calado.", ingredientes: ["Leche", "Huevos", "Cebolla larga", "Cilantro", "Calado"], saludable: true, economico: true, rapido: true, tip: "Apaga el fuego apenas cuaje el huevo.", dieta: ["vegetariano"] },
    { nombre: "Caldo de costilla con papa", descripcion: "Caldo levanta-muertos de costilla con papa entera y cilantro.", ingredientes: ["Costilla", "Papa pastusa", "Cilantro", "Cebolla", "Arepa"], saludable: false, economico: true, rapido: false, tip: "Sírvelo bien caliente con arepa y café.", dieta: ["sinGluten", "sinLacteos"] },
    { nombre: "Chocolate santafereño con almojábanas", descripcion: "Chocolate caliente espumoso con almojábanas tibias y queso para hundir.", ingredientes: ["Chocolate", "Leche", "Almojábanas", "Queso", "Pan"], saludable: false, economico: false, rapido: true, tip: "Bate el chocolate con molinillo para la espuma.", dieta: ["vegetariano"] },
    { nombre: "Arepa de huevo", descripcion: "Arepa rellena de huevo y fritada hasta quedar dorada y crocante.", ingredientes: ["Masa de maíz", "Huevos", "Aceite", "Sal", "Suero"], saludable: false, economico: true, rapido: true, tip: "Sella bien los bordes para que el huevo no se salga.", dieta: ["vegetariano", "sinGluten"] },
    { nombre: "Huevos tibios con tostadas", descripcion: "Huevos tibios en pocillo con tostadas de pan y mantequilla.", ingredientes: ["Huevos", "Pan", "Mantequilla", "Sal", "Café"], saludable: true, economico: true, rapido: true, tip: "3 minutos en agua hirviendo para la yema cremosa.", dieta: ["vegetariano"] },
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
    { nombre: "Carne asada con papa y ensalada", descripcion: "Churrasco a la plancha con papa criolla dorada y ensalada fresca.", ingredientes: ["Carne", "Papa criolla", "Lechuga", "Tomate", "Cebolla"], saludable: true, economico: false, rapido: false, tip: "Deja reposar la carne 5 min antes de cortarla.", dieta: ["sinGluten", "sinLacteos"] },
    { nombre: "Fríjoles vegetarianos con arroz y patacón", descripcion: "Fríjol cargamanto guisado con verduras, sin carne, con arroz blanco y patacón.", ingredientes: ["Frijol cargamanto", "Plátano", "Arroz", "Aguacate", "Zanahoria"], saludable: true, economico: true, rapido: false, tip: "Un sofrito de cebolla y zanahoria le da sabor sin necesidad de carne.", dieta: ["vegetariano", "vegano", "sinGluten", "sinLacteos"] },
    { nombre: "Lentejas guisadas con arroz y aguacate", descripcion: "Lentejas guisadas con zanahoria y cebolla, con arroz blanco y aguacate.", ingredientes: ["Lentejas", "Arroz", "Zanahoria", "Cebolla", "Aguacate"], saludable: true, economico: true, rapido: false, tip: "No agregues sal hasta que las lentejas estén blandas.", dieta: ["vegetariano", "vegano", "sinGluten", "sinLacteos"] },
    { nombre: "Garbanzos guisados con arroz y ensalada", descripcion: "Garbanzos guisados en hogao con arroz blanco y ensalada fresca.", ingredientes: ["Garbanzos", "Arroz", "Tomate", "Cebolla", "Lechuga"], saludable: true, economico: true, rapido: false, tip: "Remoja los garbanzos la noche anterior si los usas secos.", dieta: ["vegetariano", "vegano", "sinGluten", "sinLacteos"] },
  ],
  cena: [
    { nombre: "Caldo de costilla", descripcion: "Caldo de costilla de res con papa entera y mucho cilantro fresco.", ingredientes: ["Costilla", "Papa", "Cilantro", "Cebolla", "Ajo"], saludable: true, economico: true, rapido: false, tip: "Retira la espuma al hervir para un caldo más limpio.", dieta: ["sinGluten", "sinLacteos"] },
    { nombre: "Changua bogotana", descripcion: "Sopa de leche con huevos pochados, cebolla larga y cilantro, con calado.", ingredientes: ["Leche", "Huevos", "Cebolla larga", "Cilantro", "Calado"], saludable: false, economico: true, rapido: true, tip: "Cuaja el huevo justo antes de servir.", dieta: ["vegetariano"] },
    { nombre: "Crema de ahuyama", descripcion: "Crema suave de ahuyama con un toque de queso y crostones de pan.", ingredientes: ["Ahuyama", "Cebolla", "Caldo", "Crema", "Pan"], saludable: true, economico: true, rapido: false, tip: "Licúala bien caliente para una textura sedosa.", dieta: ["vegetariano"] },
    { nombre: "Sopa de pasta con verduras", descripcion: "Sopa ligera de pasta con zanahoria, papa y cilantro.", ingredientes: ["Pasta", "Zanahoria", "Papa", "Cilantro", "Caldo"], saludable: true, economico: true, rapido: true, tip: "Añade la pasta al final para que no se pase.", dieta: ["vegetariano", "vegano", "sinLacteos"] },
    { nombre: "Patacones con hogao y queso", descripcion: "Patacones crocantes con hogao y queso costeño rallado.", ingredientes: ["Plátano verde", "Tomate", "Cebolla", "Queso", "Aceite"], saludable: false, economico: true, rapido: true, tip: "Fríe el plátano dos veces, aplastándolo en medio.", dieta: ["vegetariano", "sinGluten"] },
    { nombre: "Tortilla de huevo con ensalada", descripcion: "Tortilla esponjosa con cebolla y tomate, con ensalada verde.", ingredientes: ["Huevos", "Cebolla", "Tomate", "Lechuga", "Pan"], saludable: true, economico: true, rapido: true, tip: "Cocina a fuego medio-bajo para que quede jugosa.", dieta: ["vegetariano", "sinLacteos"] },
    { nombre: "Caldo de papa con huevo", descripcion: "Caldo sencillo de papa con huevo escalfado, cebolla larga y cilantro.", ingredientes: ["Papa", "Huevos", "Cebolla larga", "Cilantro", "Ajo"], saludable: false, economico: true, rapido: true, tip: "Escalfa el huevo directo en el caldo hirviendo.", dieta: ["vegetariano", "sinGluten", "sinLacteos"] },
    { nombre: "Arepa rellena de huevo y queso", descripcion: "Arepa asada rellena de huevo revuelto con queso fundido.", ingredientes: ["Arepa", "Huevos", "Queso", "Mantequilla", "Sal"], saludable: false, economico: true, rapido: true, tip: "Tapa la arepa para que el queso se derrita.", dieta: ["vegetariano", "sinGluten"] },
    { nombre: "Sopa de avena con pollo", descripcion: "Sopa cremosa de avena en hojuelas con pollo desmechado y verduras.", ingredientes: ["Avena", "Pollo", "Zanahoria", "Cebolla", "Cilantro"], saludable: true, economico: true, rapido: false, tip: "La avena espesa el caldo sin necesidad de harina.", dieta: ["sinGluten", "sinLacteos"] },
    { nombre: "Sopa de lentejas con verduras", descripcion: "Sopa de lentejas con zanahoria, papa, cebolla y cilantro.", ingredientes: ["Lentejas", "Zanahoria", "Papa", "Cilantro", "Cebolla"], saludable: true, economico: true, rapido: false, tip: "Licúa una parte de la sopa para que quede más espesa.", dieta: ["vegetariano", "vegano", "sinGluten", "sinLacteos"] },
    { nombre: "Patacones con guacamole", descripcion: "Patacones crocantes acompañados de guacamole fresco con limón.", ingredientes: ["Plátano verde", "Aguacate", "Tomate", "Cebolla", "Limón"], saludable: true, economico: true, rapido: true, tip: "Machaca el aguacate justo antes de servir para que no se oxide.", dieta: ["vegetariano", "vegano", "sinGluten", "sinLacteos"] },
  ],
  }, // fin Bogotá

  "Tolima": {
    desayuno: [
      { nombre: "Tamal tolimense con chocolate", descripcion: "Tamal de masa de maíz con pollo, cerdo y verduras, envuelto en hoja de plátano.", ingredientes: ["Masa de maíz", "Pollo", "Cerdo", "Arveja", "Hoja de plátano"], saludable: false, economico: false, rapido: false, tip: "Caliéntalo al vapor 20 min para que quede jugoso.", dieta: ["sinGluten", "sinLacteos"] },
      { nombre: "Envuelto de mazorca con queso", descripcion: "Bollo de mazorca tierna rellena de queso, envuelto en hoja y cocido al vapor.", ingredientes: ["Mazorca", "Queso", "Mantequilla", "Sal", "Hoja de plátano"], saludable: true, economico: true, rapido: false, tip: "No abras el envuelto hasta que se enfríe un poco, así no se desarma.", dieta: ["vegetariano", "sinGluten"] },
      { nombre: "Arepa tolimense con aguacate", descripcion: "Arepa tolimense asada con aguacate machacado y tomate fresco.", ingredientes: ["Arepa tolimense", "Aguacate", "Tomate", "Sal", "Limón"], saludable: true, economico: true, rapido: true, tip: "Exprime el limón justo antes de servir para que el aguacate no se oxide.", dieta: ["vegetariano", "vegano", "sinGluten", "sinLacteos"] },
    ],
    almuerzo: [
      { nombre: "Lechona tolimense", descripcion: "Cerdo horneado relleno de arroz, arveja y especias, plato insignia del Tolima.", ingredientes: ["Cerdo", "Arroz", "Arveja", "Papa", "Especias"], saludable: false, economico: false, rapido: false, tip: "Acompáñala con insulso (arepa de maíz pelado) como se hace tradicionalmente.", dieta: ["sinGluten", "sinLacteos"] },
      { nombre: "Viudo de pescado bocachico", descripcion: "Bocachico envuelto en hoja de plátano con yuca, papa y cilantro, cocido al vapor.", ingredientes: ["Bocachico", "Plátano", "Yuca", "Papa", "Cilantro"], saludable: true, economico: false, rapido: false, tip: "Sella bien la hoja de plátano para que no se escape el vapor.", dieta: ["sinGluten", "sinLacteos"] },
      { nombre: "Arroz tolimense con verduras y aguacate", descripcion: "Arroz salteado con zanahoria y arveja, servido con aguacate.", ingredientes: ["Arroz", "Zanahoria", "Arveja", "Aguacate", "Cebolla"], saludable: true, economico: true, rapido: true, tip: "Sofríe bien la cebolla antes de añadir el arroz para más sabor.", dieta: ["vegetariano", "vegano", "sinGluten", "sinLacteos"] },
    ],
    cena: [
      { nombre: "Mondongo tolimense", descripcion: "Sopa espesa de mondongo con papa, yuca, zanahoria y cilantro.", ingredientes: ["Mondongo", "Papa", "Yuca", "Zanahoria", "Cilantro"], saludable: false, economico: true, rapido: false, tip: "Cocina el mondongo a fuego lento hasta que esté bien blando.", dieta: ["sinGluten", "sinLacteos"] },
      { nombre: "Changua con calado tolimense", descripcion: "Sopa de leche con huevo pochado, cebolla larga y cilantro, con calado.", ingredientes: ["Leche", "Huevos", "Cebolla larga", "Cilantro", "Calado"], saludable: true, economico: true, rapido: true, tip: "Apaga el fuego apenas cuaje el huevo.", dieta: ["vegetariano"] },
      { nombre: "Arepa tolimense con aguacate y tomate", descripcion: "Arepa tolimense asada con aguacate machacado y tomate fresco.", ingredientes: ["Arepa tolimense", "Aguacate", "Tomate", "Sal", "Limón"], saludable: true, economico: true, rapido: true, tip: "Exprime el limón justo antes de servir para que el aguacate no se oxide.", dieta: ["vegetariano", "vegano", "sinGluten", "sinLacteos"] },
    ],
  },

  "Antioquia": {
    desayuno: [
      { nombre: "Calentado paisa con chorizo", descripcion: "Arroz y frijoles del día anterior salteados con chorizo, arepa y huevo.", ingredientes: ["Arroz", "Frijoles", "Chorizo", "Arepa", "Huevo"], saludable: false, economico: true, rapido: true, tip: "Aprovecha las sobras de la noche anterior.", dieta: ["sinGluten", "sinLacteos"] },
      { nombre: "Arepa antioqueña con aguacate", descripcion: "Arepa blanca asada con aguacate machacado y tomate fresco.", ingredientes: ["Arepa antioqueña", "Aguacate", "Tomate", "Sal", "Limón"], saludable: true, economico: true, rapido: true, tip: "Exprime el limón justo antes de servir para que el aguacate no se oxide.", dieta: ["vegetariano", "vegano", "sinGluten", "sinLacteos"] },
      { nombre: "Mazamorra antioqueña con panela", descripcion: "Maíz cocido en leche con panela y canela, desayuno tradicional paisa.", ingredientes: ["Maíz", "Leche", "Panela", "Canela"], saludable: true, economico: true, rapido: false, tip: "Cocina el maíz el día anterior para que esté bien blando.", dieta: ["vegetariano", "sinGluten"] },
    ],
    almuerzo: [
      { nombre: "Bandeja paisa", descripcion: "Frijoles, arroz, chicharrón, carne molida y huevo, el plato más representativo de Antioquia.", ingredientes: ["Frijol", "Arroz", "Chicharrón", "Carne molida", "Huevo"], saludable: false, economico: false, rapido: false, tip: "El chicharrón al final para que quede crocante.", dieta: ["sinGluten", "sinLacteos"] },
      { nombre: "Mondongo antioqueño", descripcion: "Sopa espesa de mondongo con papa, yuca, zanahoria y cilantro.", ingredientes: ["Mondongo", "Papa", "Yuca", "Zanahoria", "Cilantro"], saludable: false, economico: true, rapido: false, tip: "Cocina el mondongo a fuego lento hasta que esté bien blando.", dieta: ["sinGluten", "sinLacteos"] },
      { nombre: "Fríjoles antioqueños con arroz y aguacate", descripcion: "Fríjol cargamanto guisado con verduras, sin carne, con arroz y aguacate.", ingredientes: ["Frijol cargamanto", "Arroz", "Plátano", "Aguacate", "Zanahoria"], saludable: true, economico: true, rapido: false, tip: "Un sofrito de cebolla y zanahoria le da sabor sin necesidad de carne.", dieta: ["vegetariano", "vegano", "sinGluten", "sinLacteos"] },
    ],
    cena: [
      { nombre: "Arepa paisa con frijoles", descripcion: "Arepa antioqueña acompañada de frijoles, queso y aguacate.", ingredientes: ["Arepa antioqueña", "Frijol", "Queso", "Cebolla", "Aguacate"], saludable: true, economico: true, rapido: true, tip: "Calienta los frijoles del almuerzo para no empezar de cero.", dieta: ["vegetariano", "sinGluten"] },
      { nombre: "Sancocho de gallina antioqueño", descripcion: "Sancocho con presa de gallina, yuca, plátano, papa y cilantro.", ingredientes: ["Gallina", "Yuca", "Plátano", "Papa", "Cilantro"], saludable: true, economico: false, rapido: false, tip: "Cocina la gallina a fuego lento para un caldo con cuerpo.", dieta: ["sinGluten", "sinLacteos"] },
      { nombre: "Patacón con guacamole", descripcion: "Patacón crocante acompañado de guacamole fresco con limón.", ingredientes: ["Plátano verde", "Aguacate", "Tomate", "Cebolla", "Limón"], saludable: true, economico: true, rapido: true, tip: "Machaca el aguacate justo antes de servir para que no se oxide.", dieta: ["vegetariano", "vegano", "sinGluten", "sinLacteos"] },
    ],
  },

  "Costa Atlántica": {
    desayuno: [
      { nombre: "Arepa de huevo costeña", descripcion: "Arepa de maíz frita y rellena de huevo, clásico desayuno costeño.", ingredientes: ["Masa de maíz", "Huevos", "Aceite", "Sal", "Suero"], saludable: false, economico: true, rapido: true, tip: "Sella bien los bordes para que el huevo no se salga.", dieta: ["vegetariano", "sinGluten"] },
      { nombre: "Mote de queso", descripcion: "Sopa cremosa de ñame con queso costeño, cebolla y cilantro.", ingredientes: ["Ñame", "Queso", "Leche", "Cebolla", "Cilantro"], saludable: true, economico: true, rapido: false, tip: "Machaca un poco el ñame contra la olla para que la sopa espese sola.", dieta: ["vegetariano", "sinGluten"] },
      { nombre: "Carimañola con guiso de verduras", descripcion: "Buñuelo de yuca rellena de un guiso de tomate, cebolla y pimentón.", ingredientes: ["Yuca", "Tomate", "Cebolla", "Pimentón", "Aceite"], saludable: true, economico: true, rapido: false, tip: "Amasa la yuca caliente para que sea más fácil de moldear.", dieta: ["vegetariano", "vegano", "sinGluten", "sinLacteos"] },
    ],
    almuerzo: [
      { nombre: "Sancocho de mariscos costeño", descripcion: "Sancocho con pescado y camarón, yuca, plátano y cilantro.", ingredientes: ["Pescado", "Camarón", "Yuca", "Plátano", "Cilantro"], saludable: true, economico: false, rapido: false, tip: "Agrega los mariscos al final para que no se pasen de cocción.", dieta: ["sinGluten", "sinLacteos"] },
      { nombre: "Arroz de lisa", descripcion: "Arroz cocido con pescado lisa ahumado, coco y cebolla.", ingredientes: ["Arroz", "Lisa", "Coco", "Cebolla", "Ajo"], saludable: false, economico: true, rapido: false, tip: "Desmenuza bien el pescado para que se reparta en todo el arroz.", dieta: ["sinGluten"] },
      { nombre: "Arroz con coco y fríjol de cabecita negra", descripcion: "Arroz cocido en leche de coco con fríjol de cabecita negra, sin carne.", ingredientes: ["Arroz", "Coco", "Fríjol de cabecita negra", "Cebolla", "Ajo"], saludable: true, economico: true, rapido: false, tip: "Tuesta el coco rallado antes de exprimirlo para más sabor.", dieta: ["vegetariano", "vegano", "sinGluten", "sinLacteos"] },
    ],
    cena: [
      { nombre: "Pescado frito con patacón", descripcion: "Pescado frito entero con patacón y limón.", ingredientes: ["Pescado", "Plátano verde", "Limón", "Ajo", "Aceite"], saludable: true, economico: false, rapido: false, tip: "Marina el pescado con limón y ajo unos minutos antes de freírlo.", dieta: ["sinGluten", "sinLacteos"] },
      { nombre: "Butifarra con bollo de yuca", descripcion: "Butifarra costeña a la parrilla acompañada de bollo de yuca.", ingredientes: ["Butifarra", "Yuca", "Cebolla", "Limón", "Hoja de plátano"], saludable: false, economico: true, rapido: false, tip: "Sirve la butifarra bien caliente, recién salida de la parrilla.", dieta: ["sinGluten", "sinLacteos"] },
      { nombre: "Patacones con guacamole costeño", descripcion: "Patacones crocantes acompañados de guacamole fresco con limón.", ingredientes: ["Plátano verde", "Aguacate", "Tomate", "Cebolla", "Limón"], saludable: true, economico: true, rapido: true, tip: "Machaca el aguacate justo antes de servir para que no se oxide.", dieta: ["vegetariano", "vegano", "sinGluten", "sinLacteos"] },
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
      { nombre: "Mute santandereano", descripcion: "Sopa espesa de maíz, garbanzo, papa y carne, típica de Santander.", ingredientes: ["Maíz", "Garbanzo", "Papa", "Carne", "Cilantro"], saludable: true, economico: true, rapido: false, tip: "Remoja el maíz y el garbanzo la noche anterior para que se cocinen más rápido.", dieta: ["sinGluten", "sinLacteos"] },
      { nombre: "Arepa santandereana con aguacate", descripcion: "Arepa de maíz pelao con aguacate machacado y tomate fresco.", ingredientes: ["Arepa de maíz pelao", "Aguacate", "Tomate", "Sal"], saludable: true, economico: true, rapido: true, tip: "Ásala en sartén bien caliente para que quede crocante por fuera.", dieta: ["vegetariano", "vegano", "sinGluten", "sinLacteos"] },
    ],
    almuerzo: [
      { nombre: "Cabro guisado santandereano", descripcion: "Carne de cabro guisada con papa, cebolla y tomate, servida con arroz.", ingredientes: ["Cabro", "Papa", "Cebolla", "Tomate", "Arroz"], saludable: false, economico: false, rapido: false, tip: "Marina la carne de cabro desde la noche anterior para suavizar su sabor fuerte.", dieta: ["sinGluten", "sinLacteos"] },
      { nombre: "Pepitoria santandereana", descripcion: "Guiso de vísceras de cabro con arroz, arveja y cilantro.", ingredientes: ["Vísceras de cabro", "Arroz", "Arveja", "Cilantro", "Ajo"], saludable: false, economico: true, rapido: false, tip: "Pica bien fino todos los ingredientes, así es la pepitoria tradicional.", dieta: ["sinGluten", "sinLacteos"] },
      { nombre: "Arroz santandereano con fríjol y aguacate", descripcion: "Arroz con fríjol guisado y aguacate, sin carne.", ingredientes: ["Arroz", "Fríjol", "Aguacate", "Cebolla", "Zanahoria"], saludable: true, economico: true, rapido: false, tip: "Un sofrito de cebolla y zanahoria le da sabor sin necesidad de carne.", dieta: ["vegetariano", "vegano", "sinGluten", "sinLacteos"] },
    ],
    cena: [
      { nombre: "Bagre asado santandereano", descripcion: "Bagre asado marinado en limón, ajo y cilantro.", ingredientes: ["Bagre", "Limón", "Ajo", "Cilantro", "Aceite"], saludable: true, economico: false, rapido: false, tip: "Marina el bagre al menos 20 minutos antes de asarlo.", dieta: ["sinGluten", "sinLacteos"] },
      { nombre: "Arepa santandereana con aguacate y limón", descripcion: "Arepa de maíz pelao con aguacate machacado y un toque de limón.", ingredientes: ["Arepa de maíz pelao", "Aguacate", "Limón", "Sal"], saludable: true, economico: true, rapido: true, tip: "Exprime el limón justo antes de servir para que el aguacate no se oxide.", dieta: ["vegetariano", "vegano", "sinGluten", "sinLacteos"] },
      { nombre: "Sopa de arroz con costilla santandereana", descripcion: "Sopa ligera de arroz con costilla, papa y cilantro.", ingredientes: ["Costilla", "Arroz", "Papa", "Cilantro", "Cebolla"], saludable: true, economico: true, rapido: false, tip: "Retira la espuma al hervir para un caldo más limpio.", dieta: ["sinGluten", "sinLacteos"] },
    ],
  },

  "Eje Cafetero": {
    desayuno: [
      { nombre: "Arepa valluna con aguacate", descripcion: "Arepa de maíz blanco asada con aguacate machacado y tomate fresco.", ingredientes: ["Arepa valluna", "Aguacate", "Tomate", "Sal", "Limón"], saludable: true, economico: true, rapido: true, tip: "Exprime el limón justo antes de servir para que el aguacate no se oxide.", dieta: ["vegetariano", "vegano", "sinGluten", "sinLacteos"] },
      { nombre: "Aborrajados de plátano maduro", descripcion: "Plátano maduro frito, bañado en una mezcla de harina y huevo.", ingredientes: ["Plátano maduro", "Harina de trigo", "Huevo", "Aceite", "Azúcar"], saludable: false, economico: true, rapido: true, tip: "Fríe a fuego medio para que se dore sin quemarse antes de cocinar por dentro.", dieta: ["vegetariano", "sinLacteos"] },
      { nombre: "Pandebono cafetero con chocolate", descripcion: "Pandebono recién horneado con chocolate caliente.", ingredientes: ["Pandebono", "Chocolate", "Leche", "Queso"], saludable: false, economico: true, rapido: false, tip: "Sirve el pandebono recién horneado, cuando aún está tibio y suave.", dieta: ["vegetariano"] },
    ],
    almuerzo: [
      { nombre: "Sancocho valluno", descripcion: "Sancocho de gallina con yuca, plátano, papa y cilantro.", ingredientes: ["Gallina", "Yuca", "Plátano", "Papa", "Cilantro"], saludable: true, economico: false, rapido: false, tip: "Cocina la gallina a fuego lento para un caldo con cuerpo.", dieta: ["sinGluten", "sinLacteos"] },
      { nombre: "Fríjoles con garra cafeteros", descripcion: "Fríjoles guisados con garra de res, arroz, plátano y aguacate.", ingredientes: ["Fríjol", "Garra de res", "Arroz", "Plátano", "Aguacate"], saludable: false, economico: true, rapido: false, tip: "Cocina la garra aparte hasta que esté bien blanda antes de mezclarla.", dieta: ["sinGluten", "sinLacteos"] },
      { nombre: "Fríjoles cafeteros con arroz y aguacate", descripcion: "Fríjoles guisados sin carne, con arroz, plátano y aguacate.", ingredientes: ["Fríjol", "Arroz", "Aguacate", "Plátano", "Zanahoria"], saludable: true, economico: true, rapido: false, tip: "Un sofrito de cebolla y zanahoria le da sabor sin necesidad de carne.", dieta: ["vegetariano", "vegano", "sinGluten", "sinLacteos"] },
    ],
    cena: [
      { nombre: "Tamal vallecaucano", descripcion: "Tamal de masa de maíz con pollo, cerdo y verduras, envuelto en hoja de plátano.", ingredientes: ["Masa de maíz", "Pollo", "Cerdo", "Arveja", "Hoja de plátano"], saludable: false, economico: false, rapido: false, tip: "Caliéntalo al vapor 20 min para que quede jugoso.", dieta: ["sinGluten", "sinLacteos"] },
      { nombre: "Arepa valluna con hogao y queso", descripcion: "Arepa valluna con hogao de tomate y cebolla, cubierta de queso.", ingredientes: ["Arepa valluna", "Tomate", "Cebolla", "Queso", "Aceite"], saludable: true, economico: true, rapido: true, tip: "Cocina el hogao a fuego lento para que el tomate suelte todo su sabor.", dieta: ["vegetariano", "sinGluten"] },
      { nombre: "Sopa de plátano cafetera", descripcion: "Sopa ligera de plátano con papa, cebolla y cilantro.", ingredientes: ["Plátano", "Papa", "Cebolla", "Cilantro", "Caldo de verduras"], saludable: true, economico: true, rapido: true, tip: "Licúa una parte de la sopa para que quede más espesa.", dieta: ["vegetariano", "vegano", "sinGluten", "sinLacteos"] },
    ],
  },
};

// Elige un plato del catálogo local de la región que cumpla la dieta, evitando los del historial reciente.
function pickFromCatalogo(tiempo, historial = [], dieta = "De todo", region = "Bogotá") {
  const platosRegion = CATALOGO[region] || CATALOGO["Bogotá"];
  const todos = platosRegion[tiempo] || [];
  const aptos = todos.filter(d => cumpleDieta(d, dieta));
  const lista = aptos.length ? aptos : todos;
  if (!lista.length) return null;
  const nombresRecientes = historial.map(h => h.nombre);
  const frescos = lista.filter(d => !nombresRecientes.includes(d.nombre));
  const pool = frescos.length ? frescos : lista;
  return { ...pool[Math.floor(Math.random() * pool.length)], _local: true };
}

// ── PERSISTENCIA ──────────────────────────────────────────────────────────────
// El plan del día (contexto, comidas y recetas ya generadas) se guarda en
// localStorage con la fecha. Al recargar el mismo día se restaura; al cambiar
// de día se descarta y empieza limpio.
const STORAGE_KEY = "qch:plan";
const hoyISO = () => new Date().toISOString().slice(0, 10);

function loadSnapshot() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.fecha !== hoyISO()) return null; // es de otro día → no restaurar
    return data;
  } catch (e) {
    return null;
  }
}

// El historial de comidas vive aparte del plan del día: a diferencia de
// `qch:plan`, NO se descarta al cambiar de día — así el backend puede usarlo
// para evitar repeticiones y balancear la alimentación entre varios días.
const HISTORIAL_KEY = "qch:historial";
const HISTORIAL_MAX = 21; // ~7 días de desayuno/almuerzo/cena

function loadHistorial() {
  try {
    const raw = localStorage.getItem(HISTORIAL_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

// ── SKELETONS ─────────────────────────────────────────────────────────────────
function MealCardSkeleton() {
  return (
    <div className="meal-card__content">
      <div className="skeleton skeleton--title" />
      <div className="skeleton skeleton--line" style={{ width: "92%" }} />
      <div className="skeleton skeleton--line" style={{ width: "78%", marginBottom: "16px" }} />
      <div className="skeleton-row">
        <div className="skeleton skeleton--chip" />
        <div className="skeleton skeleton--chip" style={{ width: "60px" }} />
      </div>
    </div>
  );
}

function RecipeSkeleton() {
  return (
    <div>
      <div className="skeleton skeleton--line" style={{ width: "40%", height: "16px", marginBottom: "14px" }} />
      <div className="skeleton skeleton--block" />
      <div className="skeleton skeleton--block" />
      <div className="skeleton skeleton--block" style={{ width: "88%", marginBottom: "20px" }} />
      <div className="skeleton skeleton--line" style={{ width: "35%", height: "16px", marginBottom: "14px" }} />
      <div className="skeleton skeleton--block" style={{ height: "70px" }} />
    </div>
  );
}

// ── MODAL DE RECETA COMPLETA ──────────────────────────────────────────────────
function RecipeModal({ meal, tiempo, onClose, onLoadReceta, loadingReceta }) {
  const info = TIEMPO_LABELS[tiempo];
  const receta = meal?.receta;
  const [pasoActivo, setPasoActivo] = useState(null);
  const [doneSteps, setDoneSteps] = useState({});
  const [timers, setTimers] = useState({});

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Cronómetro por paso
  useEffect(() => {
    const interval = setInterval(() => {
      setTimers(prev => {
        const next = { ...prev };
        let changed = false;
        Object.keys(next).forEach(k => {
          if (next[k].running && next[k].remaining > 0) {
            next[k] = { ...next[k], remaining: next[k].remaining - 1 };
            if (next[k].remaining === 0) next[k].running = false;
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const startTimer = (idx, minutos) => {
    setTimers(prev => ({ ...prev, [idx]: { total: minutos * 60, remaining: minutos * 60, running: true } }));
  };
  const toggleTimer = (idx) => {
    setTimers(prev => ({ ...prev, [idx]: { ...prev[idx], running: !prev[idx].running } }));
  };
  const toggleDone = (idx) => {
    setDoneSteps(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };
  const timerPct = (idx) => {
    const t = timers[idx];
    if (!t) return 0;
    return Math.round(((t.total - t.remaining) / t.total) * 100);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal modal--${tiempo}`} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal__header">
          <div className="modal__header-top">
            <div className="modal__badge">
              <span className="modal__emoji">{info.emoji}</span>
              <span className="modal__kicker">{info.label}</span>
            </div>
            <button className="modal__close" onClick={onClose}>✕</button>
          </div>
          <h2 className="modal__title">{meal.nombre}</h2>
          <p className="modal__desc">{meal.descripcion}</p>
          {receta && (
            <div className="modal__meta">
              <span>⏱ {receta.tiempo_total} min</span>
              <span>👥 {receta.porciones}</span>
              <span>📊 {receta.dificultad}</span>
            </div>
          )}
        </div>

        <div className="modal__body">
          {!receta && !loadingReceta && (
            <div className="modal__cta" style={{ textAlign: "center", padding: "24px 0" }}>
              <p style={{ fontSize: "14px", color: "var(--cafe-soft)", marginBottom: "16px" }}>
                ¿Quieres ver la receta paso a paso?
              </p>
              <button className="btn btn--recipe" style={{ width: "auto", padding: "12px 24px" }} onClick={onLoadReceta}>
                📋 Cargar receta completa
              </button>
            </div>
          )}

          {loadingReceta && <RecipeSkeleton />}

          {receta && (
            <>
              {/* Ingredientes */}
              <section className="recipe-section">
                <h3 className="recipe-section__title"><i>🛒</i> Ingredientes</h3>
                <div className="ingredients-grid">
                  {receta.ingredientes.map((ing, i) => (
                    <div className="ingredient-row" key={i}>
                      <span className="ingredient-row__nombre">{ing.nombre}</span>
                      <span className="ingredient-row__cantidad">{ing.cantidad} {ing.unidad}</span>
                    </div>
                  ))}
                </div>
                {receta.utensilios?.length > 0 && (
                  <div className="utensilios">
                    <strong>🍳 Utensilios:</strong> {receta.utensilios.join(", ")}
                  </div>
                )}
              </section>

              {/* Pasos */}
              <section className="recipe-section">
                <h3 className="recipe-section__title"><i>👨‍🍳</i> Preparación</h3>
                {receta.pasos.map((paso, i) => {
                  const timer = timers[i];
                  const timerDone = timer && timer.remaining === 0;
                  const done = !!doneSteps[i];
                  const active = pasoActivo === i;
                  return (
                    <div key={i} className={`paso ${active ? "paso--active" : ""} ${done ? "paso--done" : ""}`}>
                      <div className="paso__header">
                        <button className="paso__check" onClick={() => toggleDone(i)}>
                          {done ? "✓" : i + 1}
                        </button>
                        <div style={{ flex: 1 }}>
                          <p className="paso__texto" onClick={() => setPasoActivo(active ? null : i)}>
                            {paso.descripcion}
                          </p>

                          {/* Cronómetro por paso */}
                          {paso.tiempo_minutos > 0 && active && (
                            <div className="paso__timer">
                              {!timer ? (
                                <button className="timer-start" onClick={() => startTimer(i, paso.tiempo_minutos)}>
                                  ▶ Cronómetro · {paso.tiempo_minutos} min
                                </button>
                              ) : (
                                <div className="timer-display">
                                  <div className="timer-display__top">
                                    <span className={`timer-count ${timerDone ? "timer-count--done" : ""}`}>
                                      {timerDone ? "¡Listo!" : formatTime(timer.remaining)}
                                    </span>
                                    <div className="timer-actions">
                                      {!timerDone && (
                                        <button className="timer-btn" onClick={() => toggleTimer(i)}>
                                          {timer.running ? "Pausar" : "Seguir"}
                                        </button>
                                      )}
                                      <button className="timer-btn" onClick={() => startTimer(i, paso.tiempo_minutos)}>↺</button>
                                    </div>
                                  </div>
                                  <div className="timer-bar">
                                    <div className="timer-bar__fill" style={{ width: `${timerPct(i)}%` }} />
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {paso.tip && active && (
                            <div className="paso__tip"><span>💡</span> {paso.tip}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </section>

              {/* Valor nutricional */}
              {receta.valor_nutricional && (
                <section className="recipe-section">
                  <h3 className="recipe-section__title"><i>🥗</i> Nutrición por porción</h3>
                  <div className="nutri-grid">
                    {Object.entries(receta.valor_nutricional).map(([k, v]) => (
                      <div className="nutri-item" key={k}>
                        <span className="nutri-item__val">{v}</span>
                        <span className="nutri-item__key">{k}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── TARJETA DE COMIDA ─────────────────────────────────────────────────────────
function MealCard({ tiempo, meal, loading, onGenerate, contexto, onVerReceta }) {
  const info = TIEMPO_LABELS[tiempo];
  return (
    <div className={`meal-card meal-card--${tiempo}`}>
      <div className="meal-card__header">
        <span className="meal-card__emoji">{info.emoji}</span>
        <div>
          <h2 className="meal-card__title">{info.label}</h2>
          <span className="meal-card__hora">{info.hora}</span>
        </div>
        <span className="meal-card__sub">{info.sub}</span>
      </div>

      {loading && !meal ? (
        <MealCardSkeleton />
      ) : meal ? (
        <div className="meal-card__content">
          <h3 className="meal-card__name">{meal.nombre}</h3>
          <p className="meal-card__desc">{meal.descripcion}</p>
          <div className="meal-card__tags">
            {meal.saludable && <span className="tag tag--green">Saludable</span>}
            {meal.economico && <span className="tag tag--gold">Económico</span>}
            {meal.rapido && <span className="tag tag--blue">Rápido</span>}
          </div>
          <div className="meal-card__ingredientes">
            <strong>Necesitas</strong>
            <ul>
              {meal.ingredientes?.map((ing, i) => <li key={i}>{ing}</li>)}
            </ul>
          </div>
          {meal.tip && (
            <div className="meal-card__tip"><span>💡</span> {meal.tip}</div>
          )}
          {meal.fallback && (
            <div className="meal-card__fallback">
              <span>⚠ Sugerencia sin conexión</span>
              <button className="meal-card__retry" onClick={() => onGenerate(tiempo, contexto)} disabled={loading}>
                Reintentar
              </button>
            </div>
          )}
          <div className="meal-card__actions">
            <button className="btn btn--recipe" onClick={() => onVerReceta(tiempo)}>
              Ver receta
            </button>
            <button className="btn btn--secondary" onClick={() => onGenerate(tiempo, contexto)} disabled={loading}>
              ↻ Otra
            </button>
          </div>
        </div>
      ) : (
        <div className="meal-card__empty">
          <p>¿Qué vas a {tiempo === "desayuno" ? "desayunar" : tiempo === "almuerzo" ? "almorzar" : "cenar"} hoy?</p>
          <button className="btn btn--primary" onClick={() => onGenerate(tiempo, contexto)} disabled={loading}>
            Sugerir {info.label}
          </button>
        </div>
      )}
    </div>
  );
}

// ── APP PRINCIPAL ─────────────────────────────────────────────────────────────
export default function BogotaMealPlanner() {
  const snap = typeof window !== "undefined" ? loadSnapshot() : null;

  const [contexto, setContexto] = useState(snap?.contexto ?? { personas: "2 personas", tiempo: "20-40 min", mercado: "Lo básico", region: "Bogotá", dieta: "De todo" });
  const [meals, setMeals] = useState(snap?.meals ?? { desayuno: null, almuerzo: null, cena: null });
  const [loading, setLoading] = useState({ desayuno: false, almuerzo: false, cena: false });
  const [loadingAll, setLoadingAll] = useState(false);
  const [showConfig, setShowConfig] = useState(snap ? !!snap.showConfig : true);
  const [dia, setDia] = useState("");
  const [historial, setHistorial] = useState(typeof window !== "undefined" ? loadHistorial() : []);
  const [modalTiempo, setModalTiempo] = useState(null);
  const [loadingReceta, setLoadingReceta] = useState(false);

  // Controla peticiones en curso por comida para descartar respuestas viejas.
  const reqRef = useRef({});

  useEffect(() => {
    const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    setDia(dias[new Date().getDay()]);
  }, []);

  // Persiste el plan del día (incluye las recetas ya cargadas dentro de meals).
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ fecha: hoyISO(), contexto, meals, showConfig }));
    } catch (e) { /* almacenamiento no disponible */ }
  }, [contexto, meals, showConfig]);

  // Persiste el historial aparte, sin reiniciarlo al cambiar de día.
  useEffect(() => {
    try {
      localStorage.setItem(HISTORIAL_KEY, JSON.stringify(historial));
    } catch (e) { /* almacenamiento no disponible */ }
  }, [historial]);

  const generateMeal = async (tiempo, ctx) => {
    // Cancela cualquier petición anterior de esta comida y marca esta como la vigente.
    if (reqRef.current[tiempo]?.ctrl) reqRef.current[tiempo].ctrl.abort();
    const ctrl = new AbortController();
    const seq = (reqRef.current[tiempo]?.seq || 0) + 1;
    reqRef.current[tiempo] = { ctrl, seq };
    const esVigente = () => reqRef.current[tiempo]?.seq === seq;

    setLoading(prev => ({ ...prev, [tiempo]: true }));
    try {
      const response = await fetch(`${API_URL}/api/sugerir-comida`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: ctrl.signal,
        body: JSON.stringify({ tiempo, contexto: ctx, historial, dia }),
      });
      const parsed = await response.json();
      if (!response.ok || !parsed?.nombre) throw new Error(parsed?.error || "Respuesta del servidor no válida");
      // Normaliza por si faltan campos
      const meal = {
        nombre: parsed.nombre,
        descripcion: parsed.descripcion || "",
        ingredientes: Array.isArray(parsed.ingredientes) ? parsed.ingredientes : [],
        saludable: !!parsed.saludable,
        economico: !!parsed.economico,
        rapido: !!parsed.rapido,
        tip: parsed.tip || "",
      };
      if (!esVigente()) return; // llegó una respuesta vieja → ignórala
      setMeals(prev => ({ ...prev, [tiempo]: meal }));
      setHistorial(prev => [
        { nombre: meal.nombre, tiempo, fecha: hoyISO(), saludable: meal.saludable },
        ...prev,
      ].slice(0, HISTORIAL_MAX));
    } catch (err) {
      if (err.name === "AbortError" || !esVigente()) return; // cancelada o reemplazada
      // Fallback elegante: usa el catálogo local y ofrece reintentar.
      console.error("Generación falló, usando catálogo local:", err);
      const local = pickFromCatalogo(tiempo, historial, ctx?.dieta, ctx?.region);
      if (local) {
        setMeals(prev => ({ ...prev, [tiempo]: { ...local, fallback: true } }));
        setHistorial(prev => [
          { nombre: local.nombre, tiempo, fecha: hoyISO(), saludable: !!local.saludable },
          ...prev,
        ].slice(0, HISTORIAL_MAX));
      }
    } finally {
      if (esVigente()) setLoading(prev => ({ ...prev, [tiempo]: false }));
    }
  };

  const loadReceta = async (tiempo) => {
    const meal = meals[tiempo];
    if (!meal || meal.receta) return;
    setLoadingReceta(true);
    try {
      const response = await fetch(`${API_URL}/api/receta-completa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: meal.nombre, personas: contexto.personas, region: contexto.region }),
      });
      const receta = await response.json();
      if (!response.ok) throw new Error(receta?.error || "No se pudo cargar la receta");
      setMeals(prev => ({ ...prev, [tiempo]: { ...prev[tiempo], receta } }));
    } catch (err) {
      console.error(err);
    }
    setLoadingReceta(false);
  };

  const generateAll = async () => {
    setLoadingAll(true);
    setShowConfig(false);
    await Promise.all(Object.keys(meals).map(t => generateMeal(t, contexto)));
    setLoadingAll(false);
  };

  const resetDay = () => {
    setMeals({ desayuno: null, almuerzo: null, cena: null });
    setShowConfig(true);
  };

  return (
    <div className="app">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800;900&family=Nunito:wght@400;500;600;700;800&display=swap');

        :root {
          /* Neutros cálidos */
          --crema: #FDF6EC;
          --surface: #FFFFFF;
          --cafe: #3F2616;
          --cafe-soft: #8A7058;
          --line: rgba(63, 38, 22, 0.09);

          /* Marca */
          --terra: #C25B28;
          --terra-d: #9A3D1C;
          --amar: #E0922A;
          --verde: #3A7D44;
          --verde-d: #2C5E34;
          --noche: #3E5C76;
          --danger: #A23B2B;

          /* Acentos por comida */
          --acc-des: #D98521;  --acc-des-soft: #FBE8CF;
          --acc-alm: #C25B28;  --acc-alm-soft: #F7E0D2;
          --acc-cen: #3E5C76;  --acc-cen-soft: #DCE6EE;

          /* Tags */
          --tag-green-bg: rgba(58,125,68,0.12);   --tag-green-fg: #2C5E34;
          --tag-gold-bg: rgba(224,146,42,0.16);   --tag-gold-fg: #9A5A12;
          --tag-blue-bg: rgba(62,92,118,0.13);    --tag-blue-fg: #34506A;

          /* Sombras y formas */
          --sh-1: 0 1px 2px rgba(63,38,22,0.04), 0 6px 18px rgba(63,38,22,0.07);
          --sh-2: 0 2px 6px rgba(63,38,22,0.06), 0 16px 34px rgba(63,38,22,0.12);
          --r-card: 22px;
          --r-md: 14px;
          --r-sm: 10px;
          --ease-spring: cubic-bezier(0.34, 1.4, 0.64, 1);
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #EDE3D2; }

        /* En iOS/Android, los botones sin este reset muestran un resaltado táctil o una
           selección de texto nativa que se queda pintada encima del contenido al tocar. */
        button {
          -webkit-tap-highlight-color: transparent;
          -webkit-user-select: none;
          user-select: none;
          touch-action: manipulation;
        }

        .app {
          min-height: 100vh;
          max-width: 460px;
          margin: 0 auto;
          background: var(--crema);
          font-family: 'Nunito', sans-serif;
          color: var(--cafe);
          padding-bottom: 30px;
        }

        /* ───────── HEADER ───────── */
        .header {
          position: relative;
          overflow: hidden;
          padding: 26px 22px 30px;
          color: #FFF6EA;
          border-radius: 0 0 28px 28px;
          background-color: var(--terra-d);
          background-image:
            repeating-linear-gradient(45deg, rgba(244,167,43,0.10) 0 2px, transparent 2px 12px),
            repeating-linear-gradient(-45deg, rgba(0,0,0,0.05) 0 2px, transparent 2px 12px),
            linear-gradient(135deg, var(--terra) 0%, var(--terra-d) 100%);
          box-shadow: 0 14px 30px rgba(154,61,28,0.22);
        }
        .header__row { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
        .header__kicker { font-size: 11px; font-weight: 800; letter-spacing: 0.18em; text-transform: uppercase; opacity: 0.78; margin-bottom: 6px; }
        .header__title { font-family: 'Playfair Display', serif; font-weight: 800; font-size: 30px; line-height: 1.04; letter-spacing: -0.01em; }
        .header__sub { margin-top: 14px; font-size: 13.5px; line-height: 1.45; max-width: 300px; opacity: 0.9; }
        .header__dia-wrap { text-align: right; flex-shrink: 0; padding-top: 4px; }
        .header__dia-label { font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; opacity: 0.7; }
        .header__dia { font-family: 'Playfair Display', serif; font-weight: 700; font-size: 19px; margin-top: 2px; }

        /* ───────── CONFIG ───────── */
        .config-panel {
          margin: 18px 16px 4px;
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 20px;
          padding: 18px;
          box-shadow: var(--sh-1);
          animation: qch-up 0.4s ease both;
        }
        .config-panel__head { display: flex; align-items: center; gap: 9px; margin-bottom: 16px; }
        .config-panel__icon { width: 34px; height: 34px; border-radius: var(--r-sm); background: linear-gradient(135deg, #FBE8CF, #F6D2AE); display: flex; align-items: center; justify-content: center; font-size: 17px; }
        .config-panel__title { font-family: 'Playfair Display', serif; font-weight: 700; font-size: 16px; }
        .config-panel__hint { font-size: 11.5px; color: var(--cafe-soft); }
        .config-item { margin-bottom: 14px; }
        .config-item label { display: block; font-size: 11px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; color: var(--cafe-soft); margin-bottom: 8px; }
        .config-options { display: flex; flex-wrap: wrap; gap: 8px; }
        .config-btn {
          min-height: 40px; padding: 9px 14px; border-radius: var(--r-sm);
          border: 1.5px solid var(--line); background: var(--surface); color: var(--cafe-soft);
          font-family: 'Nunito', sans-serif; font-weight: 700; font-size: 12.5px; cursor: pointer;
          display: inline-flex; align-items: center; gap: 5px;
          transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease, transform 0.1s ease;
        }
        /* (hover: hover) evita el "hover pegado" en pantallas táctiles: sin mouse no hay
           mouseleave, así que un :hover sin esta condición se queda activo después del tap
           y su mayor especificidad CSS termina pisando el color de texto de --active. */
        @media (hover: hover) {
          .config-btn:hover { border-color: var(--terra); color: var(--terra); }
        }
        .config-btn:active { transform: scale(0.95); }
        .config-btn:focus-visible { outline: 2px solid var(--terra); outline-offset: 1px; }
        .config-btn--active, .config-btn--active:hover { background: var(--terra); border-color: var(--terra); color: #fff; box-shadow: 0 3px 9px rgba(194,91,40,0.28); }
        .config-btn--active::before { content: '✓'; font-size: 11px; line-height: 1; }

        /* ───────── ACTIONS ───────── */
        .actions { padding: 16px 16px 4px; display: flex; flex-direction: column; gap: 10px; }

        /* ───────── BOTONES ───────── */
        .btn {
          width: 100%; border: none; border-radius: 13px; cursor: pointer;
          font-family: 'Nunito', sans-serif; font-weight: 800; font-size: 14px;
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          transition: transform 0.15s, box-shadow 0.15s, filter 0.15s;
        }
        .btn:disabled { opacity: 0.55; cursor: not-allowed; }

        .btn--gold { padding: 15px; font-size: 15.5px; color: #fff; background: linear-gradient(135deg, var(--amar), #C2701B); box-shadow: 0 5px 16px rgba(224,146,42,0.4); }
        .btn--gold:hover:not(:disabled) { transform: translateY(-1px); filter: brightness(1.04); }

        .btn--primary { padding: 12px; color: #fff; background: var(--terra); box-shadow: 0 4px 12px rgba(63,38,22,0.14); }
        .btn--primary:hover:not(:disabled) { transform: translateY(-1px); filter: brightness(1.06); }

        .btn--recipe { padding: 12px; color: #fff; background: linear-gradient(135deg, var(--verde), var(--verde-d)); box-shadow: 0 4px 12px rgba(58,125,68,0.32); }
        .btn--recipe:hover:not(:disabled) { transform: translateY(-1px); filter: brightness(1.05); }

        .btn--secondary { padding: 12px 14px; width: auto; font-weight: 700; font-size: 13px; color: var(--terra); background: var(--crema); border: 1.5px solid rgba(194,91,40,0.22); }
        .btn--secondary:hover:not(:disabled) { background: rgba(194,91,40,0.07); border-color: var(--terra); }

        .btn--danger { padding: 11px; font-weight: 700; font-size: 13px; color: var(--danger); background: transparent; border: 1.5px solid rgba(162,59,43,0.28); }
        .btn--danger:hover:not(:disabled) { background: rgba(162,59,43,0.06); border-color: var(--danger); }

        /* ───────── CARDS ───────── */
        .cards-container { padding: 14px 16px 0; display: flex; flex-direction: column; gap: 14px; }
        .meal-card {
          background: var(--surface); border: 1px solid var(--line);
          border-radius: var(--r-card); overflow: hidden;
          box-shadow: var(--sh-1); animation: qch-up 0.45s ease both;
        }
        .meal-card--desayuno { --accent: var(--acc-des); --accent-soft: var(--acc-des-soft); }
        .meal-card--almuerzo { --accent: var(--acc-alm); --accent-soft: var(--acc-alm-soft); }
        .meal-card--cena     { --accent: var(--acc-cen); --accent-soft: var(--acc-cen-soft); }

        .meal-card__header {
          position: relative; display: flex; align-items: center; gap: 12px;
          padding: 14px 16px; background: var(--accent-soft); border-bottom: 1px solid var(--line);
        }
        .meal-card__header::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 5px; background: var(--accent); }
        .meal-card__emoji { width: 40px; height: 40px; border-radius: 12px; background: var(--surface); box-shadow: 0 2px 6px rgba(63,38,22,0.10); display: flex; align-items: center; justify-content: center; font-size: 20px; }
        .meal-card__title { font-family: 'Playfair Display', serif; font-weight: 700; font-size: 17px; line-height: 1; }
        .meal-card__hora { font-size: 11px; font-weight: 700; color: var(--accent); letter-spacing: 0.03em; }
        .meal-card__sub { margin-left: auto; font-size: 11px; font-weight: 700; color: var(--cafe-soft); opacity: 0.7; }

        .meal-card__empty { padding: 22px 16px; text-align: center; }
        .meal-card__empty p { font-size: 13.5px; color: var(--cafe-soft); margin-bottom: 14px; }
        .meal-card__empty .btn--primary { width: auto; padding: 11px 22px; background: var(--accent); }

        .meal-card__content { padding: 16px; }
        .meal-card__name { font-family: 'Playfair Display', serif; font-weight: 700; font-size: 21px; line-height: 1.12; margin-bottom: 6px; }
        .meal-card__desc { font-size: 13px; line-height: 1.5; color: var(--cafe-soft); margin-bottom: 12px; }

        .meal-card__tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 13px; }
        .tag { padding: 4px 10px; border-radius: 8px; font-size: 11.5px; font-weight: 800; }
        .tag--green { background: var(--tag-green-bg); color: var(--tag-green-fg); }
        .tag--gold  { background: var(--tag-gold-bg);  color: var(--tag-gold-fg); }
        .tag--blue  { background: var(--tag-blue-bg);  color: var(--tag-blue-fg); }

        .meal-card__ingredientes { background: var(--crema); border: 1px solid var(--line); border-radius: 13px; padding: 11px 12px; margin-bottom: 13px; }
        .meal-card__ingredientes strong { display: block; font-size: 10px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: var(--cafe-soft); margin-bottom: 8px; }
        .meal-card__ingredientes ul { list-style: none; display: flex; flex-wrap: wrap; gap: 6px; }
        .meal-card__ingredientes li { background: var(--surface); border: 1px solid var(--line); border-radius: 8px; padding: 4px 9px; font-size: 12px; font-weight: 600; }

        .meal-card__tip { display: flex; gap: 8px; background: rgba(224,146,42,0.10); border-radius: 11px; padding: 9px 11px; margin-bottom: 14px; font-size: 12.5px; line-height: 1.45; }

        .meal-card__fallback { display: flex; align-items: center; gap: 8px; font-size: 11.5px; font-weight: 700; color: var(--danger); background: rgba(162,59,43,0.07); border: 1px solid rgba(162,59,43,0.18); border-radius: 10px; padding: 8px 11px; margin-bottom: 14px; }
        .meal-card__retry { margin-left: auto; background: none; border: none; color: var(--danger); font-family: 'Nunito', sans-serif; font-weight: 800; font-size: 11.5px; cursor: pointer; text-decoration: underline; }
        .meal-card__retry:disabled { opacity: 0.5; cursor: not-allowed; text-decoration: none; }

        .meal-card__actions { display: flex; gap: 8px; }
        .meal-card__actions .btn--recipe { flex: 1; }

        /* ───────── SKELETONS ───────── */
        .skeleton { border-radius: 8px; background: linear-gradient(90deg, #F0E6D6 8%, #F8F1E5 22%, #F0E6D6 36%); background-size: 200% 100%; animation: qch-shimmer 1.3s linear infinite; }
        .skeleton--title { height: 22px; width: 62%; margin-bottom: 12px; }
        .skeleton--line  { height: 13px; border-radius: 7px; margin-bottom: 7px; }
        .skeleton--chip  { height: 24px; width: 72px; border-radius: 7px; }
        .skeleton--block { height: 42px; border-radius: 11px; margin-bottom: 9px; }
        .skeleton-row { display: flex; gap: 8px; margin-top: 9px; }

        /* ───────── MODAL ───────── */
        .modal-overlay {
          position: fixed; inset: 0; z-index: 100;
          background: rgba(40,22,11,0.5); backdrop-filter: blur(3px);
          display: flex; align-items: flex-end; justify-content: center;
          animation: qch-fade 0.25s ease;
        }
        .modal {
          width: 100%; max-width: 460px; max-height: 90vh; overflow-y: auto;
          background: var(--crema); border-radius: 26px 26px 0 0;
          animation: qch-slideup 0.34s var(--ease-spring);
        }
        .modal--desayuno { --accent: var(--acc-des); --accent-soft: var(--acc-des-soft); }
        .modal--almuerzo { --accent: var(--acc-alm); --accent-soft: var(--acc-alm-soft); }
        .modal--cena     { --accent: var(--acc-cen); --accent-soft: var(--acc-cen-soft); }

        .modal__header { position: sticky; top: 0; z-index: 5; padding: 18px 18px 16px; background: var(--accent-soft); border-bottom: 1px solid var(--line); }
        .modal__header-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
        .modal__badge { display: flex; align-items: center; gap: 9px; }
        .modal__emoji { width: 38px; height: 38px; border-radius: 11px; background: var(--surface); box-shadow: 0 2px 6px rgba(63,38,22,0.10); display: flex; align-items: center; justify-content: center; font-size: 18px; }
        .modal__kicker { font-size: 11px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; color: var(--accent); }
        .modal__close { width: 32px; height: 32px; border-radius: 50%; border: none; cursor: pointer; background: rgba(63,38,22,0.10); color: var(--cafe); font-size: 14px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
        .modal__close:hover { background: rgba(63,38,22,0.18); }
        .modal__title { font-family: 'Playfair Display', serif; font-weight: 800; font-size: 25px; line-height: 1.08; margin-bottom: 6px; }
        .modal__desc { font-size: 13px; line-height: 1.45; color: var(--cafe-soft); margin-bottom: 12px; }
        .modal__meta { display: flex; gap: 7px; flex-wrap: wrap; }
        .modal__meta span { background: var(--surface); border-radius: 9px; padding: 6px 11px; font-size: 12px; font-weight: 700; box-shadow: 0 1px 3px rgba(63,38,22,0.06); }
        .modal__body { padding: 18px; }

        /* Secciones de receta */
        .recipe-section { margin-bottom: 22px; }
        .recipe-section__title { display: flex; align-items: center; gap: 8px; font-family: 'Playfair Display', serif; font-weight: 700; font-size: 16px; color: var(--terra); margin-bottom: 12px; }
        .recipe-section__title i { width: 22px; height: 22px; border-radius: 7px; background: var(--accent-soft); display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-style: normal; }

        /* Ingredientes en tabla rayada */
        .ingredients-grid { display: flex; flex-direction: column; gap: 5px; margin-bottom: 14px; background: var(--surface); border: 1px solid var(--line); border-radius: var(--r-md); padding: 6px; box-shadow: var(--sh-1); }
        .ingredient-row { display: flex; align-items: center; justify-content: space-between; padding: 9px 11px; border-radius: 9px; }
        .ingredient-row:nth-child(odd) { background: var(--crema); }
        .ingredient-row__nombre { font-size: 13.5px; font-weight: 600; }
        .ingredient-row__cantidad { font-size: 12.5px; font-weight: 700; color: var(--terra); background: rgba(194,91,40,0.10); padding: 3px 9px; border-radius: 7px; white-space: nowrap; }
        .utensilios { font-size: 12px; color: var(--cafe-soft); background: var(--accent-soft); border-radius: 11px; padding: 9px 12px; line-height: 1.4; }
        .utensilios strong { color: var(--cafe); }

        /* Pasos */
        .paso { background: var(--surface); border: 1.5px solid var(--line); border-radius: 15px; padding: 13px; margin-bottom: 9px; box-shadow: var(--sh-1); transition: border-color 0.2s, box-shadow 0.2s; }
        .paso--active { border-color: var(--accent); box-shadow: 0 4px 16px rgba(63,38,22,0.10); }
        .paso--done { opacity: 0.62; }
        .paso__header { display: flex; gap: 12px; align-items: flex-start; }
        .paso__check { flex-shrink: 0; width: 30px; height: 30px; border-radius: 50%; border: none; cursor: pointer; font-family: 'Nunito', sans-serif; font-weight: 800; font-size: 14px; display: flex; align-items: center; justify-content: center; background: var(--accent-soft); color: var(--accent); transition: all 0.2s; }
        .paso--done .paso__check { background: var(--verde); color: #fff; animation: qch-pop 0.3s ease; }
        .paso__texto { font-size: 14px; line-height: 1.5; cursor: pointer; }
        .paso--done .paso__texto { text-decoration: line-through; text-decoration-color: rgba(58,125,68,0.5); }

        /* Cronómetro */
        .paso__timer { margin-top: 9px; }
        .timer-start { display: inline-flex; align-items: center; gap: 6px; padding: 7px 13px; border: 1.5px solid var(--terra); background: rgba(194,91,40,0.06); color: var(--terra); border-radius: var(--r-sm); cursor: pointer; font-family: 'Nunito', sans-serif; font-weight: 700; font-size: 12.5px; }
        .timer-start:hover { background: var(--terra); color: #fff; }
        .timer-display { background: var(--surface); border: 1px solid var(--line); border-radius: 13px; padding: 11px 13px; box-shadow: var(--sh-1); }
        .timer-display__top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 9px; }
        .timer-count { font-family: 'Playfair Display', serif; font-weight: 800; font-size: 26px; letter-spacing: 0.01em; color: var(--terra); }
        .timer-count--done { color: var(--verde); }
        .timer-actions { display: flex; gap: 7px; }
        .timer-btn { padding: 7px 12px; border: 1.5px solid var(--line); background: var(--crema); color: var(--cafe); border-radius: 9px; cursor: pointer; font-family: 'Nunito', sans-serif; font-weight: 700; font-size: 12px; }
        .timer-bar { height: 7px; border-radius: 99px; background: rgba(63,38,22,0.10); overflow: hidden; }
        .timer-bar__fill { height: 100%; border-radius: 99px; background: linear-gradient(90deg, var(--terra), var(--amar)); transition: width 1s linear; }

        .paso__tip { display: flex; gap: 7px; margin-top: 9px; background: rgba(224,146,42,0.12); border-radius: var(--r-sm); padding: 8px 10px; font-size: 12px; line-height: 1.4; }

        /* Nutrición */
        .nutri-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
        .nutri-item { background: var(--surface); border: 1px solid var(--line); border-radius: 13px; padding: 11px 6px; text-align: center; box-shadow: var(--sh-1); }
        .nutri-item__val { display: block; font-family: 'Playfair Display', serif; font-weight: 800; font-size: 15px; color: var(--terra); line-height: 1; }
        .nutri-item__key { display: block; font-size: 9.5px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: var(--cafe-soft); margin-top: 5px; }

        .footer-note { text-align: center; font-size: 11px; color: var(--cafe-soft); opacity: 0.7; padding: 24px 30px 4px; line-height: 1.6; }

        /* ───────── ANIMACIONES ───────── */
        @keyframes qch-shimmer { 0% { background-position: 100% 0; } 100% { background-position: -100% 0; } }
        @keyframes qch-up { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes qch-pop { 0% { transform: scale(0.6); } 60% { transform: scale(1.18); } 100% { transform: scale(1); } }
        @keyframes qch-slideup { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes qch-fade { from { opacity: 0; } to { opacity: 1; } }
      `}</style>

      <div className="header">
        <div className="header__row">
          <div>
            <div className="header__kicker">Tu cocina bogotana</div>
            <h1 className="header__title">¿Qué comemos<br />hoy?</h1>
          </div>
          {dia && (
            <div className="header__dia-wrap">
              <div className="header__dia-label">Hoy es</div>
              <div className="header__dia">{dia}</div>
            </div>
          )}
        </div>
        <p className="header__sub">Menú del día pensado para tu familia — fresco, rendidor y con sabor de casa.</p>
      </div>

      {showConfig && (
        <div className="config-panel">
          <div className="config-panel__head">
            <span className="config-panel__icon">🧺</span>
            <div>
              <div className="config-panel__title">Cuéntame de tu casa</div>
              <div className="config-panel__hint">Para afinar las sugerencias</div>
            </div>
          </div>
          {PREGUNTAS_CONTEXTO.map(q => (
            <div className="config-item" key={q.id}>
              <label>{q.label}</label>
              <div className="config-options">
                {q.options.map(opt => (
                  <button
                    key={opt}
                    className={`config-btn ${contexto[q.id] === opt ? "config-btn--active" : ""}`}
                    onClick={() => setContexto(prev => ({ ...prev, [q.id]: opt }))}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="actions">
        <button className="btn btn--gold" onClick={generateAll} disabled={loadingAll}>
          ✦ {loadingAll ? "Preparando tu menú..." : "Planear todo el día"}
        </button>
        {Object.values(meals).some(m => m !== null) && (
          <button className="btn btn--danger" onClick={resetDay}>Empezar de nuevo</button>
        )}
      </div>

      <div className="cards-container">
        {Object.keys(meals).map(tiempo => (
          <MealCard
            key={tiempo}
            tiempo={tiempo}
            meal={meals[tiempo]}
            loading={loading[tiempo]}
            onGenerate={generateMeal}
            contexto={contexto}
            onVerReceta={(t) => setModalTiempo(t)}
          />
        ))}
      </div>

      <p className="footer-note">
        Hecho con cariño para las familias de Bogotá<br />
        Toca <b>Ver receta</b> para el paso a paso completo
      </p>

      {/* MODAL */}
      {modalTiempo && meals[modalTiempo] && (
        <RecipeModal
          meal={meals[modalTiempo]}
          tiempo={modalTiempo}
          onClose={() => setModalTiempo(null)}
          onLoadReceta={() => loadReceta(modalTiempo)}
          loadingReceta={loadingReceta}
        />
      )}
    </div>
  );
}
