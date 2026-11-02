export const puedeVerReportes = perfil => ['TestPresidente', 'TestAuxiliar', 'TestTesoreria', 'TestAuditor'].includes(perfil);
export const configuraReportes = perfil => ['TestPresidente', 'TestTesoreria'].includes(perfil);
export const viviendaClave = valor => String(valor || '').trim().toUpperCase();
export function centavos(valor) {
  const numero = Number(valor);
  if (!Number.isFinite(numero) || numero < 0 || numero > 1e10) throw new Error('El monto no es válido.');
  return Math.round((numero + Number.EPSILON) * 100);
}
export function fechaValida(fecha) { return /^\d{4}-\d{2}-\d{2}$/.test(fecha || '') && Number.isFinite(Date.parse(fecha)) && new Date(fecha).toISOString().slice(0, 10) === fecha; }
export function mesesPeriodo(desde, hasta) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(desde || '') || !/^\d{4}-(0[1-9]|1[0-2])$/.test(hasta || '') || desde > hasta) throw new Error('Selecciona un periodo de meses válido.');
  const a = Number(desde.slice(0, 4)) * 12 + Number(desde.slice(5)) - 1, b = Number(hasta.slice(0, 4)) * 12 + Number(hasta.slice(5)) - 1;
  if (b - a > 35) throw new Error('Consulta un máximo de 36 meses por reporte.');
  return Array.from({ length: b - a + 1 }, (_, indice) => `${Math.floor((a + indice) / 12)}-${String((a + indice) % 12 + 1).padStart(2, '0')}`);
}
export function calcularIndicadores({ residentes, movimientos, cuotaMensual = 0, diaVencimiento = 10, mesDesde, mesHasta, fechaCorte }) {
  const meses = mesesPeriodo(mesDesde, mesHasta), cuota = centavos(cuotaMensual), dia = Number(diaVencimiento);
  if (!fechaValida(fechaCorte) || fechaCorte < `${mesDesde}-01` || !Number.isInteger(dia) || dia < 1 || dia > 28) throw new Error('Revisa la fecha de corte y el día de vencimiento (1 a 28).');
  const mesesExigibles = meses.filter(mes => `${mes}-${String(dia).padStart(2, '0')}` <= fechaCorte);
  const casas = new Map(), advertencias = [], ids = new Set();
  residentes.filter(residente => residente.estatus !== 'Inactiva' && viviendaClave(residente.vivienda)).forEach(residente => {
    const clave = viviendaClave(residente.vivienda), anterior = casas.get(clave);
    casas.set(clave, { vivienda: clave, portal: Boolean(anterior?.portal || (residente.usuarioPortal === true && residente.privacidad === true)), pagos: anterior?.pagos || {} });
  });
  let cobros = 0, gastos = 0, sinAplicar = 0;
  const flujos = [];
  movimientos.forEach(movimiento => {
    if (!movimiento.id || ids.has(movimiento.id)) { advertencias.push('Hay movimientos sin identificador o con identificador duplicado. No se contabilizaron dos veces.'); return; }
    ids.add(movimiento.id);
    let monto;
    try { monto = centavos(movimiento.monto); } catch { advertencias.push(`Monto no válido en ${movimiento.id}.`); return; }
    if (!fechaValida(movimiento.fecha) || monto <= 0 || !['Abono','Cargo'].includes(movimiento.tipoMovimiento)) { advertencias.push(`Movimiento ${movimiento.id} sin fecha, tipo o monto válido.`); return; }
    if (movimiento.fecha > fechaCorte) return;
    if (movimiento.fecha.slice(0, 7) >= mesDesde && movimiento.fecha.slice(0, 7) <= mesHasta) {
      if (movimiento.tipoMovimiento === 'Abono') cobros += monto; else gastos += monto;
      flujos.push({ ...movimiento, monto: monto / 100 });
    }
    if (movimiento.tipoMovimiento !== 'Abono') return;
    const aplicaciones = movimiento.mesesAplicados, casa = casas.get(viviendaClave(movimiento.vivienda));
    if (!casa || !Array.isArray(aplicaciones) || !aplicaciones.length || aplicaciones.some(mes => !/^\d{4}-(0[1-9]|1[0-2])$/.test(mes)) || new Set(aplicaciones).size !== aplicaciones.length) {
      if (movimiento.fecha.slice(0, 7) >= mesDesde && movimiento.fecha.slice(0, 7) <= mesHasta) sinAplicar += monto;
      advertencias.push(`Cobro ${movimiento.id.slice(0,8)} sin vivienda activa o meses de aplicación válidos; revisa su captura.`); return;
    }
    const base = Math.floor(monto / aplicaciones.length), resto = monto % aplicaciones.length;
    aplicaciones.forEach((mes, indice) => { if (meses.includes(mes)) casa.pagos[mes] = (casa.pagos[mes] || 0) + base + Number(indice < resto); });
  });
  const viviendas = [...casas.values()].map(casa => {
    const esperado = cuota * mesesExigibles.length;
    const aplicado = mesesExigibles.reduce((total, mes) => total + Math.min(cuota, casa.pagos[mes] || 0), 0);
    const pagado = meses.reduce((total, mes) => total + (casa.pagos[mes] || 0), 0);
    return { vivienda: casa.vivienda, portal: casa.portal, esperado: esperado / 100, aplicado: aplicado / 100, pagado: pagado / 100, saldo: cuota ? (esperado - aplicado) / 100 : null, creditoPeriodo: cuota ? (pagado - aplicado) / 100 : null, meses: meses.map(mes => ({ mes, pagado: (casa.pagos[mes] || 0) / 100, exigible: mesesExigibles.includes(mes) })) };
  }).sort((a,b) => a.vivienda.localeCompare(b.vivienda,'es',{numeric:true}));
  const esperado = cuota * mesesExigibles.length * viviendas.length, aplicado = viviendas.reduce((total,casa) => total + centavos(casa.aplicado),0);
  if ([esperado,aplicado,cobros,gastos].some(valor=>!Number.isSafeInteger(valor))) throw new Error('El reporte excede la precisión monetaria admitida. Reduce el periodo.');
  const morosas = cuota ? viviendas.filter(casa => casa.saldo > 0).length : null;
  const adoptadas = viviendas.filter(casa => casa.portal).length;
  return { mesDesde, mesHasta, fechaCorte, cuotaMensual: cuota / 100, diaVencimiento: dia, meses, mesesExigibles, viviendas, viviendasActivas: viviendas.length, viviendasMorosas: morosas, viviendasPortal: adoptadas, esperado: cuota ? esperado / 100 : null, aplicado: cuota ? aplicado / 100 : null, saldo: cuota ? (esperado - aplicado) / 100 : null, recaudacion: esperado > 0 ? aplicado / esperado * 100 : null, morosidad: cuota && mesesExigibles.length && viviendas.length ? morosas / viviendas.length * 100 : null, adopcion: viviendas.length ? adoptadas / viviendas.length * 100 : null, cobros: cobros / 100, gastos: gastos / 100, flujoNeto: (cobros-gastos) / 100, sinAplicar: sinAplicar / 100, flujos, advertencias: [...new Set(advertencias)] };
}
