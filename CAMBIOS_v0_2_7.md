# Navegador FCM — 0.2.7 (19/10/2026)

## Nuevas funciones (prioridad smartphone)

1. **Búsqueda predictiva de Origen/Destino**. Los selectores largos se reemplazaron en móvil por un panel de búsqueda por código o dependencia, sin distinguir tildes o mayúsculas. La búsqueda ofrece como máximo 12 coincidencias visibles y muestra el total; solamente consulta destinos con puerta vinculada. En escritorio se conserva la lista tradicional.
2. **Guía manual por pasos (opcional)**. Debajo del itinerario completo aparece «Seguir indicaciones por pasos». Al activarla se resalta una instrucción y se habilita Anterior / Siguiente / Escuchar este paso. La lista completa permanece visible. No es navegación en tiempo real y no detecta automáticamente la posición de la persona.
3. **Cambios de ruta consistentes**. Cambiar origen, destino, alternativa o preferencias detiene la lectura previa y reinicia el índice del paso resaltado.

## Conservado

- **Mismo JSON integrado de v0.2.6** (`FCM_grafo_editado(2).json`): 62 puertas vinculadas, 28 A1 y 34 A2; mismo grafo y coordenadas.
- **Misma clave de almacenamiento local que v0.2.6**, a propósito, para no perder ediciones en el mismo navegador y puerto. Los navegadores/puertos distintos no comparten datos: exportar/importar JSON.
- Administrador, nodos amarillos, movimiento, zoom táctil, asignación asistida, respaldo JSON.
- Voz con Leer / Pausar / Reanudar / Detener y plano plegado en smartphone.

## Advertencias

Los textos siguen siendo **experimentales**, sin giros certificados. Los planos no representan distancias reales. La opción «Evitar escaleras» no implica una certificación integral de accesibilidad. La guía no rastrea ubicación ni avanza automáticamente.

## Pruebas

`npm test` cubre el motor, selección de puertas, voz, búsqueda nueva y consistencia de rutas. La versión autónoma se ejecuta con `INICIAR_AUTONOMO.bat`. React/Vite requiere `npm install` en la PC para compilar.
