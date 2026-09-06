# Fichas técnicas — Flota Palma Grande

Aplicativo de una sola página (sin backend, sin build) para llevar las fichas
técnicas y el mantenimiento preventivo de la flota de Palma Grande S.A.S.:
máquinas de campo (por horómetro) y camiones (por odómetro).

## Qué hace

- Hojas de configuración por modelo: qué filtros y lubricantes lleva, con
  qué referencia, en qué cantidad y cada cuánto se cambian.
- Ficha por equipo con lecturas, bitácora de uso y registro de cambios.
- Tablero con lo vencido y lo próximo, proyectado según el uso diario medido
  de cada equipo.
- Requisición de repuestos, costos, historial y generación de QR e impresión
  de ficha por equipo.
- Respaldo y restauración de todos los datos en un archivo `.json`.

## Cómo correrlo

Es un solo archivo estático (`index.html`) más un manifest y un service
worker para poder instalarlo como app. No necesita servidor ni dependencias.

**Local:**

```bash
python3 -m http.server 8000
# abrir http://localhost:8000
```

(Abrir `index.html` directamente con doble clic también funciona, pero el
service worker y el manifest solo se activan servidos por http/https.)

**Publicarlo (GitHub Pages):**

1. En el repositorio, ir a *Settings → Pages*.
2. Elegir la rama a publicar y la carpeta raíz (`/`).
3. Guardar. GitHub entrega una URL pública.
4. Pegar esa URL en el aplicativo, pestaña **Datos → Dirección del
   aplicativo**, para que los códigos QR de cada equipo abran la ficha
   correspondiente.

## Dónde vive la información

Todo se guarda siempre en el `localStorage` del navegador (funciona sin
internet). Si además se conecta el backend compartido (ver abajo), cada
guardado también se sube a esa hoja de Google, y al abrir el aplicativo en
otro dispositivo se trae lo último guardado allí.

- Sin backend conectado: los datos son por dispositivo/navegador. Conviene
  descargar respaldos periódicos desde la pestaña **Datos**.
- Con backend conectado: los datos operativos (planes, equipos, historial,
  configuración) se comparten entre todos los dispositivos conectados a la
  misma hoja. **Las fotos no se sincronizan** — son pesadas y se quedan solo
  en el dispositivo donde se tomaron.
- Es "el último guardado gana": si dos personas editan al mismo tiempo desde
  distintos dispositivos, se queda el cambio que se guardó más reciente. Para
  el tamaño de esta flota no debería ser un problema, pero conviene saberlo.
- Borrar los datos del sitio en el navegador borra la copia local; si el
  backend está conectado, se puede recuperar con "Sincronizar ahora".

## Backend compartido (Google Sheets + Apps Script)

Para que la flota se vea igual desde cualquier computador o celular, sin
pagar hosting, el backend es un script de Google Apps Script publicado como
aplicación web, que guarda los datos en una hoja de cálculo. El código está
en [`backend/apps-script/Code.gs`](backend/apps-script/Code.gs).

**Desplegarlo:**

1. Crear una hoja de cálculo de Google nueva (puede quedar vacía; el script
   crea su propia pestaña `kv` para guardar los datos).
2. *Extensiones → Apps Script*.
3. Reemplazar el contenido de `Code.gs` por el de este repositorio.
4. Cambiar `SECRET_INICIAL` por una clave propia (cualquier texto largo y
   difícil de adivinar) — es la contraseña que protege quién puede
   leer/escribir la flota la primera vez.
5. *Implementar → Nueva implementación → tipo "Aplicación web"*.
   - Ejecutar como: **Yo** (tu cuenta).
   - Quién tiene acceso: **Cualquier usuario**.
6. Autorizar los permisos que pida Google la primera vez.
7. Copiar la URL que termina en `/exec`.
8. En el aplicativo, pestaña **Datos → Backend compartido**, pegar esa URL y
   la misma clave de `SECRET_INICIAL`, y presionar "Guardar y probar
   conexión".
9. Repetir el paso 8 en cada dispositivo que deba compartir la misma flota.

**Cambiar la clave más adelante:** no hace falta volver a tocar `Code.gs` ni
redesplegar. Desde el aplicativo, **Datos → Backend compartido → Cambiar
clave**, escribir la clave nueva dos veces y confirmar — queda guardada en el
backend (en las Propiedades del script, no en el código) y en este
dispositivo. Después hay que repetir "Guardar y probar conexión" con la
clave nueva en los demás dispositivos que ya estaban conectados; si no,
dejan de poder sincronizar hasta que se actualicen.

Si se vuelve a editar `Code.gs` más adelante, hay que crear una nueva
implementación (o editar la existente desde *Gestionar implementaciones*)
para que el cambio quede publicado en la URL `/exec` — guardar el archivo en
el editor no la actualiza por sí solo.

## Próximo paso natural

El backend actual guarda un único bloque de datos por clave (simple y
suficiente para esta flota). Si el equipo crece mucho o hace falta ver
permisos por usuario, auditoría más fina o edición simultánea sin
sobrescribirse, el siguiente paso sería migrar a una base de datos real
(Firestore, una API propia, etc.) detrás de la misma interfaz `DB` en
`index.html`.
