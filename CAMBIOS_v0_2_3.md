# Cambios v0.2.3 (19/10/2026)

- Botón Pausar/Reanudar para lectura por voz; junto a Leer y Detener. Reanuda el mensaje pausado sin comenzar desde cero (según soporte del navegador).
- La lectura se cancela al cambiar de origen, destino, alternativa o modificar el grafo.
- Modelo base reemplazado por el JSON **FCM_grafo_editado.json** adjuntado por el usuario. Se preservan movimientos de nodos y seis nuevas puertas vinculadas en A2 (A201, A202, A203, A204, A206, A222).
- Se sincronizaron las coordenadas normalizadas y longitudes geométricas de los tramos según el JSON, sin añadir conexiones.
- En el administrador, extremos sin puertas y no reservados para escaleras/ascensores/accesos exteriores aparecen **amarillos**; puertas ya vinculadas verdes, intersecciones azules, selección titilante naranja.
- Filtro opcional para ocultar puntos intermedios. Los candidatos amarillos requieren validación física: no se afirma que todo extremo sea necesariamente una puerta.
- Guardado local con clave de esta versión para evitar que la caché de una versión anterior reemplace automáticamente el nuevo JSON; se conserva la clave antigua como respaldo en el navegador.
- No se cambiaron los planos ni la escala. Las rutas continúan siendo experimentales.
