import { obtenerPlanes } from './planes.js';
import { obtenerResidentes, obtenerMovimientos } from './almacenamiento.js';
import { calcularIndicadores, puedeVerReportes, configuraReportes, mesesPeriodo, centavos } from './indicadores.js';
import { registrarEvento } from './auditoria.js';
const clave = 'los_robles_configuracion_indicadores';
export function obtenerConfiguracion() { return {...JSON.parse(localStorage.getItem(clave) || '{"cuotaMensual":0,"diaVencimiento":10}'),cuotas:obtenerPlanes().cuotas}; }
export function guardarConfiguracion(datos, perfil) {
  if (!configuraReportes(perfil)) throw new Error('Solo Presidente y Tesorería pueden configurar las cuotas.');
  const cuotaMensual = centavos(datos.cuotaMensual) / 100, diaVencimiento = Number(datos.diaVencimiento);
  if (cuotaMensual <= 0 || !Number.isInteger(diaVencimiento) || diaVencimiento < 1 || diaVencimiento > 28) throw new Error('Ingresa una cuota mayor a cero y un día de vencimiento entre 1 y 28.');
  const anterior = localStorage.getItem(clave), nuevo = { cuotaMensual, diaVencimiento, actualizado:new Date().toISOString(),usuario:perfil };
  localStorage.setItem(clave,JSON.stringify(nuevo));
  try { registrarEvento({modulo:'Reportes',accion:'Configuración de cuota',registroId:'cuota-mensual',usuario:perfil,detalle:`Cuota ${cuotaMensual} · Día ${diaVencimiento}`}); }
  catch(error) { if(anterior === null) localStorage.removeItem(clave); else localStorage.setItem(clave,anterior); throw error; }
  return nuevo;
}
export function consultarIndicadores(filtros, perfil) {
  if (!puedeVerReportes(perfil)) throw new Error('Tu perfil no tiene acceso a reportes e indicadores.');
  return calcularIndicadores({ ...obtenerConfiguracion(), ...filtros, residentes:obtenerResidentes(), movimientos:obtenerMovimientos() });
}
export function periodoFechas(mesDesde, mesHasta, corte) {
  mesesPeriodo(mesDesde,mesHasta);
  const [ano,mes] = mesHasta.split('-').map(Number), ultimo = new Date(ano,mes,0).getDate();
  return {desde:`${mesDesde}-01`,hasta:[`${mesHasta}-${ultimo}`,corte].sort()[0]};
}
