export const administraMantenimiento = perfil => ['TestPresidente', 'TestAuxiliar'].includes(perfil);
export const editaActas = perfil => ['TestPresidente', 'TestAuxiliar'].includes(perfil);
export const firmaActas = perfil => perfil === 'TestPresidente';
export const cargosMesa = ['Presidente', 'Tesorera', 'Secretario'];
export const estatusReporte = ticket => ticket.estado === 'Cerrado' ? 'Cerrado' : 'Activo';
export const estadosTicket = ['Reportado', 'Seguimiento', 'Asignado', 'En proceso', 'Resuelto', 'Cerrado'];
export const transicionesTicket = { Reportado: ['Seguimiento', 'Asignado'], Seguimiento: ['Asignado'], Asignado: ['En proceso'], 'En proceso': ['Resuelto'], Resuelto: ['En proceso', 'Cerrado'], Cerrado: [] };
export function validarActa(datos) {
  for (const campo of ['titulo', 'fecha', 'lugar', 'ordenDia', 'asistentes', 'acuerdos']) if (!String(datos[campo] || '').trim()) throw new Error('Completa título, fecha, lugar, orden del día, asistentes y acuerdos.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datos.fecha) || Number.isNaN(Date.parse(datos.fecha))) throw new Error('La fecha de asamblea no es válida.');
  if (datos.titulo.length > 150 || datos.lugar.length > 200 || ['ordenDia','asistentes','acuerdos'].some(campo => datos[campo].length > 15000)) throw new Error('El contenido del acta supera la longitud permitida.');
  if (datos.asistentes.split(/\r?\n/).some(nombre => nombre.trim().length > 200)) throw new Error('Escribe un participante por línea, con un máximo de 200 caracteres por nombre.');
  if (['presidente','tesorera','secretario'].some(campo => String(datos[campo] || '').length > 120)) throw new Error('El nombre de un integrante de la Mesa Directiva supera 120 caracteres.');
}
export function validarCambioTicket(ticket, cambio) {
  if (!estadosTicket.includes(cambio.estado)) throw new Error('Selecciona un estado válido.');
  if (ticket.estado === 'Cerrado') throw new Error('El reporte está cerrado y ya no admite cambios.');
  if (ticket.estado !== cambio.estado && !transicionesTicket[ticket.estado].includes(cambio.estado)) throw new Error('El cambio de estado no corresponde al flujo de atención.');
  if (['Asignado', 'En proceso', 'Resuelto', 'Cerrado'].includes(cambio.estado) && !cambio.responsable?.trim()) throw new Error('Asigna un responsable para continuar.');
  if (!cambio.nota?.trim()) throw new Error('Describe el seguimiento o la solución aplicada.');
  if (cambio.nota.length > 2000 || cambio.responsable?.length > 120) throw new Error('El seguimiento supera la longitud permitida.');
}
