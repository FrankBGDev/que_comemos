# Cambio: plato de desayuno vegano agregado a Costa Pacífica

## Archivo modificado

`src/App.jsx` — dentro de `CATALOGO["Costa Pacífica"].desayuno`.

## Diff (snippet exacto agregado)

```diff
       { nombre: "Pandeyuca con queso y jugo de borojó", descripcion: "Pandeyuca horneado con un vaso de jugo de borojó.", ingredientes: ["Yuca", "Queso", "Huevo", "Borojó", "Azúcar"], saludable: true, economico: true, rapido: false, tip: "El borojó es muy ácido y espeso, dilúyelo bien con agua o leche.", dieta: ["vegetariano", "sinGluten"] },
+      { nombre: "Ensalada de frutas tropicales con coco", descripcion: "Banano, piña y papaya picados en cuadros, mezclados con coco rallado y un toque de limón.", ingredientes: ["Banano", "Piña", "Papaya", "Coco rallado", "Limón"], saludable: true, economico: true, rapido: true, tip: "Pica la fruta justo antes de servir para que no suelte tanto jugo.", dieta: ["vegetariano", "vegano", "sinGluten", "sinLacteos"] },
     ],
     almuerzo: [
```

## Reglas de la skill seguidas

- **Región exacta:** se usó la clave literal `"Costa Pacífica"` (una de las 7 en `REGIONES`,
  con tilde y mayúscula correctas), agregando el plato dentro de `CATALOGO["Costa Pacífica"].desayuno`
  sin tocar otras regiones ni el array de `REGIONES`.
- **Tags de dieta (vegano implica vegetariano):** `dieta: ["vegetariano", "vegano", "sinGluten", "sinLacteos"]` —
  ningún ingrediente (banano, piña, papaya, coco, limón) tiene gluten ni lácteos, así que se
  etiquetó también con esos dos tags además del par vegetariano/vegano obligatorio.
- **Verificación de cobertura:** se corrió un script Node ad-hoc que recorre todo `CATALOGO`
  contando combinaciones región×tiempo×dieta vacías; el resultado fue cero combinaciones
  vacías tanto antes como después del cambio — Costa Pacífica/desayuno ya tenía cobertura
  vegana (vía "Arepa de chócolo con panela"), y este plato la refuerza añadiendo el ángulo
  de frutas tropicales que pidió el usuario.
- **Geografía y tienda real:** banano, piña, papaya, coco rallado y limón son ingredientes
  de compra estándar en D1, Éxito o cualquier tienda de barrio en toda Colombia — nada
  exótico ni exclusivo de importación, a diferencia de frutas más regionales como el
  chontaduro que se evitaron a propósito por pedido explícito del usuario ("nada exótico").
- **Formato del objeto plato:** se respetó el shape exacto usado por el resto del catálogo
  (`nombre`, `descripcion`, `ingredientes`, `saludable`, `economico`, `rapido`, `tip`, `dieta`),
  sin agregar ni omitir campos.
