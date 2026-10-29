import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { publicarAviso, obtenerAvisos, marcarLectura, resolverAviso, puedeVerAviso, avisoLeido, bandejaAviso, archivarAviso } from '../src/servicios/avisos.js';
import { obtenerBitacora } from '../src/servicios/auditoria.js';
import { guardarResidentes, guardarMovimientos, obtenerMovimientos } from '../src/servicios/almacenamiento.js';
import { tienePermiso, filtrarEventosAuditoria } from '../src/servicios/permisos.js';
const datos = { titulo: 'Aviso de prueba', mensaje: 'Mensaje de prueba', tipo: 'informativo', segmento: 'comunidad' };
beforeEach(() => {
  const almacen = new Map();
  globalThis.localStorage = { getItem: clave => almacen.get(clave) ?? null, setItem: (clave, valor) => almacen.set(clave, valor), removeItem: clave => almacen.delete(clave) };
  globalThis.window = new EventTarget();
});
test('publicación, lectura idempotente y resolución quedan auditadas', () => {
  const aviso = publicarAviso(datos, 'TestPresidente');
  marcarLectura(aviso.id, 'TestUsuario'); marcarLectura(aviso.id, 'TestUsuario');
  assert.equal(obtenerAvisos()[0].lecturas.length, 1);
  resolverAviso(aviso.id, 'TestPresidente'); resolverAviso(aviso.id, 'TestPresidente');
  assert.equal(obtenerAvisos()[0].estado, 'Resuelto');
  assert.deepEqual(obtenerBitacora().map(evento => evento.accion), ['Publicación', 'Lectura', 'Resolución']);
});
test('rechaza publicar o concluir con perfiles no autorizados', () => {
  assert.throws(() => publicarAviso(datos, 'TestUsuario'));
  const aviso = publicarAviso(datos, 'TestAuxiliar');
  for (const perfil of ['TestUsuario','TestAuxiliar','TestTesoreria','TestAuditor']) assert.throws(() => resolverAviso(aviso.id, perfil));
  assert.equal(obtenerAvisos()[0].estado, 'Activo');
});
test('la segmentación impide lecturas ajenas', () => {
  const aviso = publicarAviso({...datos, segmento:'tesoreria'}, 'TestPresidente');
  assert.equal(puedeVerAviso(aviso, 'TestUsuario'), false);
  assert.equal(puedeVerAviso(aviso, 'TestAuxiliar'), false);
  assert.equal(puedeVerAviso(aviso, 'TestTesoreria'), true);
  assert.throws(() => marcarLectura(aviso.id, 'TestUsuario'));
  assert.equal(obtenerAvisos()[0].lecturas.length, 0);
});
test('valida los tres tipos, contenido y fechas temporales', () => {
  for (const vence of ['', '2020-01-01T12:00', 'incorrecta']) assert.throws(() => publicarAviso({...datos,tipo:'temporal',vence}, 'TestPresidente'));
  assert.throws(() => publicarAviso({...datos,titulo:'   '}, 'TestPresidente'));
  assert.throws(() => publicarAviso({...datos,tipo:'otro'}, 'TestPresidente'));
  const aviso = publicarAviso({...datos,tipo:'temporal',vence:'2099-01-01T12:00'}, 'TestPresidente');
  assert.ok(aviso.vence);
  assert.equal(publicarAviso({...datos,tipo:'urgente'}, 'TestPresidente').tipo, 'urgente');
});
test('padrón y pagos registran alta, actualización y baja sin cambiar eventos anteriores', () => {
  localStorage.setItem('los_robles_perfil_prueba','TestTesoreria');
  guardarResidentes([{id:'r1',nombre:'Prueba',vivienda:'A1'}]);
  guardarMovimientos([{id:'p1',tipoMovimiento:'Abono',monto:100,vivienda:'A1'}]);
  const previos = obtenerBitacora();
  guardarMovimientos([{id:'p1',tipoMovimiento:'Abono',monto:150,vivienda:'A1'}]);
  guardarMovimientos([]);
  assert.deepEqual(obtenerBitacora().slice(0,2), previos);
  assert.deepEqual(obtenerBitacora().map(evento => evento.accion), ['Alta','Alta','Actualización','Baja']);
  assert.ok(obtenerBitacora().every(evento => evento.usuario === 'TestTesoreria' && evento.fecha && evento.registroId && evento.resultado));
  assert.equal(obtenerBitacora()[0].detalle.includes('nombre:'), false);
});
test('si falla la bitácora no persiste un pago sin auditoría', () => {
  localStorage.setItem('los_robles_bitacora','contenido corrupto');
  assert.throws(() => guardarMovimientos([{id:'p1',monto:100}]));
  assert.deepEqual(obtenerMovimientos(), []);
});
test('auxiliar, presidente y auditor consultan bitácora completa; tesorería solo pagos', () => {
  for (const perfil of ['TestAuxiliar','TestAuditor','TestTesoreria','TestPresidente']) assert.equal(tienePermiso(perfil,'auditoria'), true);
  for (const perfil of ['TestUsuario','TestAuxiliarTesoreria']) assert.equal(tienePermiso(perfil,'auditoria'), false);
  assert.equal(tienePermiso('TestAuditor','movimientos'), false);
});

test('un aviso leído vuelve sin leer al resolverse y solo se archiva tras leer el cierre', () => {
  const aviso = publicarAviso(datos, 'TestPresidente');
  const actual = () => obtenerAvisos()[0];
  assert.equal(bandejaAviso(actual(), 'TestUsuario'), 'pendientes');
  assert.throws(() => archivarAviso(aviso.id, 'TestUsuario'));
  marcarLectura(aviso.id, 'TestUsuario');
  assert.equal(bandejaAviso(actual(), 'TestUsuario'), 'seguimiento');
  resolverAviso(aviso.id, 'TestPresidente');
  assert.equal(avisoLeido(actual(), 'TestUsuario'), false);
  assert.equal(bandejaAviso(actual(), 'TestUsuario'), 'pendientes');
  assert.throws(() => archivarAviso(aviso.id, 'TestUsuario'));
  marcarLectura(aviso.id, 'TestUsuario');
  assert.equal(bandejaAviso(actual(), 'TestUsuario'), 'concluidos');
  assert.equal(actual().lecturas.length, 2);
  marcarLectura(aviso.id, 'TestUsuario');
  assert.equal(actual().lecturas.length, 2);
  archivarAviso(aviso.id, 'TestUsuario');
  archivarAviso(aviso.id, 'TestUsuario');
  assert.equal(bandejaAviso(actual(), 'TestUsuario'), 'historico');
  assert.equal(actual().archivados.length, 1);
  assert.equal(bandejaAviso(actual(), 'TestPresidente'), 'pendientes');
  assert.equal(actual().estado, 'Resuelto');
  assert.throws(() => archivarAviso(aviso.id, 'TestAuxiliar'));
});

test('los eventos visibles de Tesorería excluyen avisos, padrón y otros módulos', () => {
  const eventos = [{modulo:'Avisos'},{modulo:'Padrón'},{modulo:'Pagos'},{modulo:'Caja chica'}];
  assert.deepEqual(filtrarEventosAuditoria(eventos, 'TestTesoreria'), [{modulo:'Pagos'}]);
  for (const perfil of ['TestAuxiliar','TestPresidente','TestAuditor']) assert.deepEqual(filtrarEventosAuditoria(eventos, perfil), eventos);
  for (const perfil of ['TestUsuario','TestAuxiliarTesoreria']) assert.deepEqual(filtrarEventosAuditoria(eventos, perfil), []);
});
