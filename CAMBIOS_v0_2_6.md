# Navegador FCM — Cambios v0.2.6

Fuente única para las correcciones: `FCM_grafo_editado(2).json` aportado por el usuario.

- 18 nodos movidos: **4 en A1 y 14 en A2**.
- 35 nuevas puertas vinculadas: **8 A1 y 27 A2**; quedan preservadas las 27 previamente asignadas.
- 62 espacios seleccionables: **28 A1 y 34 A2**. Sin puerta: A129, A224 y A232. A223 y A225 siguen sin asignación.
- Longitudes de tramos y coordenadas normalizadas sincronizadas con la posición PDF para todas las conexiones; **la topología del grafo no se alteró**.
- Se conserva el filtro Origen/Destino con puerta asignada; se actualiza inmediatamente al vincular/desvincular desde Administrador.
- Nueva clave del navegador para proteger la versión 0.2.6: `fcm-prototipo-026-ediciones`.
- Caché offline versionada para evitar la reutilización de planos/datos obsoletos.

**Observación geométrica:** A2-N054 fue movido de (425.40, 858.30) a (439.18, 769.41) puntos PDF. Es un traslado grande: revisar que el ramal conectado represente un paso transitable real. No se revirtió este cambio.

Las distancias siguen siendo unidades PDF y los itinerarios continúan siendo experimentales; no están aprobados para orientación pública.

Los datos incorporados y todos los cambios detectados constan en `AUDITORIA_CAMBIOS_v0_2_6.json`.
