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

Todo se guarda en el `localStorage` del navegador donde se use — no hay
servidor ni base de datos compartida todavía. Eso significa:

- Los datos son por dispositivo/navegador. Si se abre en otro computador o
  celular, empieza desde cero hasta que se cargue un respaldo.
- Conviene descargar respaldos periódicos desde la pestaña **Datos**.
- Borrar los datos del sitio en el navegador borra la flota registrada.

## Próximo paso natural

Conectar `DB.cargar` / `DB.guardar` (en `index.html`) a un backend real
(hoja de cálculo vía Apps Script, o una API propia) para que los datos se
compartan entre dispositivos en vez de vivir solo en el navegador local.
