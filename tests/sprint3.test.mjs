import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';
import { abrirBase } from '../src/servicios/baseFase3.js';
import { calcularIndicadores, mesesPeriodo, fechaValida, puedeVerReportes } from '../src/servicios/indicadores.js';
import { guardarConfiguracion, consultarIndicadores } from '../src/servicios/reportes.js';
import { guardarContacto, consultarContactos, inactivarContacto, contactoVigente, telefonoEnlace } from '../src/servicios/directorio.js';
import { leerCsvCorte, conciliarCorte, importarCorte, consultarCortes, vincularRegistro } from '../src/servicios/corteBancario.js';
import { crearCsv, filasResumen } from '../src/servicios/exportaciones.js';
import { tienePermiso } from '../src/servicios/permisos.js';
const periodo={mesDesde:'2026-01',mesHasta:'2026-02',fechaCorte:'2026-02-28',cuotaMensual:100,diaVencimiento:10};
const residentes=[{vivienda:' A1 ',estatus:'Habitada',usuarioPortal:true,privacidad:true},{vivienda:'a1',estatus:'Habitada',usuarioPortal:false,privacidad:true},{vivienda:'A2',estatus:'Desocupada',usuarioPortal:true,privacidad:false},{vivienda:'A3',estatus:'Inactiva'}];
const movimientos=[{id:'p1',vivienda:'A1',tipoMovimiento:'Abono',monto:200,fecha:'2026-01-05',mesesAplicados:['2026-01','2026-02']},{id:'p2',vivienda:'A2',tipoMovimiento:'Abono',monto:50,fecha:'2026-02-05',mesesAplicados:['2026-01','2026-02']},{id:'g1',tipoMovimiento:'Cargo',monto:900,fecha:'2026-02-12'},{id:'sin-casa',vivienda:'NO-EXISTE',tipoMovimiento:'Abono',monto:10,fecha:'2026-02-15',mesesAplicados:['2026-02']},{id:'futuro',vivienda:'A2',tipoMovimiento:'Abono',monto:900,fecha:'2026-03-01',mesesAplicados:['2026-01']}];
beforeEach(async()=>{
 const mapa=new Map();globalThis.localStorage={getItem:clave=>mapa.get(clave)??null,setItem:(clave,valor)=>mapa.set(clave,valor),removeItem:clave=>mapa.delete(clave)};globalThis.window=new EventTarget();
 const db=await abrirBase();await new Promise((resolve,reject)=>{const tx=db.transaction('cortes','readwrite');tx.objectStore('cortes').clear();tx.oncomplete=resolve;tx.onerror=reject;});
});
test('indicadores: deduplica viviendas, respeta consentimiento y calcula recaudación y morosidad sin usar gastos como deuda',()=>{
 const r=calcularIndicadores({...periodo,residentes,movimientos});
 assert.equal(r.viviendasActivas,2);assert.equal(r.esperado,400);assert.equal(r.aplicado,250);assert.equal(r.saldo,150);assert.equal(r.recaudacion,62.5);assert.equal(r.morosidad,50);assert.equal(r.adopcion,50);assert.equal(r.cobros,260);assert.equal(r.gastos,900);assert.equal(r.flujoNeto,-640);assert.equal(r.sinAplicar,10);assert.equal(r.viviendasMorosas,1);
});
test('indicadores: no inventa deuda sin cuota ni computa meses aún no exigibles',()=>{
 const base={...periodo,residentes,movimientos};let r=calcularIndicadores({...base,cuotaMensual:0});assert.equal(r.recaudacion,null);assert.equal(r.morosidad,null);assert.equal(r.saldo,null);
 r=calcularIndicadores({...base,fechaCorte:'2026-01-09'});assert.equal(r.esperado,0);assert.equal(r.morosidad,null);assert.equal(r.recaudacion,null);
 assert.throws(()=>calcularIndicadores({...base,fechaCorte:'2025-12-31'}));assert.throws(()=>mesesPeriodo('2026-02','2026-01'));assert.equal(fechaValida('2026-02-30'),false);
});
test('indicadores: reparte centavos sin perder dinero y no traslada excedentes a otro mes',()=>{
 const base={...periodo,mesHasta:'2026-03',fechaCorte:'2026-03-31',cuotaMensual:1,residentes:[residentes[0]]};
 let r=calcularIndicadores({...base,movimientos:[{...movimientos[0],monto:1,mesesAplicados:['2026-01','2026-02','2026-03']}]});assert.deepEqual(r.viviendas[0].meses.map(m=>m.pagado),[0.34,0.33,0.33]);assert.equal(r.saldo,2);
 r=calcularIndicadores({...base,movimientos:[{...movimientos[0],monto:3,mesesAplicados:['2026-01']}]});assert.equal(r.aplicado,1);assert.equal(r.saldo,2);assert.equal(r.viviendas[0].creditoPeriodo,2);
});
test('directorio: exige autorización, valida datos y permite bajas reversibles solo a administración',()=>{
 const datos={nombre:'Contacto de prueba',categoria:'Mesa Directiva',cargo:'Secretario',telefono:'+52 000 000 0000',correo:'prueba@example.invalid',autorizado:true,activo:true,vigencia:'2099-12-31'};
 assert.throws(()=>guardarContacto(datos,'TestUsuario'));assert.throws(()=>guardarContacto({...datos,autorizado:false},'TestAuxiliar'));assert.throws(()=>guardarContacto({...datos,telefono:'javascript:alert(1)'},'TestAuxiliar'));
 const contacto=guardarContacto(datos,'TestAuxiliar');assert.equal(consultarContactos('TestUsuario').length,1);assert.equal(telefonoEnlace(contacto.telefono),'+520000000000');
 assert.equal(contactoVigente(contacto,'2100-01-01'),false);assert.throws(()=>guardarContacto({...datos,nombre:'Obsoleto'},'TestAuxiliar',contacto.id,999));
 inactivarContacto(contacto.id,'TestPresidente',contacto.version);assert.equal(consultarContactos('TestUsuario').length,0);assert.equal(consultarContactos('TestPresidente').length,1);
});
test('directorio y configuración: fallo de auditoría revierte la escritura y no pierde datos anteriores',()=>{
 localStorage.setItem('los_robles_bitacora','corrupto');assert.throws(()=>guardarContacto({nombre:'Prueba',categoria:'Servicios',correo:'prueba@example.invalid',autorizado:true,activo:true},'TestPresidente'));assert.equal(localStorage.getItem('los_robles_directorio'),null);
 assert.throws(()=>guardarConfiguracion({cuotaMensual:100,diaVencimiento:10},'TestPresidente'));assert.equal(localStorage.getItem('los_robles_configuracion_indicadores'),null);
});
test('CSV bancario: procesa BOM, comillas y decimal local; rechaza duplicados y registros inválidos',()=>{
 const csv='\uFEFFfecha;referencia;concepto;tipo;monto;titular\n2026-02-05;REF1;"Concepto; con detalle";Ingreso;1500,25;Titular prueba';assert.equal(leerCsvCorte(csv)[0].monto,1500.25);
 assert.throws(()=>leerCsvCorte(csv+'\n2026-02-05;REF1;"Concepto; con detalle";Ingreso;1500,25;Titular prueba'));assert.throws(()=>leerCsvCorte('fecha,referencia,concepto,tipo,monto,titular\n2026-02-30,R,x,Ingreso,10,Persona'));assert.throws(()=>leerCsvCorte('fecha,referencia,concepto,tipo,monto,titular\n2026-02-05,R,x,Ingreso,-10,Persona'));
});
const capturas=[{id:'b1',tipoMovimiento:'Abono',fecha:'2026-02-05',monto:100,formaPago:'Transferencia',referencia:'REF1',concepto:'Cuota A1'},{id:'b2',tipoMovimiento:'Cargo',fecha:'2026-02-06',monto:25,formaPago:'Transferencia',salida:'Tesorería',referencia:'REF2',concepto:'Servicio'},{id:'efectivo',tipoMovimiento:'Abono',fecha:'2026-02-05',monto:1000,formaPago:'Efectivo'}];
const csvBanco='fecha,referencia,concepto,tipo,monto,titular\n2026-02-05,REF1,Cuota,Ingreso,100,Nombre prueba\n2026-02-06,REF2,Servicio,Egreso,25,Proveedor';
test('conciliación: compara ingresos y egresos bancarios, excluye efectivo y exige correspondencia individual',()=>{
 const filas=leerCsvCorte(csvBanco);const ok=conciliarCorte(filas,capturas,'2026-02-01','2026-02-28');assert.equal(ok.conciliado,false);assert.equal(ok.pendientes.length,2);const manual=conciliarCorte(filas,capturas,'2026-02-01','2026-02-28',{'1':'b1','2':'b2'});assert.equal(manual.conciliado,true);assert.equal(ok.ingresosSistema,100);assert.equal(ok.egresosSistema,25);
 const mismasSumas=conciliarCorte(filas.map(f=>({...f,referencia:'OTRA'})),capturas,'2026-02-01','2026-02-28');assert.equal(mismasSumas.diferenciaIngresos,0);assert.equal(mismasSumas.diferenciaEgresos,0);assert.equal(mismasSumas.conciliado,false);assert.equal(mismasSumas.pendientes.length,2);
 const sinDatos=conciliarCorte([],[],'2026-02-01','2026-02-28');assert.equal(sinDatos.conciliado,false);
});
test('cortes: conserva CSV original y controla permisos, vinculaciones duplicadas y versiones obsoletas',async()=>{
 await assert.rejects(importarCorte(csvBanco,'prueba.csv','TestUsuario'));const corte=await importarCorte(csvBanco,'prueba.csv','TestTesoreria','2026-02',true);assert.equal(corte.textoOriginal,csvBanco);
 const actualizado=await vincularRegistro(corte.id,'1','b1',capturas,'TestTesoreria',1);assert.equal(actualizado.asignaciones['1'],'b1');await assert.rejects(vincularRegistro(corte.id,'2','b2',capturas,'TestTesoreria',1));
 assert.equal((await consultarCortes('TestAuditor'))[0].textoOriginal,csvBanco);await assert.rejects(consultarCortes('TestUsuario'));
});
test('exportaciones: neutraliza fórmulas en textos, conserva números negativos y escapa comillas',()=>{
 const csv=crearCsv([['=1+1','+SUM(A1)','@valor','texto "citado"',-12.5]]);assert.ok(csv.startsWith('\uFEFF'));assert.ok(csv.includes("'="));assert.ok(csv.includes('"texto ""citado"""'));assert.ok(csv.includes('"-12.5"'));
 const r=calcularIndicadores({...periodo,residentes,movimientos});assert.equal(filasResumen(r).find(f=>f[0]==='Morosidad por vivienda %')[1],50);
});
test('permisos y configuración: usuarios ven directorio pero no cifras financieras; Auxiliar consulta sin configurar cuota',()=>{
 assert.equal(tienePermiso('TestUsuario','directorio'),true);assert.equal(tienePermiso('TestUsuario','reportes'),false);assert.equal(puedeVerReportes('TestAuxiliar'),true);assert.throws(()=>guardarConfiguracion({cuotaMensual:100,diaVencimiento:10},'TestAuxiliar'));assert.throws(()=>consultarIndicadores(periodo,'TestUsuario'));
 guardarConfiguracion({cuotaMensual:100,diaVencimiento:10},'TestTesoreria');assert.equal(JSON.parse(localStorage.getItem('los_robles_configuracion_indicadores')).cuotaMensual,100);
});

