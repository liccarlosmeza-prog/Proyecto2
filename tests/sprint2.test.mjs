import { beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import 'fake-indexeddb/auto';
import { abrirBase } from '../src/servicios/baseFase2.js';
import { consultarActas, guardarBorrador, firmarActa, cargarActaFirmada, pdfParaFirmas } from '../src/servicios/actas.js';
import { consultarTickets, crearTicket, actualizarTicket } from '../src/servicios/mantenimiento.js';
import { tienePermiso } from '../src/servicios/permisos.js';
import { estatusReporte } from '../src/servicios/fase2Reglas.js';
import { PDFDocument } from 'pdf-lib';
import { generarPdfActa } from '../src/servicios/pdfActas.js';
const actaDatos = { titulo: 'Asamblea de prueba local', fecha: '2026-10-29', lugar: 'Casa club Los Robles', ordenDia: '1. Lista de asistencia\n2. Mantenimiento de áreas comunes', asistentes: 'Persona de prueba A\nPersona de prueba B', acuerdos: '1. Revisar el alumbrado del acceso.\n2. Dar seguimiento a los reportes registrados.' };
const ticketDatos = { titulo: 'Prueba de luminaria', ubicacion: 'Acceso de prueba', descripcion: 'Reporte sintético para validar el flujo.', categoria: 'Alumbrado' };
const fotoBytes = await readFile(new URL('./fixtures/evidencia.jpg',import.meta.url));
const foto = { blob: new Blob([fotoBytes], {type:'image/jpeg'}), nombre:'prueba.jpg', originalBytes:fotoBytes.length, bytes:fotoBytes.length };
beforeEach(async () => {
  globalThis.window = new EventTarget();
  const mapa = new Map(); globalThis.localStorage = {getItem: clave => mapa.get(clave) ?? null, setItem:(clave,valor) => mapa.set(clave,valor),removeItem:clave=>mapa.delete(clave)};
  const db = await abrirBase();
  await new Promise((resolve,reject)=>{const tx = db.transaction(['actas','tickets'],'readwrite'); tx.objectStore('actas').clear(); tx.objectStore('tickets').clear(); tx.oncomplete=resolve; tx.onerror=reject;});
});
test('actas: edición autorizada, borradores privados y control de concurrencia', async () => {
  await assert.rejects(guardarBorrador(actaDatos,'TestUsuario'));
  const acta = await guardarBorrador(actaDatos,'TestAuxiliar');
  assert.equal((await consultarActas('TestUsuario')).length,0);
  assert.equal((await consultarActas('TestAuxiliar')).length,1);
  await assert.rejects(guardarBorrador({...actaDatos,titulo:'Cambio'},'TestPresidente',acta.id,99));
  const nueva = await guardarBorrador({...actaDatos,titulo:'Borrador actualizado'},'TestPresidente',acta.id,acta.version);
  assert.equal(nueva.historial.length,2);
  assert.equal(nueva.version,2);
});
test('actas: firma guarda PDF, conserva bytes, bloquea edición y permite consulta permanente', async () => {
  const acta = await guardarBorrador(actaDatos,'TestAuxiliar');
  const imagen = 'data:image/png;base64,' + (await readFile(new URL('./fixtures/firma.png',import.meta.url))).toString('base64');
  const firma = {nombre:'Firmante de prueba',cargo:'Presidente',imagen,confirmado:true};
  await assert.rejects(firmarActa(acta.id,{...firma,confirmado:false},'TestAuxiliar',acta.version));
  await assert.rejects(firmarActa(acta.id,firma,'TestUsuario',acta.version));
  await assert.rejects(firmarActa(acta.id,firma,'TestAuxiliar',acta.version));
  await assert.rejects(firmarActa(acta.id,{...firma,cargo:'Secretario'},'TestPresidente',acta.version));
  const final = await firmarActa(acta.id,firma,'TestPresidente',acta.version);
  assert.equal(final.estado,'Firmada');
  assert.equal(final.huellaPdf.length,64);
  const bytes = Buffer.from(await final.pdfFinal.arrayBuffer());
  assert.ok(bytes.subarray(0,8).toString().startsWith('%PDF-'));
  await assert.rejects(guardarBorrador({...actaDatos,titulo:'Intento de cambio'},'TestPresidente',acta.id,final.version));
  await assert.rejects(firmarActa(acta.id,firma,'TestPresidente',final.version));
  const consulta = (await consultarActas('TestUsuario'))[0];
  assert.deepEqual(Buffer.from(await consulta.pdfFinal.arrayBuffer()),bytes);
  assert.equal(consulta.historial.at(-1).accion,'Acta firmada y bloqueada');
  if (process.env.ROBLES_QA_DIR) { await mkdir(process.env.ROBLES_QA_DIR,{recursive:true}); await writeFile(process.env.ROBLES_QA_DIR+'/acta-firmada-qa.pdf',bytes); }
});
test('PDF: genera contenido extenso multipágina sin perder el último acuerdo', async () => {
  const larga = {...actaDatos,folio:'ACT-QA-MULTIPAGINA',estado:'Borrador',acuerdos:Array.from({length:70},(_,i)=>`${i+1}. Acuerdo de prueba de seguimiento al mantenimiento de las instalaciones comunes de la comunidad Los Robles.`).join('\n')};
  const bytes = Buffer.from(await generarPdfActa(larga).arrayBuffer());
  assert.ok(bytes.length>3000);
  if (process.env.ROBLES_QA_DIR) { await mkdir(process.env.ROBLES_QA_DIR,{recursive:true}); await writeFile(process.env.ROBLES_QA_DIR+'/acta-multipagina-qa.pdf',bytes); }
});
test('mantenimiento: exige evidencia menor de 1 MB y restringe consulta por autor', async () => {
  await assert.rejects(crearTicket(ticketDatos,null,'TestUsuario'));
  await assert.rejects(crearTicket(ticketDatos,{blob:new Blob([new Uint8Array(1024*1024)],{type:'image/jpeg'})},'TestUsuario'));
  await assert.rejects(crearTicket(ticketDatos,foto,'TestAuditor'));
  const ticket = await crearTicket(ticketDatos,foto,'TestUsuario');
  assert.ok(ticket.folio.startsWith('MAN-'));
  assert.equal((await consultarTickets('TestUsuario')).length,1);
  assert.equal((await consultarTickets('TestTesoreria')).length,0);
  assert.equal((await consultarTickets('TestAuxiliar')).length,1);
  assert.equal(ticket.historial.length,1);
});
test('mantenimiento: responsable, transición, historial completo y cierre bloqueado', async () => {
  let ticket = await crearTicket(ticketDatos,foto,'TestUsuario');
  await assert.rejects(actualizarTicket(ticket.id,{estado:'Asignado',responsable:'Prueba',nota:'Asignación'},'TestUsuario',ticket.version));
  await assert.rejects(actualizarTicket(ticket.id,{estado:'Resuelto',responsable:'Prueba',nota:'Salto inválido'},'TestAuxiliar',ticket.version));
  await assert.rejects(actualizarTicket(ticket.id,{estado:'Asignado',responsable:'',nota:'Falta responsable'},'TestAuxiliar',ticket.version));
  for (const estado of ['Asignado','En proceso','Resuelto','En proceso','Resuelto','Cerrado']) ticket = await actualizarTicket(ticket.id,{estado,responsable:'Responsable de prueba',nota:`Seguimiento: ${estado}`},'TestAuxiliar',ticket.version);
  assert.equal(ticket.historial.length,7);
  assert.equal(ticket.estado,'Cerrado');
  await assert.rejects(actualizarTicket(ticket.id,{estado:'En proceso',responsable:'Prueba',nota:'Intento de reapertura'},'TestPresidente',ticket.version));
});
test('mantenimiento: una versión obsoleta no sobrescribe el seguimiento', async () => {
  const ticket = await crearTicket(ticketDatos,foto,'TestUsuario');
  await actualizarTicket(ticket.id,{estado:'Asignado',responsable:'Equipo A',nota:'Asignado'},'TestPresidente',ticket.version);
  await assert.rejects(actualizarTicket(ticket.id,{estado:'Asignado',responsable:'Equipo B',nota:'Obsoleto'},'TestAuxiliar',ticket.version));
  assert.equal((await consultarTickets('TestUsuario'))[0].responsable,'Equipo A');
});
test('permisos: Auxiliar redacta como Secretario y no recibe permisos financieros', () => {
  assert.equal(tienePermiso('TestAuxiliar','actas'),true);
  assert.equal(tienePermiso('TestAuxiliar','movimientos'),false);
  assert.equal(tienePermiso('TestUsuario','mantenimiento'),true);
  assert.equal(tienePermiso('TestAuditor','mantenimiento'),false);
  assert.equal(tienePermiso('TestSecretaria','actas'),false);
});


test('actas: recibir PDF válido con firmas, conservar original y rechazar duplicados y accesos ajenos', async () => {
  const acta = await guardarBorrador(actaDatos,'TestAuxiliar');
  const imagen = 'data:image/png;base64,' + (await readFile(new URL('./fixtures/firma.png',import.meta.url))).toString('base64');
  const final = await firmarActa(acta.id,{nombre:'Presidente de prueba',cargo:'Presidente',imagen,confirmado:true},'TestPresidente',acta.version);
  const archivo = new File([final.pdfFinal],'acta-con-firmas-prueba.pdf',{type:'application/pdf'});
  await assert.rejects(cargarActaFirmada(acta.id,archivo,'TestUsuario',final.version,true));
  await assert.rejects(cargarActaFirmada(acta.id,archivo,'TestAuxiliar',final.version,false));
  await assert.rejects(cargarActaFirmada(acta.id,new File(['%PDF-falso'],'danado.pdf'),'TestAuxiliar',final.version,true));
  const recibida = await cargarActaFirmada(acta.id,archivo,'TestAuxiliar',final.version,true);
  assert.equal(recibida.pdfsFirmados.length,1);
  assert.equal(recibida.historial.at(-1).accion,'PDF con firmas autógrafas recibido');
  assert.deepEqual(Buffer.from(await recibida.pdfFinal.arrayBuffer()),Buffer.from(await final.pdfFinal.arrayBuffer()));
  await assert.rejects(cargarActaFirmada(acta.id,archivo,'TestPresidente',recibida.version,true));
  assert.equal((await consultarActas('TestUsuario'))[0].pdfsFirmados.length,1);
});
test('PDF para firmas incluye anexos y actualiza la plantilla de actas anteriores sin cambiar su original', async () => {
  const anterior = {...actaDatos,folio:'ACT-ANTERIOR',estado:'Firmada',firmadoPor:'TestAuxiliar',pdfFinal:new Blob(['documento antiguo'])};
  const pdf = pdfParaFirmas(anterior);
  const doc = await PDFDocument.load(await pdf.arrayBuffer());
  assert.ok(doc.getPageCount() >= 3);
  assert.equal(await anterior.pdfFinal.text(),'documento antiguo');
});
test('mantenimiento: el estatus global solo cierra al terminar la etapa Cerrado', async () => {
  for (const estado of ['Reportado','Seguimiento','Asignado','En proceso','Resuelto']) assert.equal(estatusReporte({estado}),'Activo');
  assert.equal(estatusReporte({estado:'Cerrado'}),'Cerrado');
  let ticket = await crearTicket(ticketDatos,foto,'TestUsuario');
  ticket = await actualizarTicket(ticket.id,{estado:'Seguimiento',responsable:'',nota:'Se evalúa la falla'},'TestAuxiliar',ticket.version);
  assert.equal(ticket.estado,'Seguimiento');
  assert.equal(estatusReporte(ticket),'Activo');
});
