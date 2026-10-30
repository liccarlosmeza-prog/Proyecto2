import { listarRegistros, actualizarRegistro } from './baseFase2.js';
import { administraMantenimiento, validarCambioTicket } from './fase2Reglas.js';
import { registrarEvento } from './auditoria.js';

function auditar(evento) {
  try { registrarEvento({ modulo: 'Mantenimiento', ...evento }); }
  catch (error) { console.warn('El historial del reporte se conservó, pero no se pudo actualizar la bitácora general.', error); }
}
export async function consultarTickets(perfil) {
  const tickets = await listarRegistros('tickets');
  return tickets.filter(ticket => administraMantenimiento(perfil) || ticket.creadoPor === perfil).sort((a, b) => b.fecha.localeCompare(a.fecha));
}
export async function crearTicket(datos, fotografia, perfil) {
  if (!['TestUsuario', 'TestPresidente', 'TestAuxiliar', 'TestTesoreria', 'TestAuxiliarTesoreria'].includes(perfil)) throw new Error('Tu perfil no puede reportar mantenimiento.');
  if (!datos.titulo?.trim() || !datos.ubicacion?.trim() || !datos.descripcion?.trim()) throw new Error('Completa el título, la ubicación y la descripción de la falla.');
  if (datos.titulo.length > 150 || datos.ubicacion.length > 200 || datos.descripcion.length > 2000) throw new Error('La descripción del reporte supera la longitud permitida.');
  if (!fotografia?.blob || fotografia.blob.type !== 'image/jpeg' || fotografia.blob.size >= 1024 * 1024 || !fotografia.blob.size) throw new Error('Adjunta una fotografía válida menor de 1 MB.');
  const cabecera = new Uint8Array(await fotografia.blob.slice(0, 3).arrayBuffer());
  if (cabecera[0] !== 0xff || cabecera[1] !== 0xd8 || cabecera[2] !== 0xff) throw new Error('La evidencia no contiene una fotografía JPEG válida.');
  const id = crypto.randomUUID(), fecha = new Date().toISOString();
  const ticket = { id, folio: `MAN-${fecha.slice(0, 10).replaceAll('-', '')}-${id.slice(0, 8).toUpperCase()}`, titulo: datos.titulo.trim(), ubicacion: datos.ubicacion.trim(), descripcion: datos.descripcion.trim(), categoria: datos.categoria || 'General', fotografia, creadoPor: perfil, fecha, estado: 'Reportado', responsable: '', version: 1, historial: [{ fecha, usuario: perfil, estado: 'Reportado', responsable: '', nota: 'Reporte registrado con evidencia fotográfica.' }] };
  await actualizarRegistro('tickets', id, () => ticket);
  auditar({ accion: 'Reporte de falla', registroId: ticket.folio, usuario: perfil, detalle: ticket.titulo });
  return ticket;
}
export async function actualizarTicket(id, cambio, perfil, version) {
  if (!administraMantenimiento(perfil)) throw new Error('Solo Presidente y Auxiliar administran mantenimiento.');
  const actualizado = await actualizarRegistro('tickets', id, ticket => {
    if (!ticket) throw new Error('No se encontró el reporte.');
    if (ticket.version !== version) throw new Error('El reporte cambió en otra pestaña. Actualiza la consulta antes de guardar.');
    validarCambioTicket(ticket, cambio);
    const fecha = new Date().toISOString();
    return { ...ticket, estado: cambio.estado, responsable: cambio.responsable.trim(), version: ticket.version + 1, historial: [...ticket.historial, { fecha, usuario: perfil, estado: cambio.estado, responsable: cambio.responsable.trim(), nota: cambio.nota.trim() }] };
  });
  auditar({ accion: 'Seguimiento', registroId: actualizado.folio, usuario: perfil, detalle: actualizado.estado });
  return actualizado;
}
