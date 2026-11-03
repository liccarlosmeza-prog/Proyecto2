export function crearCsv(filas) {
  const celda = valor => {
    let texto = valor === null || valor === undefined ? '' : String(valor);
    if (typeof valor !== 'number' && /^\s*[=+\-@\t\r]/.test(texto)) texto = "'" + texto;
    return '"' + texto.replaceAll('"','""') + '"';
  };
  return '\uFEFF' + filas.map(fila=>fila.map(celda).join(',')).join('\r\n');
}
export function filasResumen(reporte) {
  const etiquetas = { viviendasActivas:'Viviendas activas', viviendasPortal:'Viviendas con vinculación al portal y consentimiento', viviendasMorosas:'Viviendas con adeudo exigible', cuotaMensual:'Cuota mensual MXN', esperado:'Cuotas exigibles MXN', aplicado:'Pagos aplicados a cuotas exigibles MXN', saldo:'Adeudo exigible MXN', recaudacion:'Cobertura de recaudación %', morosidad:'Morosidad por vivienda %', adopcion:'Adopción registrada %', cobros:'Cobros recibidos MXN', gastos:'Gastos registrados MXN', flujoNeto:'Flujo neto MXN', totalAnticiposFuturos:'Anticipos a meses posteriores MXN', sinAplicar:'Cobros sin aplicación válida MXN' };
  return [['Indicador','Valor','Desde','Hasta','Fecha de corte'],...Object.entries(etiquetas).map(([campo,titulo])=>[titulo,reporte[campo],reporte.mesDesde,reporte.mesHasta,reporte.fechaCorte])];
}
export function filasViviendas(reporte) {
  return [['Vivienda','Vinculación al portal','Cuotas exigibles MXN','Pagado en meses consultados MXN','Aplicado a cuotas exigibles MXN','Saldo exigible MXN','Crédito en periodo MXN','Anticipos posteriores MXN'],...reporte.viviendas.map(casa=>[casa.vivienda,casa.portal?'Sí':'No',casa.esperado,casa.pagado,casa.aplicado,casa.saldo,casa.creditoPeriodo,casa.anticiposFuturos||0])];
}
export function filasConciliacion(conciliacion) {
  return [['Fecha','Referencia banco','Titular banco','Concepto banco','Tipo','Monto MXN','Captura vinculada','Destino','Proyecto','Vivienda','Titular captura','Concepto captura','Estado','Criterio'],...conciliacion.resultados.map(f=>[f.fecha,f.referencia,f.titular||'',f.concepto,f.tipo,f.monto,f.movimientoId||'',f.captura?.destino||'',f.captura?.proyectoId||'',f.captura?.vivienda||'',f.captura?.titular||'',f.captura?.concepto||'',f.movimientoId?'Asociado':'Sin identificar',f.criterio]),...conciliacion.sinBanco.map(m=>[m.fecha,m.referencia||'','',m.concepto,m.tipoMovimiento==='Abono'?'Ingreso':'Egreso',m.monto,m.id,m.destino||'Mantenimiento',m.proyectoId||'',m.vivienda||'',m.titular||'',m.concepto,'Sin registro bancario',''])];
}
export function descargarArchivo(nombre,contenido,tipo='text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([contenido],{type:tipo})), enlace = document.createElement('a');
  enlace.href=url;enlace.download=nombre;document.body.append(enlace);enlace.click();enlace.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
