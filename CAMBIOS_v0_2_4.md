# Navegador FCM — Cambios v0.2.4

Fecha: 19-10-2026. Base: prototipo **v0.2.3**, con el JSON editado por el usuario.
Modelo geométrico: **v0.6** (sin alteraciones estructurales ni planos adicionales).

## Agregados

1. **Asignación asistida de puertas** en Administrador: al seleccionar un nodo amarillo (extremo libre del grafo), aparece el panel con búsqueda por código/nombre, restringida a dependencias sin puerta de esa misma planta.
2. Selección explícita de un resultado y **Confirmar vinculación**. La casilla opcional permite marcar que se comprobó físicamente la puerta. Sin marcarla, queda con validación pendiente.
3. Indicadores de progreso en A1 y A2, calculados sobre los espacios con nombre vigente. Quedan excluidos A223 y A225 (sin asignación administrativa).
4. **Siguiente nodo amarillo** para avanzar y centrar el plano en el siguiente candidato. En smartphone desplaza también la pantalla hasta el mapa.
5. **Desvincular** una puerta ya asociada al nodo, con confirmación previa, y **Deshacer última asignación/desvinculación** durante la sesión de uso.
6. Al cambiar el texto de búsqueda, se borra el candidato seleccionado anteriormente para evitar vinculaciones involuntarias.

## Conservado

- El catálogo anterior, las asignaciones ya verificadas, el JSON de referencia y las coordenadas desplazadas por el usuario.
- Los recorridos A1/A2 y cinco conectores verticales; el trazado y cálculo de rutas siguen siendo **experimentales**.
- Pausa/reanudación de voz, interfaz compacta para smartphone, zoom, parpadeo del nodo, importación y exportación JSON.
- Clave de almacenamiento local de la versión v0.2.3, para mantener las ediciones al actualizar dentro del mismo origen/puerto del navegador.

## Limitaciones y cautelas

- Los nodos amarillos son **posibles puertas**, no puertas físicamente comprobadas. La clasificación usa extremos de ramales; pueden existir falsos candidatos.
- No se asigna automáticamente una dependencia a un nodo ni se reemplaza una asignación existente.
- Las vinculaciones hechas sin confirmar físicamente quedan **pendientes de validación**. La aplicación sigue siendo un prototipo técnico no apto para uso público.
- La opción Deshacer vale solo para la última modificación de puerta y no persiste entre recargas.
- El navegador no sincroniza automáticamente cambios entre equipos ni entre distintos puertos del servidor. Exportar JSON después de cada sesión es indispensable.
- El Administrador carece de autenticación; no publicarlo como editor abierto de la institución.
