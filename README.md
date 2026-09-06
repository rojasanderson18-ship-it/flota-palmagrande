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
internet). Además, el aplicativo trae puesto por defecto un backend
compartido (ver abajo): cualquier dispositivo que abra la página ya
sincroniza contra la misma hoja de Google, sin configurar nada.

- Los datos operativos (planes, equipos, historial, configuración) se
  comparten entre todos los dispositivos que abran el aplicativo. **Las
  fotos no se sincronizan** — son pesadas y se quedan solo en el dispositivo
  donde se tomaron.
- Es "el último guardado gana": si dos personas editan al mismo tiempo desde
  distintos dispositivos, se queda el cambio que se guardó más reciente. Para
  el tamaño de esta flota no debería ser un problema, pero conviene saberlo.
- Borrar los datos del sitio en el navegador borra la copia local; se puede
  recuperar con "Sincronizar ahora" en la pestaña Datos.
- En **Datos → Backend compartido** cualquier dispositivo puede, si hace
  falta, usar un backend distinto (por ejemplo para pruebas) o desconectarse
  y trabajar solo con la copia local — ver esa pestaña en el aplicativo.

**Nota de seguridad:** la URL y la clave del backend por defecto están
escritas en el propio `index.html` (constante `BACKEND_DEFAULT`) para que la
conexión sea automática. Eso significa que cualquiera que abra la página
pública y mire el código fuente del navegador puede leer esa clave y
usarla para leer o escribir los datos del backend. Se acepta ese riesgo
porque la información es de mantenimiento de flota (filtros, lubricantes,
lecturas), no datos sensibles. Si eso cambia, hay que volver al esquema
donde la clave se pide en pantalla en vez de ir en el código (quitar el
valor por defecto de `BACKEND_DEFAULT`).

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
8. En `index.html`, buscar la constante `BACKEND_DEFAULT` (cerca de la línea
   240) y poner ahí esa URL y la misma clave de `SECRET_INICIAL`.
9. Publicar el cambio (commit + push; si usa GitHub Pages, se actualiza
   sola). Desde ese momento, **cualquier dispositivo que abra el
   aplicativo queda conectado automáticamente**, sin pegar nada a mano.

**Cambiar la clave más adelante:** desde el aplicativo, **Datos → Backend
compartido → Cambiar clave**, escribir la clave nueva dos veces y confirmar
— queda guardada en el backend (Propiedades del script) y como ajuste propio
de ese dispositivo. Pero los demás dispositivos siguen usando la clave vieja
que trae `BACKEND_DEFAULT` en el código, así que además hay que:

1. Actualizar `BACKEND_DEFAULT.token` en `index.html` con la clave nueva.
2. Publicar ese cambio (commit + push).

Recién ahí todos los dispositivos vuelven a quedar conectados solos, sin
tener que entrar a cada uno.

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
