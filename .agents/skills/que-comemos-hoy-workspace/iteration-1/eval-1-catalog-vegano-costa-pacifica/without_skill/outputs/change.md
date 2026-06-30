# Cambio: plato de desayuno vegano para Costa Pacífica

Archivo: `src/App.jsx`, dentro de `CATALOGO["Costa Pacífica"].desayuno`.

## Diff (snippet exacto agregado)

```diff
     "Costa Pacífica": {
       desayuno: [
         { nombre: "Arepa de chócolo con panela", ... dieta: ["vegetariano", "vegano", "sinGluten", "sinLacteos"] },
         { nombre: "Empanada de camarón", ... dieta: ["sinGluten", "sinLacteos"] },
         { nombre: "Pandeyuca con queso y jugo de borojó", ... dieta: ["vegetariano", "sinGluten"] },
+        { nombre: "Avena con banano y piña", descripcion: "Avena cocida con leche de coco, banano en rodajas y trozos de piña fresca.", ingredientes: ["Avena", "Leche de coco", "Banano", "Piña", "Canela"], saludable: true, economico: true, rapido: true, tip: "Agrega la piña al final, fuera del fuego, para que no se amargue.", dieta: ["vegetariano", "vegano", "sinLacteos"] },
       ],
```

## Justificación de decisiones

- **Frutas tropicales, no exóticas**: banano y piña, disponibles en cualquier tienda de barrio o D1, a diferencia de borojó o chontaduro (típicos del Pacífico pero menos comunes fuera de la región).
- **Leche de coco** en vez de leche de vaca, para mantener el plato vegano y darle un toque costeño/pacífico consistente con el resto del catálogo de esa región (encocados, arroz con coco, etc.).
- **Tags de dieta**: `["vegetariano", "vegano", "sinLacteos"]`. No se incluyó `sinGluten` porque la avena comercial estándar no se considera libre de gluten por defecto (riesgo de trazas/contaminación cruzada), siguiendo el criterio de no marcar una restricción alimentaria sin verificarla.
- **saludable: true, economico: true, rapido: true**: avena con fruta es una preparación rápida, económica y saludable, coherente con los demás platos veganos ya etiquetados como saludables en ese catálogo.

## Verificación de cobertura

Antes del cambio, `CATALOGO["Costa Pacífica"].desayuno` ya tenía un plato vegano ("Arepa de chócolo con panela"), por lo que el filtro `dieta` nunca quedaba vacío. Este cambio añade una segunda opción vegana para desayuno en esa región, dando más variedad sin romper la cobertura mínima de region × tiempo × dieta.
