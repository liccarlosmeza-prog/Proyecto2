import { registrarEvento } from './auditoria.js';
export const tiposAviso = { informativo: 'Informativo general', temporal: 'Aviso temporal', urgente: 'Aviso urgente' };
export const segmentosAviso = { comunidad: 'Toda la comunidad', mesa: 'Mesa Directiva', tesoreria: 'Tesorería' };
export const esAdministrador = perfil => perfil === 'TestPresidente';
export const puedePublicar = perfil => ['TestPresidente', 'TestAuxiliar'].includes(perfil);
export const puedeVerAviso = (aviso, perfil) => esAdministrador(perfil) || aviso.segmento === 'comunidad' || (aviso.segmento === 'mesa' && ['TestAuxiliar', 'TestTesoreria', 'TestAuxiliarTesoreria'].includes(perfil)) || (aviso.segmento === 'tesoreria' && ['TestTesoreria', 'TestAuxiliarTesoreria'].includes(perfil));
export function obtenerAvisos() { return JSON.parse(localStorage.getItem('los_robles_avisos') || '[]'); }
export function avisoLeido(aviso, perfil) {
  return aviso.lecturas.some(lectura => lectura.perfil === perfil && (aviso.estado !== 'Resuelto' || lectura.resolucion === aviso.fechaResolucion));
}
export function bandejaAviso(aviso, perfil) {
  if (!avisoLeido(aviso, perfil)) return 'pendientes';
  if (aviso.estado !== 'Resuelto') return 'seguimiento';
  return aviso.archivados?.some(item => item.perfil === perfil && item.resolucion === aviso.fechaResolucion) ? 'historico' : 'concluidos';
}
export function archivarAviso(id, perfil) {
  const avisos = obtenerAvisos(), aviso = avisos.find(item => item.id === id);
  if (perfil !== 'TestUsuario' || !aviso || !puedeVerAviso(aviso, perfil)) throw new Error('No puedes archivar este aviso.');
  if (aviso.estado !== 'Resuelto' || !avisoLeido(aviso, perfil)) throw new Error('Lee el cierre del aviso concluido antes de enviarlo al histórico.');
  if (bandejaAviso(aviso, perfil) === 'historico') return;
  guardar(avisos.map(item => item.id === id ? { ...item, archivados: [...(item.archivados || []), { perfil, fecha: new Date().toISOString(), resolucion: aviso.fechaResolucion }] } : item), { modulo: 'Avisos', accion: 'Archivo personal', registroId: id, usuario: perfil });
}
function guardar(avisos, evento) {
  const anterior = localStorage.getItem('los_robles_avisos');
  localStorage.setItem('los_robles_avisos', JSON.stringify(avisos));
  try { registrarEvento(evento); }
  catch (error) {
    if (anterior === null) localStorage.removeItem('los_robles_avisos');
    else localStorage.setItem('los_robles_avisos', anterior);
    throw error;
  }
}
export function publicarAviso(datos, perfil) {
  if (!puedePublicar(perfil)) throw new Error('Tu perfil no puede publicar avisos.');
  if (!datos.titulo.trim() || !datos.mensaje.trim()) throw new Error('Completa el título y el mensaje.');
  if (!tiposAviso[datos.tipo] || !segmentosAviso[datos.segmento]) throw new Error('Selecciona un tipo y destinatario válido.');
  if (datos.titulo.trim().length > 100 || datos.mensaje.trim().length > 2000) throw new Error('El aviso supera la longitud permitida.');
  if (datos.tipo === 'temporal' && (!datos.vence || !Number.isFinite(new Date(datos.vence).getTime()) || new Date(datos.vence) <= new Date())) throw new Error('El aviso temporal necesita una fecha de fin futura.');
  const aviso = { id: crypto.randomUUID(), titulo: datos.titulo.trim(), mensaje: datos.mensaje.trim(), tipo: datos.tipo, segmento: datos.segmento, vence: datos.tipo === 'temporal' ? new Date(datos.vence).toISOString() : null, fecha: new Date().toISOString(), publicadoPor: perfil, estado: 'Activo', lecturas: [] };
  guardar([aviso, ...obtenerAvisos()], { modulo: 'Avisos', accion: 'Publicación', registroId: aviso.id, detalle: `${aviso.titulo} · ${segmentosAviso[aviso.segmento]}`, usuario: perfil });
  return aviso;
}
export function marcarLectura(id, perfil) {
  const avisos = obtenerAvisos(), aviso = avisos.find(item => item.id === id);
  if (!aviso || !puedeVerAviso(aviso, perfil)) throw new Error('No tienes acceso a este aviso.');
  if (avisoLeido(aviso, perfil)) return;
  guardar(avisos.map(item => item.id === id ? { ...item, lecturas: [...item.lecturas, { perfil, fecha: new Date().toISOString(), ...(aviso.estado === 'Resuelto' ? { resolucion: aviso.fechaResolucion } : {}) }] } : item), { modulo: 'Avisos', accion: aviso.estado === 'Resuelto' ? 'Lectura de cierre' : 'Lectura', registroId: id, usuario: perfil });
}
export function resolverAviso(id, perfil) {
  if (!esAdministrador(perfil)) throw new Error('Solo el administrador puede concluir un aviso.');
  const avisos = obtenerAvisos(), aviso = avisos.find(item => item.id === id);
  if (!aviso || aviso.estado === 'Resuelto') return;
  guardar(avisos.map(item => item.id === id ? { ...item, estado: 'Resuelto', resueltoPor: perfil, fechaResolucion: new Date().toISOString() } : item), { modulo: 'Avisos', accion: 'Resolución', registroId: id, detalle: aviso.titulo, usuario: perfil });
}
