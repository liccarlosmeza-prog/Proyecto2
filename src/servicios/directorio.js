import { fechaValida } from './indicadores.js';
import { registrarEvento } from './auditoria.js';
import { permisosPerfiles } from './permisos.js';
export const categoriasContacto = ['Administración', 'Mesa Directiva', 'Emergencias', 'Servicios'];
export const administraDirectorio = perfil => ['TestPresidente', 'TestAuxiliar'].includes(perfil);
export const hoyLocal = () => { const fecha = new Date(); return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`; };
export const contactoVigente = (contacto, hoy = hoyLocal()) => contacto.activo && contacto.autorizado && (!contacto.vigencia || contacto.vigencia >= hoy);
export const telefonoEnlace = telefono => String(telefono).replace(/[^\d+]/g, '');
const clave = 'los_robles_directorio';
function lista() {
  const datos = JSON.parse(localStorage.getItem(clave) || '[]');
  if (!Array.isArray(datos)) throw new Error('No se pudo leer el directorio.');
  return datos;
}
function persistir(datos, evento) {
  const anterior = localStorage.getItem(clave);
  localStorage.setItem(clave, JSON.stringify(datos));
  try { registrarEvento({ modulo: 'Directorio', ...evento }); }
  catch (error) { if (anterior === null) localStorage.removeItem(clave); else localStorage.setItem(clave, anterior); throw error; }
}
export function consultarContactos(perfil) {
  if (!permisosPerfiles[perfil]) throw new Error('Tu perfil no tiene acceso al directorio.');
  return lista().filter(contacto => administraDirectorio(perfil) || contactoVigente(contacto)).sort((a, b) => Number(b.categoria === 'Emergencias') - Number(a.categoria === 'Emergencias') || a.nombre.localeCompare(b.nombre, 'es'));
}
export function guardarContacto(datos, perfil, id, version) {
  if (!administraDirectorio(perfil)) throw new Error('Solo Presidente y Auxiliar administran el directorio.');
  const telefono = String(datos.telefono || '').trim(), correo = String(datos.correo || '').trim();
  if (!datos.nombre?.trim() || !categoriasContacto.includes(datos.categoria)) throw new Error('Completa el nombre y la categoría del contacto.');
  if (!telefono && !correo) throw new Error('Registra al menos un teléfono o un correo.');
  if (telefono && (!/^\+?[\d ()-]{3,25}$/.test(telefono) || !/^\+?\d{3,15}$/.test(telefonoEnlace(telefono)))) throw new Error('El teléfono solo admite números, espacios, paréntesis, guiones y un prefijo +.');
  if (correo && !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(correo)) throw new Error('Ingresa un correo válido.');
  if (datos.nombre.length > 120 || correo.length > 160 || String(datos.cargo || '').length > 120 || String(datos.horario || '').length > 150 || String(datos.notas || '').length > 500) throw new Error('El contacto supera la longitud permitida.');
  if (datos.categoria === 'Mesa Directiva' && !['Presidente', 'Tesorera', 'Secretario'].includes(datos.cargo)) throw new Error('Selecciona Presidente, Tesorera o Secretario.');
  if (datos.activo && !datos.autorizado) throw new Error('Confirma la autorización para publicar el contacto.');
  if (datos.vigencia && !fechaValida(datos.vigencia)) throw new Error('La fecha de vigencia no es válida.');
  if (datos.activo && datos.vigencia && datos.vigencia < hoyLocal()) throw new Error('Para publicar el contacto utiliza una vigencia actual o futura.');
  const contactos = lista(), anterior = contactos.find(contacto => contacto.id === id);
  if (id && (!anterior || anterior.version !== version)) throw new Error('El contacto cambió. Vuelve a abrirlo antes de guardar.');
  const contacto = { id: id || crypto.randomUUID(), nombre: datos.nombre.trim(), categoria: datos.categoria, cargo: String(datos.cargo || '').trim(), telefono, correo, horario: String(datos.horario || '').trim(), notas: String(datos.notas || '').trim(), vigencia: datos.vigencia || '', activo: Boolean(datos.activo), autorizado: Boolean(datos.autorizado), actualizado: new Date().toISOString(), actualizadoPor: perfil, version: (anterior?.version || 0) + 1 };
  persistir(anterior ? contactos.map(item => item.id === id ? contacto : item) : [...contactos, contacto], { accion: anterior ? 'Actualización de contacto' : 'Alta de contacto', registroId: contacto.id, usuario: perfil, detalle: `${contacto.nombre} · ${contacto.activo ? 'Activo' : 'Inactivo'}` });
  return contacto;
}
export function inactivarContacto(id, perfil, version) {
  const contacto = lista().find(item => item.id === id);
  if (!contacto) throw new Error('No se encontró el contacto.');
  return guardarContacto({ ...contacto, activo: false }, perfil, id, version);
}
