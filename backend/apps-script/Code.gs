/**
 * Backend compartido para "Fichas técnicas — Flota Palma Grande".
 *
 * Guarda el estado completo del aplicativo (planes, equipos, historial,
 * config) como un texto JSON en una hoja de cálculo, para que se comparta
 * entre todos los dispositivos que abran el aplicativo. Las fotos NO pasan
 * por aquí: son pesadas y se quedan solo en el dispositivo donde se toman.
 *
 * ---- Despliegue ----
 * 1. Crear una hoja de cálculo de Google nueva (puede estar vacía).
 * 2. Extensiones > Apps Script.
 * 3. Reemplazar el contenido de Code.gs por este archivo.
 * 4. Cambiar SECRET más abajo por una clave propia (cualquier texto largo).
 * 5. Implementar > Nueva implementación > tipo "Aplicación web".
 *      - Ejecutar como: Yo (tu cuenta).
 *      - Quién tiene acceso: Cualquier usuario.
 * 6. Autorizar los permisos que pida Google.
 * 7. Copiar la URL que termina en /exec.
 * 8. En el aplicativo, pestaña "Datos" > "Backend compartido": pegar esa URL
 *    y la misma clave de SECRET, y guardar.
 *
 * Cada vez que cambie este código hay que crear una "Nueva implementación"
 * (o "Gestionar implementaciones" > editar) para que los cambios se publiquen;
 * guardar el archivo en el editor no actualiza la URL /exec por sí solo.
 */

const SECRET = 'CAMBIAR-ESTA-CLAVE';
const HOJA = 'kv';

function hoja_(){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(HOJA);
  if(!sh){
    sh = ss.insertSheet(HOJA);
    sh.appendRow(['key','value','actualizado']);
  }
  return sh;
}

function filaDe_(sh, key){
  const n = sh.getLastRow() - 1;
  if(n < 1) return null;
  const valores = sh.getRange(2,1,n,1).getValues();
  for(let i=0;i<valores.length;i++) if(valores[i][0] === key) return i+2;
  return null;
}

function json_(obj){
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function autorizado_(token){
  return typeof token === 'string' && token.length > 0 && token === SECRET;
}

function doGet(e){
  const p = (e && e.parameter) || {};
  if(!autorizado_(p.token)) return json_({ok:false, error:'no autorizado'});
  if(p.op === 'get'){
    if(!p.key) return json_({ok:false, error:'falta key'});
    const sh = hoja_();
    const fila = filaDe_(sh, p.key);
    const valor = fila ? sh.getRange(fila,2).getValue() : null;
    return json_({ok:true, value: valor ? String(valor) : null});
  }
  return json_({ok:false, error:'operación desconocida'});
}

function doPost(e){
  const p = (e && e.parameter) || {};
  if(!autorizado_(p.token)) return json_({ok:false, error:'no autorizado'});
  if(p.op === 'set'){
    if(!p.key) return json_({ok:false, error:'falta key'});
    let body = {};
    try{ body = JSON.parse(e.postData.contents); }catch(err){ return json_({ok:false, error:'cuerpo inválido'}); }
    if(typeof body.value !== 'string') return json_({ok:false, error:'falta value'});
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try{
      const sh = hoja_();
      const fila = filaDe_(sh, p.key);
      const ahora = new Date();
      if(fila) sh.getRange(fila,1,1,3).setValues([[p.key, body.value, ahora]]);
      else sh.appendRow([p.key, body.value, ahora]);
    } finally {
      lock.releaseLock();
    }
    return json_({ok:true});
  }
  return json_({ok:false, error:'operación desconocida'});
}
