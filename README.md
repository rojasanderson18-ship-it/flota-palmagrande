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
  comparten entre todos los dispositivos que abran el aplicativo, **incluidas
  las fotos**: al tomar o subir una foto, además de guardarse en el
  dispositivo (para verla sin internet), se sube al backend como archivo en
  una carpeta de Google Drive, y el enlace queda guardado en el propio
  equipo — así cualquier otro dispositivo la ve también. Si el dispositivo
  no tiene el backend conectado, la foto se queda solo ahí.
- Es "el último guardado gana": si dos personas editan al mismo tiempo desde
  distintos dispositivos, se queda el cambio que se guardó más reciente. Para
  el tamaño de esta flota no debería ser un problema, pero conviene saberlo.
- Borrar los datos del sitio en el navegador borra la copia local; se puede
  recuperar con "Sincronizar ahora" en la pestaña Datos.
- En **Datos → Backend compartido** cualquier dispositivo puede, si hace
  falta, usar un backend distinto (por ejemplo para pruebas) o desconectarse
  y trabajar solo con la copia local — ver esa pestaña en el aplicativo.

**Nota de seguridad:** la URL y la clave del backend por defecto están
dentro del propio `index.html` (constante `_bk`, codificada en Base64, no en
texto plano) para que la conexión sea automática y no quede a simple vista
al mirar el código. Aun así, cualquiera con conocimientos técnicos que la
busque a propósito (por ejemplo, con las herramientas de desarrollador del
navegador) puede decodificarla y usarla para leer o escribir los datos del
backend — **esto no es cifrado, es solo ocultarla de un vistazo casual**. No
existe forma de esconderla del todo en una app que corre solo en el
navegador, sin un servidor propio. Se acepta ese riesgo porque la
información es de mantenimiento de flota (filtros, lubricantes, lecturas),
no datos sensibles. Si eso cambia, la única forma de estar realmente
protegido es un servidor intermediario que el navegador nunca vea, en vez
de esta constante en el código (ver "Próximo paso natural" más abajo).

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
8. Generar el valor de `_bk` con este comando (cambie la URL y la clave por
   las suyas):

   ```bash
   python3 -c "
   import base64, json
   d = {'url':'https://script.google.com/macros/s/SU_ID/exec','token':'SU_CLAVE'}
   print(base64.b64encode(json.dumps(d).encode()).decode())
   "
   ```

   También se puede generar desde la consola del navegador (F12):
   ```js
   btoa(JSON.stringify({url:'https://script.google.com/macros/s/SU_ID/exec', token:'SU_CLAVE'}))
   ```
9. En `index.html`, buscar `const _bk = '...'` (cerca de la línea 235) y
   reemplazar el texto entre comillas por el que generó el paso 8.
10. Publicar el cambio (commit + push; si usa GitHub Pages, se actualiza
    sola). Desde ese momento, **cualquier dispositivo que abra el
    aplicativo queda conectado automáticamente**, sin pegar nada a mano.

**Cambiar la clave más adelante:** desde el aplicativo, **Datos → Backend
compartido → Cambiar clave**, escribir la clave nueva dos veces y confirmar
— queda guardada en el backend (Propiedades del script) y como ajuste propio
de ese dispositivo. Pero los demás dispositivos siguen usando la clave vieja
que trae `_bk` en el código, así que además hay que:

1. Generar un nuevo `_bk` con la clave nueva (paso 8 de arriba).
2. Reemplazarlo en `index.html` y publicar (commit + push).

Recién ahí todos los dispositivos vuelven a quedar conectados solos, sin
tener que entrar a cada uno.

Si se vuelve a editar `Code.gs` más adelante, hay que crear una nueva
implementación (o editar la existente desde *Gestionar implementaciones*)
para que el cambio quede publicado en la URL `/exec` — guardar el archivo en
el editor no la actualiza por sí solo.

**Fotos:** el backend crea una carpeta de Google Drive llamada "Fotos flota
— fichas técnicas" (en el Drive de la cuenta que lo desplegó) y guarda ahí
cada foto. La app **no** carga la foto con un enlace directo de Drive
(`drive.google.com/uc?export=view&id=...`) — probamos eso primero y Google
no siempre deja mostrarla así, sobre todo en cuentas de organización. En vez
de eso, cada dispositivo le pide la foto al propio backend (`op=get_foto`),
que responde con los bytes de la imagen ya autenticados con la misma clave
del resto del aplicativo — así funciona sin depender de que Drive permita
compartir el archivo públicamente. Por eso `eq.fotoUrl` en los datos
sincronizados es solo un indicador de "hay foto en el backend", no un
enlace real.

Como usa `DriveApp`, la primera vez que se implemente (o se implemente de
nuevo tras este cambio) Google va a pedir autorizar un permiso adicional
sobre Drive. Si al ejecutar/implementar no aparece esa ventana de permisos,
hay que forzarla ejecutando manualmente una función que use Drive (por
ejemplo `carpetaFotos_`) desde el propio editor de Apps Script: menú
desplegable de funciones (junto al botón ▶️ Ejecutar) → elegirla → Ejecutar
→ ahí sí debería pedir autorización.

Quitar una foto desde el aplicativo la envía a la papelera de ese Drive, no
la borra para siempre de inmediato.

## Próximo paso natural

El backend actual guarda un único bloque de datos por clave (simple y
suficiente para esta flota). Si el equipo crece mucho o hace falta ver
permisos por usuario, auditoría más fina o edición simultánea sin
sobrescribirse, el siguiente paso sería migrar a una base de datos real
(Firestore, una API propia, etc.) detrás de la misma interfaz `DB` en
`index.html`.
