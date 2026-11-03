import { centavos, fechaValida, puedeVerReportes } from './indicadores.js';
import { listarRegistros, actualizarRegistro } from './baseFase3.js';
import { registrarEvento } from './auditoria.js';
export const filasEjemploLayout = [['fecha','referencia','concepto','tipo','monto','titular'],['2026-10-05','EJEMPLO-BORRAR-01','EJEMPLO — BORRAR ANTES DE CARGAR: cuota casa 12','Ingreso',1500,'Persona ficticia de ejemplo'],['2026-10-22','EJEMPLO-BORRAR-02','EJEMPLO — BORRAR ANTES DE CARGAR: reparación de portón','Egreso',900,'Proveedor ficticio de ejemplo']];
export const administraCortes = perfil => perfil === 'TestTesoreria';
export function periodoMensual(mes) {
 if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(mes||'')) throw new Error('Selecciona el mes completo del corte.');
 const [ano,numero]=mes.split('-').map(Number);return {desde:mes+'-01',hasta:mes+'-'+new Date(ano,numero,0).getDate()};
}
const normalizar = valor => String(valor || '').trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export function leerCsvCorte(texto) {
  if (!texto || texto.length > 1_000_000) throw new Error('El CSV debe contener datos y ocupar como máximo 1 MB.');
  texto = texto.replace(/^\uFEFF/, '');
  const separador = texto.split(/\r?\n/)[0].includes(';') ? ';' : ',';
  const filas = []; let fila = [], campo = '', comillas = false;
  for (let indice = 0; indice < texto.length; indice++) {
    const caracter = texto[indice];
    if (caracter === '"') {
      if (comillas && texto[indice + 1] === '"') { campo += '"'; indice++; }
      else if (comillas) comillas = false;
      else if (!campo.trim()) comillas = true;
      else throw new Error('El CSV tiene comillas sin escapar.');
    } else if (!comillas && (caracter === separador || caracter === '\n')) {
      fila.push(campo.trim()); campo = '';
      if (caracter === '\n') { if (fila.some(valor => valor)) filas.push(fila); fila = []; }
    } else if (caracter !== '\r' || comillas) campo += caracter;
  }
  if (comillas) throw new Error('El CSV contiene un campo entre comillas sin cerrar.');
  fila.push(campo.trim()); if (fila.some(valor => valor)) filas.push(fila);
  const encabezados = (filas.shift() || []).map(normalizar), obligatorios = ['fecha','referencia','concepto','tipo','monto','titular'];
  if (new Set(encabezados).size !== encabezados.length || obligatorios.some(campo => !encabezados.includes(campo))) throw new Error('El CSV debe tener columnas únicas: fecha, referencia, concepto, tipo, monto, titular.');
  if (!filas.length || filas.length > 2000) throw new Error('El corte debe contener de 1 a 2000 movimientos.');
  const repetidos = new Set();
  return filas.map((valores, indice) => {
    if (valores.length !== encabezados.length) throw new Error(`Revisa las columnas del registro ${indice + 2}.`);
    const dato = Object.fromEntries(encabezados.map((campo, posicion) => [campo, valores[posicion]]));
    if(Object.values(dato).some(v=>v.includes('EJEMPLO-BORRAR')))throw new Error('Borra las dos filas de ejemplo antes de cargar el estado bancario.');
    const tipo = normalizar(dato.tipo);
    if (!fechaValida(dato.fecha) || !['ingreso','egreso'].includes(tipo) || !/^\d+(?:[.,]\d{1,2})?$/.test(dato.monto)) throw new Error(`Registro ${indice + 2}: usa fecha AAAA-MM-DD, tipo Ingreso/Egreso y monto positivo sin separador de miles.`);
    const monto = centavos(dato.monto.replace(',','.'));
    if (monto <= 0 || dato.referencia.length > 120 || dato.concepto.length > 500 || dato.titular.length > 160) throw new Error(`Registro ${indice + 2}: monto o contenido no válido.`);
    const huella = JSON.stringify([dato.fecha,normalizar(dato.referencia),normalizar(dato.concepto),normalizar(dato.titular),tipo,monto]);
    if (repetidos.has(huella)) throw new Error(`El registro ${indice + 2} está duplicado. No se importó el archivo.`);
    repetidos.add(huella);
    return { id: String(indice + 1), fecha: dato.fecha, referencia: dato.referencia, concepto: dato.concepto, titular: dato.titular, tipo: tipo === 'ingreso' ? 'Ingreso' : 'Egreso', monto: monto / 100 };
  });
}
export const movimientoBancario = movimiento => ['Transferencia', 'Depósito bancario'].includes(movimiento.formaPago) && !(movimiento.tipoMovimiento === 'Cargo' && movimiento.salida === 'Caja chica');
export function conciliarCorte(filas, movimientos, desde, hasta, asignaciones = {}) {
  if (!fechaValida(desde) || !fechaValida(hasta) || desde > hasta) throw new Error('El periodo de conciliación no es válido.');
  const enPeriodo = dato => dato.fecha >= desde && dato.fecha <= hasta;
  const banco = filas.filter(enPeriodo), sistema = movimientos.filter(movimiento => movimientoBancario(movimiento) && enPeriodo(movimiento));
  const validos = sistema.filter(movimiento => fechaValida(movimiento.fecha) && ['Abono','Cargo'].includes(movimiento.tipoMovimiento) && Number.isFinite(Number(movimiento.monto)) && Number(movimiento.monto) > 0);
  const ids = validos.map(movimiento => movimiento.id), usados = new Set(), alertas = [];
  if (ids.some(id => !id) || new Set(ids).size !== ids.length || validos.length !== sistema.length) alertas.push('Hay movimientos bancarios del sistema con identificadores, tipos o montos inválidos. Revisa las capturas.');
  const repetidosManuales = Object.values(asignaciones).filter(Boolean).filter((id, indice, todos) => todos.indexOf(id) !== indice);
  if (repetidosManuales.length) alertas.push('Una captura fue vinculada a más de un movimiento bancario. Revisa las vinculaciones.');
  const candidatos = fila => validos.filter(movimiento => !usados.has(movimiento.id) && movimiento.fecha === fila.fecha && (movimiento.tipoMovimiento === 'Abono' ? 'Ingreso' : 'Egreso') === fila.tipo && centavos(movimiento.monto) === centavos(fila.monto));
  const resultados = banco.map(fila => ({ ...fila, movimientoId: null, criterio: '' }));
  // Solo las asociaciones confirmadas manualmente se consideran conciliadas.
  resultados.forEach(fila => {
    const id = asignaciones[fila.id];
    if (!id) return;
    if (repetidosManuales.includes(id)) return;
    const movimiento = candidatos(fila).find(item => item.id === id);
    if (movimiento) { fila.movimientoId = movimiento.id; fila.criterio = 'Vinculación manual'; usados.add(movimiento.id); }
    else alertas.push(`La vinculación del registro bancario ${fila.id} dejó de coincidir con fecha, tipo o monto.`);
  });
  resultados.forEach(fila => {
    fila.captura = fila.movimientoId ? validos.find(m=>m.id===fila.movimientoId) : null;
    fila.candidatos = fila.movimientoId ? [] : candidatos(fila).map(item => ({...item, coincidenciaReferencia:Boolean(normalizar(fila.referencia)&&normalizar(fila.referencia)===normalizar(item.referencia)), coincidenciaTitular:Boolean(normalizar(fila.titular)&&normalizar(fila.titular)===normalizar(item.titular))})).sort((a,b)=>(Number(b.coincidenciaReferencia)*2+Number(b.coincidenciaTitular))-(Number(a.coincidenciaReferencia)*2+Number(a.coincidenciaTitular)));
  });
  const total = (datos, tipo, campo) => datos.filter(item => item[campo] === tipo).reduce((suma,item) => suma + centavos(item.monto),0) / 100;
  const ingresosBanco = total(banco,'Ingreso','tipo'), egresosBanco = total(banco,'Egreso','tipo');
  const ingresosSistema = total(validos,'Abono','tipoMovimiento'), egresosSistema = total(validos,'Cargo','tipoMovimiento');
  const pendientes = resultados.filter(fila => !fila.movimientoId), sinBanco = validos.filter(item => !usados.has(item.id));
  return { desde, hasta, resultados, pendientes, sinBanco, ingresosBanco, egresosBanco, ingresosSistema, egresosSistema, diferenciaIngresos: (centavos(ingresosBanco)-centavos(ingresosSistema))/100, diferenciaEgresos: (centavos(egresosBanco)-centavos(egresosSistema))/100, conciliado: banco.length > 0 && pendientes.length === 0 && sinBanco.length === 0 && alertas.length === 0, alertas };
}
export async function consultarCortes(perfil) {
  if (!puedeVerReportes(perfil)) throw new Error('Tu perfil no puede consultar cortes bancarios.');
  return (await listarRegistros('cortes')).sort((a,b) => b.fecha.localeCompare(a.fecha));
}
export async function importarCorte(texto, nombre, perfil, mes, completo = false) {
  if (!administraCortes(perfil)) throw new Error('Solo Tesorería puede importar un corte.');
  const periodo=periodoMensual(mes);if(!completo)throw new Error('Confirma que el archivo corresponde al mes completo.');
  const registros = leerCsvCorte(texto), id = 'corte-'+mes, fecha = new Date().toISOString();
  if(registros.some(r=>r.fecha<periodo.desde||r.fecha>periodo.hasta))throw new Error('El archivo contiene movimientos fuera del mes seleccionado.');
  const existentes=await listarRegistros('cortes');if(existentes.some(c=>c.mes===mes))throw new Error('Ya existe un estado bancario para ese mes. Consulta el corte existente para evitar duplicar asociaciones.');
  const corte = { id, nombre, mes, periodo, mesCompletoConfirmado:true, textoOriginal: texto, registros, asignaciones: {}, fecha, usuario: perfil, version: 1 };
  await actualizarRegistro('cortes',id,actual=>{if(actual)throw new Error('El mes ya fue importado en otra pestaña.');return corte;});
  try { registrarEvento({ modulo:'Reportes',accion:'Importación de corte',registroId:id,usuario:perfil,detalle:`${nombre} · ${registros.length} registros` }); } catch { /* El corte original se conserva en IndexedDB. */ }
  return corte;
}
export async function vincularRegistro(corteId, filaId, movimientoId, movimientos, perfil, version) {
  if (!administraCortes(perfil)) throw new Error('Tu perfil no puede vincular movimientos del corte.');
  return actualizarRegistro('cortes',corteId,corte=>{
    if (!corte || corte.version !== version) throw new Error('El corte cambió. Vuelve a consultarlo antes de guardar.');
    const fila = corte.registros.find(item=>item.id === filaId), movimiento = movimientos.find(item=>item.id === movimientoId);
    if (!fila || (movimientoId && (!movimiento || !movimientoBancario(movimiento) || movimiento.fecha !== fila.fecha || centavos(movimiento.monto) !== centavos(fila.monto) || (movimiento.tipoMovimiento === 'Abono' ? 'Ingreso' : 'Egreso') !== fila.tipo))) throw new Error('La captura debe coincidir en fecha, tipo y monto.');
    if (movimientoId && Object.entries(corte.asignaciones).some(([id,valor])=>id !== filaId && valor === movimientoId)) throw new Error('Esta captura ya está vinculada a otro registro del corte.');
    const asignaciones = { ...corte.asignaciones }; if (movimientoId) asignaciones[filaId]=movimientoId; else delete asignaciones[filaId];
    return { ...corte,asignaciones,version:corte.version+1,historial:[...(corte.historial || []),{fecha:new Date().toISOString(),usuario:perfil,filaId,movimientoId}] };
  });
}
