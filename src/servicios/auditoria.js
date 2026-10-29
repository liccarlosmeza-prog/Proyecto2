const clave = 'los_robles_bitacora';
let perfilSesion;
export const establecerPerfilAuditoria = perfil => { perfilSesion = perfil; };
const usuarioActual = () => perfilSesion || localStorage.getItem('los_robles_perfil_prueba') || 'TestPresidente';
export function obtenerBitacora() {
  const registros = JSON.parse(localStorage.getItem(clave) || '[]');
  if (!Array.isArray(registros)) throw new Error('No se pudo leer la bitácora.');
  return registros;
}
// La aplicación solo expone inserción y consulta, nunca edición ni eliminación.
export function registrarEvento({ modulo, accion, registroId, detalle = '', resultado = 'Correcto', usuario }) {
  const evento = { id: crypto.randomUUID(), fecha: new Date().toISOString(), usuario: usuario || usuarioActual(), modulo, accion, registroId, detalle, resultado };
  localStorage.setItem(clave, JSON.stringify([...obtenerBitacora(), evento]));
  window.dispatchEvent(new Event('robles-datos'));
  return evento;
}
export function auditarCambios(clave, anteriores, siguientes) {
  const modulos = { los_robles_residentes: 'Padrón', los_robles_movimientos: 'Pagos', los_robles_caja_chica: 'Caja chica', los_robles_movimientos_caja: 'Caja chica', los_robles_ajustes_manuales: 'Ajustes financieros', los_robles_historial_caja_chica: 'Caja chica' };
  if (!modulos[clave]) return;
  const lista = valor => Array.isArray(valor) ? valor : valor ? [valor] : [];
  const antes = lista(anteriores), despues = lista(siguientes);
  const id = dato => dato.id || dato.idCaja || 'registro';
  const resumen = dato => modulos[clave] === 'Pagos' ? `${dato.tipoMovimiento || 'Movimiento'} · Vivienda ${dato.vivienda || '—'} · ${dato.concepto || ''} · $${Number(dato.monto || 0).toFixed(2)}` : `Registro ${id(dato)}`;
  const pendientes = [];
  for (const actual of despues) {
    const anterior = antes.find(dato => id(dato) === id(actual));
    if (JSON.stringify(anterior) !== JSON.stringify(actual)) {
      const campos = anterior ? Object.keys({ ...anterior, ...actual }).filter(campo => JSON.stringify(anterior[campo]) !== JSON.stringify(actual[campo])).join(', ') : '';
      pendientes.push({ modulo: modulos[clave], accion: anterior ? 'Actualización' : 'Alta', registroId: id(actual), detalle: `${resumen(actual)}${campos ? ` · Campos: ${campos}` : ''}` });
    }
  }
  for (const anterior of antes) if (!despues.some(actual => id(actual) === id(anterior))) pendientes.push({ modulo: modulos[clave], accion: 'Baja', registroId: id(anterior), detalle: resumen(anterior) });
  if (pendientes.length) {
    const nuevos = pendientes.map(evento => ({ ...evento, id: crypto.randomUUID(), fecha: new Date().toISOString(), usuario: usuarioActual(), resultado: 'Correcto' }));
    localStorage.setItem('los_robles_bitacora', JSON.stringify([...obtenerBitacora(), ...nuevos]));
    window.dispatchEvent(new Event('robles-datos'));
  }
}
