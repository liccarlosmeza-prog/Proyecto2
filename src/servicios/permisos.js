export const permisosPerfiles = {
  TestAuditor: { avisos: true, auditoria: true },
  TestUsuario: { avisos: true, residentes: false, tesoreria: false, estadosCuenta: false, movimientos: false, cajaChica: false },
  TestTesoreria: { avisos: true, residentes: false, tesoreria: true, estadosCuenta: true, movimientos: true, cajaChica: true, ajustesManuales: true },
  TestAuxiliarTesoreria: { avisos: true, residentes: false, tesoreria: true, estadosCuenta: false, movimientos: true, cajaChica: true, ajustesManuales: true },
  TestAuxiliar: { avisos: true, residentes: true, tesoreria: false, estadosCuenta: false, movimientos: false, cajaChica: false },
  TestPresidente: { avisos: true, residentes: true, tesoreria: true, estadosCuenta: true, movimientos: true, cajaChica: true, ajustesManuales: true }
};
export const puedeConsultarBitacora = perfil => ['TestAuxiliar', 'TestPresidente', 'TestAuditor'].includes(perfil);
export const puedeConsultarHistoricoPagos = perfil => puedeConsultarBitacora(perfil) || perfil === 'TestTesoreria';
export const filtrarEventosAuditoria = (eventos, perfil) => puedeConsultarBitacora(perfil) ? eventos : perfil === 'TestTesoreria' ? eventos.filter(evento => evento.modulo === 'Pagos') : [];
export const tienePermiso = (perfil, permiso) => permiso === 'auditoria' ? puedeConsultarHistoricoPagos(perfil) : Boolean(permisosPerfiles[perfil]?.[permiso]);
export const esTesorero = perfil => perfil === 'TestTesoreria' || perfil === 'TestPresidente';
export const esAuxiliarTesoreria = perfil => perfil === 'TestAuxiliarTesoreria';
