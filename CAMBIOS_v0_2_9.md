# Cambios v0.2.9 — CAD A1 y eliminación de AS1

## Agregado
- PDF vectorial CAD de Planta Baja como fondo de mapa.
- PDF independiente con **28 recintos** etiquetados según el catálogo vigente, más leyendas de accesos/escaleras.
- Códigos de recintos generados dinámicamente en la vista interactiva A1; siguen la edición de puertas y nodos.
- Calibración gráfica de Planta Baja por barra 0–20 m; 8,61245 puntos PDF/metro.
- Migrador para importar JSON anteriores sin perder las asignaciones.

## Cambiado
- Coordenadas A1 trasladadas (+218,475211; −63,758539), sin alteración topológica.
- Eliminado el rótulo de escala nominal «1:500», ahora inválido.
- Clave de almacenamiento local independiente para prevenir mezcla de versiones.
- Identificadores y recursos de caché actualizados a v0.2.9.

## Eliminado
- **AS1** del PDF CAD, la lista de conectores verticales, el motor de rutas, los nodos señalizados y los marcadores del mapa. Permanece como nodo de circulación sin etiqueta la posición geométrica anterior, a verificar.

## Conservado
- AS2: único ascensor físico conocido del bloque, de Planta Baja a Primer piso.
- Escaleras S1, S3 y S4.
- 62 destinos con puerta asociada (28 en Planta Baja, 34 en Primer piso).
- Plano y geometría existentes del Primer piso.
- Editor, zoom, búsqueda, voz y rutas experimentales.

## Precauciones
- El PDF de códigos es una copia estática de la fecha de entrega; la vista de aplicación genera etiquetas a partir del JSON que se edite.
- Solo A1 tiene una escala métrica aproximada validada a partir de la barra; no se calculan distancias métricas globales de ambos pisos.
- Los accesos y recorridos siguen siendo experimentales.

## Correcciones de integridad
- La vista interactiva A1 dibuja las etiquetas desde el JSON vivo, evitando que queden fijas al mover puertas.
- Nodo histórico A1-N093 y A2-N099: excluidos de candidatos a puerta para evitar volver a asignar el ascensor inexistente.
- Posiciones normalizadas `x_norm/y_norm` recalculadas automáticamente cuando se mueven o agregan nodos.
- En A2, el rótulo S4 se conservó tras retirar el rótulo As1 del plano anterior.
