import { prepararDestino } from './planes.js';
import { centavos, fechaValida, viviendaClave } from './indicadores.js';
import { obtenerResidentes, obtenerCajaChica, obtenerMovimientos, guardarMovimientos, obtenerAjustesManuales, guardarAjustesManuales } from './almacenamiento.js';
import { consultarCortes } from './corteBancario.js';
export function validarMovimiento(datos,perfil){
 if(!['TestPresidente','TestTesoreria','TestAuxiliarTesoreria'].includes(perfil))throw new Error('Sin permiso para registrar movimientos.');
 if(!['Abono','Cargo'].includes(datos.tipoMovimiento)||!fechaValida(datos.fecha)||!String(datos.concepto||'').trim()||centavos(datos.monto)<=0)throw new Error('Completa fecha, concepto e importe positivo.');
 if(!['Efectivo','Transferencia','Depósito bancario'].includes(datos.formaPago))throw new Error('Selecciona forma de pago.');
 if(String(datos.titular||'').length>160||String(datos.referencia||'').length>120||String(datos.concepto||'').length>500)throw new Error('El movimiento supera la longitud permitida.');
 const abono=datos.tipoMovimiento==='Abono';if(abono&&!obtenerResidentes().some(r=>r.estatus!=='Inactiva'&&viviendaClave(r.vivienda)===viviendaClave(datos.vivienda)))throw new Error('Selecciona una vivienda activa.');
 if(abono&&datos.formaPago!=='Efectivo'&&!datos.titular?.trim())throw new Error('Indica el titular de la cuenta de origen.');
 const caja=obtenerCajaChica(),esCaja=abono?datos.formaPago==='Efectivo':datos.salida==='Caja chica';
 if(!abono&&!['Caja chica','Tesorería'].includes(datos.salida))throw new Error('Selecciona origen del gasto.');
 if(!abono&&!esCaja&&!['TestTesoreria','TestPresidente'].includes(perfil))throw new Error('Solo Tesorería o Presidente registran gastos de Tesorería.');
 if(esCaja&&(!caja||caja.perfilResponsable!==perfil||caja.estadoCaja!=='Abierta'))throw new Error('Solo el responsable de la caja abierta puede registrar efectivo.');
 return {...datos,vivienda:abono?viviendaClave(datos.vivienda):'',monto:centavos(datos.monto)/100,titular:String(datos.titular||'').trim(),referencia:String(datos.referencia||'').trim(),...prepararDestino(datos),...(esCaja?{formaPago:'Efectivo',idCaja:caja.idCaja,responsableCaja:caja.responsableNombre||caja.responsableCaja,estadoCaja:'Abierta'}:{idCaja:undefined,responsableCaja:undefined,estadoCaja:undefined})};
}
export async function verificarLibre(id){if(!id)return;const cortes=await consultarCortes('TestTesoreria');if(cortes.some(c=>Object.values(c.asignaciones).includes(id)))throw new Error('El movimiento está conciliado. Tesorería debe quitar su asociación antes de editarlo o eliminarlo.');}
export async function guardarMovimiento(datos,perfil,anterior){
 if(anterior)await verificarLibre(datos.id);
 const lista=obtenerMovimientos(),actual=lista.find(m=>m.id===datos.id);
 if(actual&&perfil==='TestAuxiliarTesoreria')throw new Error('Solicita autorización para editar un movimiento.');
 if(actual&&!anterior)throw new Error('El identificador ya existe.');
 if(anterior&&JSON.stringify(actual)!==JSON.stringify(anterior))throw new Error('El movimiento cambió. Vuelve a consultarlo.');
 const nuevo={...validarMovimiento(datos,perfil),id:datos.id||crypto.randomUUID()};
 guardarMovimientos(actual?lista.map(m=>m.id===nuevo.id?nuevo:m):[...lista,nuevo]);return nuevo;
}
export async function eliminarMovimiento(id,perfil){if(!['TestTesoreria','TestPresidente'].includes(perfil))throw new Error('Solo Tesorería o Presidente pueden eliminar movimientos.');await verificarLibre(id);guardarMovimientos(obtenerMovimientos().filter(m=>m.id!==id));}
export async function resolverAjuste(id,resultado,motivo,perfil){
 if(!['TestTesoreria','TestPresidente'].includes(perfil))throw new Error('Solo Tesorería o Presidente resuelven ajustes.');
 if(!['Aprobada','Rechazada'].includes(resultado))throw new Error('Resolución inválida.');
 const solicitud=obtenerAjustesManuales().find(s=>s.id===id);
 if(!solicitud||(solicitud.estado||solicitud.estatus||'Pendiente')!=='Pendiente')throw new Error('La solicitud ya cambió o fue resuelta.');
 const solicitante=solicitud.solicitante==='Auxiliar de Tesorería'?'TestAuxiliarTesoreria':solicitud.solicitante;
 if(solicitante===perfil)throw new Error('No puedes aprobar un ajuste solicitado por ti mismo.');
 if(resultado==='Rechazada'&&!motivo?.trim())throw new Error('Ingresa el motivo del rechazo.');
 if(resultado==='Aprobada')await verificarLibre(solicitud.movimientoId);
 const actual=obtenerMovimientos().find(m=>m.id===solicitud.movimientoId),antes=solicitud.datosAntes||solicitud.original;
 if(resultado==='Aprobada'&&(!actual||JSON.stringify(actual)!==JSON.stringify(antes)))throw new Error('El movimiento original cambió. Solicita un ajuste actualizado.');
 let nuevo;if(resultado==='Aprobada'&&solicitud.accion!=='Eliminar')nuevo={...validarMovimiento(solicitud.datosDespues||solicitud.propuesto,solicitante),id:actual.id,modificadoPor:perfil};
 const claves=['los_robles_movimientos','los_robles_ajustes_manuales','los_robles_bitacora'],respaldo=claves.map(k=>[k,localStorage.getItem(k)]);
 try{if(resultado==='Aprobada')guardarMovimientos(solicitud.accion==='Eliminar'?obtenerMovimientos().filter(m=>m.id!==actual.id):obtenerMovimientos().map(m=>m.id===actual.id?nuevo:m));
 const nuevas=obtenerAjustesManuales().map(s=>s.id===id?{...s,estado:resultado,fechaResolucion:new Date().toISOString(),resueltoPor:perfil,motivoRechazo:resultado==='Rechazada'?motivo:undefined}:s);guardarAjustesManuales(nuevas);return nuevas;
 }catch(e){for(const [k,v]of respaldo){if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v);}window.dispatchEvent(new Event('robles-datos'));throw e;}
}