test('conciliación: referencias ambiguas exigen vincular cada registro sin reutilizar capturas',async()=>{
 const texto='fecha,referencia,concepto,tipo,monto,titular\n2026-02-05,COMPARTIDA,Cuota A,Ingreso,100,Nombre prueba\n2026-02-05,COMPARTIDA,Cuota B,Ingreso,100,Nombre prueba';
 const corte=await importarCorte(texto,'ambiguo.csv','TestTesoreria','2026-02',true);const base=[{...capturas[0],id:'x1',referencia:'COMPARTIDA'},{...capturas[0],id:'x2',referencia:'COMPARTIDA'}];
 assert.equal(conciliarCorte(corte.registros,base,'2026-02-01','2026-02-28').pendientes.length,2);
 const primero=await vincularRegistro(corte.id,'1','x1',base,'TestTesoreria',1);
 await assert.rejects(vincularRegistro(corte.id,'2','x1',base,'TestTesoreria',primero.version));
 const final=await vincularRegistro(corte.id,'2','x2',base,'TestTesoreria',primero.version);
 assert.equal(conciliarCorte(final.registros,base,'2026-02-01','2026-02-28',final.asignaciones).conciliado,true);
 assert.equal(final.textoOriginal,texto);
});

test('mensual: solo Tesorería importa y vincula; mes y confirmación obligatorios',async()=>{
 for(const p of ['TestPresidente','TestAuxiliar','TestAuditor','TestUsuario','TestAuxiliarTesoreria'])await assert.rejects(importarCorte(csvBanco,'mes.csv',p,'2026-02',true),/Solo Tesorería/);
 await assert.rejects(importarCorte(csvBanco,'mes.csv','TestTesoreria','',true));await assert.rejects(importarCorte(csvBanco,'mes.csv','TestTesoreria','2026-02',false));await assert.rejects(importarCorte(csvBanco,'mes.csv','TestTesoreria','2026-03',true),/fuera del mes/);
 const c=await importarCorte(csvBanco,'mes.csv','TestTesoreria','2026-02',true);assert.deepEqual(c.periodo,{desde:'2026-02-01',hasta:'2026-02-28'});await assert.rejects(vincularRegistro(c.id,'1','b1',capturas,'TestPresidente',1));
});
test('manual: titular sugiere sin referencia; conserva pendientes, casa y exportación',async()=>{
 const texto='fecha,referencia,concepto,tipo,monto,titular\n2026-02-05,,Pago sin referencia,Ingreso,100,José Simulado\n2026-02-06,,Desconocido,Ingreso,77,';
 const c=await importarCorte(texto,'mes.csv','TestTesoreria','2026-02',true);const base=[{...capturas[0],vivienda:'Casa 12',titular:'Jose Simulado',referencia:''},{...capturas[0],id:'b3',vivienda:'Casa 20',titular:'Otra persona'}];
 let r=conciliarCorte(c.registros,base,c.periodo.desde,c.periodo.hasta);assert.equal(r.pendientes.length,2);assert.equal(r.resultados[0].candidatos[0].id,'b1');assert.equal(r.resultados[0].candidatos[0].coincidenciaTitular,true);
 const ligado=await vincularRegistro(c.id,'1','b1',base,'TestTesoreria',1);r=conciliarCorte(ligado.registros,base,c.periodo.desde,c.periodo.hasta,ligado.asignaciones);assert.equal(r.resultados[0].captura.vivienda,'Casa 12');assert.equal(r.pendientes.length,1);assert.equal(r.conciliado,false);
 const {filasConciliacion}=await import('../src/servicios/exportaciones.js');const salida=filasConciliacion(r);assert.ok(salida[1].includes('Casa 12'));assert.ok(salida[2].includes('Sin identificar'));
 const quitado=await vincularRegistro(c.id,'1','',base,'TestTesoreria',ligado.version);assert.equal(conciliarCorte(quitado.registros,base,c.periodo.desde,c.periodo.hasta,quitado.asignaciones).pendientes.length,2);
});
test('manual: cambiar importe o eliminar captura invalida asociación; coincidencia exacta jamás confirma sola',()=>{
 const filas=leerCsvCorte(csvBanco);assert.equal(conciliarCorte(filas,capturas,'2026-02-01','2026-02-28').pendientes.length,2);
 assert.equal(conciliarCorte(filas,[{...capturas[0],monto:99}],'2026-02-01','2026-02-28',{'1':'b1'}).pendientes.length,2);
 assert.equal(conciliarCorte(filas,[],'2026-02-01','2026-02-28',{'1':'b1'}).alertas.length,1);
});
