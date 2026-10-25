# Navegador FCM — cambios v0.2.8

Base: v0.2.7. Sin cambios de datos, nodos, enlaces, planos ni estado de puertas; se conserva la misma clave local de edición.

## Cambios de presentación

- En **Indicaciones** y lectura hablada, **A1** se denomina **planta baja** y **A2** se denomina **primer piso**. Se utilizan artículos y preposiciones naturales según la oración.
- En las indicaciones, **S3** se presenta como **escalera 3** y **AS1** como **ascensor 1** (se aplica también a S1, S4, AS2).
- Las alternativas muestran **Escalera 3** o **Ascensor 1** en vez de **Escalera S3** o **Ascensor AS1**.
- Se corrigió la mención de la escalera S3 en ruta descendente, explicitando las dos ramas escalonadas y el descanso intermedio.

## Corrección del iniciador

- `INICIAR_AUTONOMO.bat`: el mensaje fijo obsoleto v0.2.2 se reemplazó por un texto sin versión; el servidor anuncia la versión correcta.
- `iniciar_servidor.py`: banner y URL de arranque leen automáticamente la versión desde `package.json` (v0.2.8); ya no conservan textos fijos de versiones anteriores.
- Actualizada la identificación de la interfaz y el título de la versión autónoma; nueva clave de caché del service worker y parámetros de versión en el módulo principal para evitar recursos obsoletos.

## Estado y limitaciones

- El modelo geométrico sigue en v0.6 y las rutas mantienen su carácter experimental.
- Se preservó la clave `fcm-prototipo-026-ediciones` para reutilizar los cambios guardados al abrir desde el mismo navegador y puerto.
- Las plantas se identifican internamente como `A1` y `A2`, y los conectores como `S1`, `S3`, `S4`, `AS1`, `AS2`: **solo cambia el texto presentado**.
- El servidor por red local se puede iniciar con el procedimiento validado anteriormente, sin cambios.
