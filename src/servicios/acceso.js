import { obtenerResidentes, guardarResidentes } from './almacenamiento.js';
import { registrarEvento } from './auditoria.js';

export const perfilesPortal = {
  'PRES-001': 'TestPresidente', 'AUX-001': 'TestAuxiliar',
  'TES-001': 'TestTesoreria', 'AUX-TES-001': 'TestAuxiliarTesoreria', 'AUD-001': 'TestAuditor'
};
const normalizar = valor => String(valor ?? '').trim().toUpperCase();
export function idVecino({calle, numero, interior, tipo}) {
  const base = normalizar(calle).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Z]/g,'').slice(0,4);
  const exterior = normalizar(numero), unidad = normalizar(interior);
  if(base.length !== 4 || !/^\d+[A-Z]?$/.test(exterior) || (unidad && !/^[0-9A-Z]+$/.test(unidad)) || !['Titular','Arrendatario'].includes(tipo)) throw new Error('Indica una calle con al menos cuatro letras, un número válido y un interior sin espacios ni signos.');
  return base[0] + base.slice(1).toLowerCase() + exterior + unidad + (tipo === 'Titular'?'Tit':'Ren');
}
const hex = bytes => Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
async function derivar(clave, sal) {
  const llave = await crypto.subtle.importKey('raw', new TextEncoder().encode(clave), 'PBKDF2', false, ['deriveBits']);
  const bytes = Uint8Array.from(sal.match(/../g), b => parseInt(b, 16));
  return hex(new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2', hash:'SHA-256', salt:bytes, iterations:600000}, llave, 256)));
}
export function crearServicioAcceso({ demo = false } = {}) {
  const prefijo = demo ? 'robles_u4_demo_' : 'robles_u4_';
  const claveCuentas = prefijo + 'cuentas', claveSesion = prefijo + 'sesion';
  const cuentas = () => JSON.parse(localStorage.getItem(claveCuentas) || '[]');
  const esDemo = c => demo && ['DEMO001TIT','VEC-DEMO-001'].includes(normalizar(c.id));
  const activo = r => r && r.estatus !== 'Inactiva' && r.privacidad === true;
  const vigente = c => c && (c.perfil !== 'TestUsuario' || esDemo(c) || obtenerResidentes().some(r=>activo(r)&&r.id===c.residenteId&&normalizar(r.portalId)===normalizar(c.id)));
  function sesion() {
    const s = JSON.parse(sessionStorage.getItem(claveSesion) || 'null');
    if (!s || s.expira <= Date.now()) return null;
    const c = cuentas().find(a => a.id === s.id && a.revision === s.revision);
    return vigente(c) ? {id:c.id, perfil:c.perfil, vivienda:c.vivienda, expira:s.expira, cambioObligatorio:Boolean(c.cambioObligatorio)} : null;
  }
  function administrar() {
    const s = sesion();
    if (!s || s.cambioObligatorio || !['TestPresidente','TestAuxiliar'].includes(s.perfil)) throw new Error('Solo Presidencia y su Auxiliar gestionan accesos.');
    return s;
  }
  function guardar(lista, evento) {
    const anterior = localStorage.getItem(claveCuentas);
    localStorage.setItem(claveCuentas, JSON.stringify(lista));
    try { registrarEvento(evento); } catch (e) {
      if (anterior === null) localStorage.removeItem(claveCuentas); else localStorage.setItem(claveCuentas, anterior);
      throw e;
    }
    window.dispatchEvent(new Event('robles-acceso'));
  }
  async function credencial(clave) {
    if (typeof clave !== 'string' || clave.length < 12 || clave.length > 128) throw new Error('Usa una contraseña de 12 a 128 caracteres.');
    const sal = hex(crypto.getRandomValues(new Uint8Array(16)));
    return {sal, hash:await derivar(clave, sal), revision:crypto.randomUUID()};
  }
  async function iniciar(id, clave) {
    const c = cuentas().find(a => normalizar(a.id) === normalizar(id));
    const invalido = new Error('ID o contraseña incorrectos, o acceso inactivo.');
    if (!vigente(c) || typeof clave !== 'string' || clave.length > 128) throw invalido;
    const hash = await derivar(clave, c.sal);
    if (hash !== c.hash || !cuentas().some(a => a.id === c.id && a.revision === c.revision) || !vigente(c)) throw invalido;
    sessionStorage.setItem(claveSesion, JSON.stringify({id:c.id, revision:c.revision, expira:Date.now()+8*3600000}));
    return sesion();
  }
  async function configurar(clave) {
    if (cuentas().length) throw new Error('El portal ya fue configurado.');
    const base = [{id:'PRES-001', perfil:'TestPresidente', ...await credencial(clave)}];
    if (demo) {
      base.push({id:'AUX-001', perfil:'TestAuxiliar', ...await credencial(clave)});
      base.push({id:'Demo001Tit', perfil:'TestUsuario', vivienda:'DEMO-001', ...await credencial(clave)});
    }
    if (cuentas().length) throw new Error('El portal ya fue configurado.');
    guardar(base, {modulo:'Accesos', accion:'Configuración inicial', registroId:'PRES-001', usuario:'PRES-001'});
  }
  function objetivos() {
    const s=administrar();
    const vecinos=cuentas().filter(c=>c.perfil==='TestUsuario'&&vigente(c)).map(({id,vivienda,perfil})=>({id,vivienda,perfil,habilitado:true}));
    return [...(s.perfil==='TestPresidente'?Object.entries(perfilesPortal).map(([id,perfil])=>({id,perfil,habilitado:cuentas().some(c=>c.id===id)})):[]),...vecinos];
  }
  function mismaSesion(s) {
    const actual=administrar();
    if(actual.id!==s.id||actual.perfil!==s.perfil)throw new Error('La sesión cambió.');
  }
  async function asignar(id, clave) {
    const s=administrar(), objetivo=objetivos().find(o=>normalizar(o.id)===normalizar(id));
    if(!objetivo)throw new Error('No puedes gestionar ese acceso.');
    const registro=await credencial(clave);
    mismaSesion(s);
    if(!objetivos().some(o=>o.id===objetivo.id))throw new Error('El acceso cambió.');
    const lista=cuentas(), anterior=lista.find(c=>c.id===objetivo.id);
    const datos=anterior||{id:objetivo.id,perfil:objetivo.perfil};
    guardar([...lista.filter(c=>c.id!==objetivo.id),{...datos,...registro,cambioObligatorio:datos.perfil==='TestUsuario'||Boolean(datos.cambioObligatorio)}],{modulo:'Accesos',accion:anterior?'Restablecimiento de contraseña':'Habilitación de acceso',registroId:objetivo.id,usuario:s.id});
  }
  const generarClave = ()=>hex(crypto.getRandomValues(new Uint8Array(12)));
  function revisarId(r,lista) {
    if(!activo(r))throw new Error('Se requiere un residente activo con consentimiento de privacidad.');
    const id=idVecino(r);
    if(cuentas().some(c=>normalizar(c.id)===normalizar(id))||lista.some(o=>o.id!==r.id&&(normalizar(o.portalId)===normalizar(id)||(activo(o)&&normalizar(o.vivienda)===normalizar(r.vivienda)&&o.tipo===r.tipo))))throw new Error('Ya existe un ID equivalente o un acceso solicitado para ese tipo de residente en esta vivienda.');
    return id;
  }
  function guardarAlta(lista,r,s,registro) {
    const claves=['los_robles_residentes','los_robles_bitacora',claveCuentas];
    const respaldo=claves.map(k=>[k,localStorage.getItem(k)]);
    try {
      guardarResidentes(lista);
      const c={id:r.portalId,perfil:'TestUsuario',vivienda:r.vivienda,residenteId:r.id,cambioObligatorio:true,...registro};
      guardar(registro?[...cuentas(),c]:cuentas(),{modulo:'Accesos',accion:registro?'Autorización de acceso vecinal':'Solicitud de acceso vecinal',registroId:r.portalId,usuario:s.id});
    } catch(e) {
      for(const [k,v] of respaldo){if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v);}
      window.dispatchEvent(new Event('robles-datos'));throw e;
    }
  }
  async function registrarResidente(r, inicial) {
    const s=administrar();
    const anterior=obtenerResidentes().find(o=>o.id===r.id);
    if(anterior&&s.perfil!=='TestPresidente')throw new Error('Solo Presidencia edita un residente existente.');
    if(anterior?.portalId)throw new Error('Este residente ya tiene un ID de portal.');
    if(r.mesa&&!['Presidente','Tesorera','Secretario'].includes(r.rol))throw new Error('Selecciona un cargo de la Mesa Directiva.');
    const id=revisarId(r,obtenerResidentes());
    if(inicial&&s.perfil!=='TestPresidente')throw new Error('Presidencia configura la contraseña inicial al aprobar.');
    const clave=s.perfil==='TestPresidente'?(inicial||generarClave()):null;
    const registro=clave?await credencial(clave):null;
    mismaSesion(s);
    const lista=obtenerResidentes(), actual=lista.find(o=>o.id===r.id);
    if(actual?.portalId || Boolean(actual)!==Boolean(anterior))throw new Error('El residente cambió; vuelve a abrirlo.');
    revisarId(r,lista);
    const nuevo={...r,mesa:registro?Boolean(r.mesa):false,rol:registro?r.rol:'',mesaSolicitada:!registro&&r.mesa?r.rol:null,portalId:id,usuarioPortal:Boolean(registro),solicitadoPor:s.id};
    guardarAlta([...lista.filter(o=>o.id!==r.id),nuevo],nuevo,s,registro);
    return {id,clave,pendiente:!registro};
  }
  async function autorizar(residenteId, inicial) {
    const s=administrar();
    if(s.perfil!=='TestPresidente')throw new Error('Solo Presidencia autoriza el alta.');
    const clave=inicial||generarClave(),registro=await credencial(clave);
    mismaSesion(s);
    const lista=obtenerResidentes(),r=lista.find(o=>o.id===residenteId);
    if(!r?.portalId||r.usuarioPortal||revisarId(r,lista)!==r.portalId)throw new Error('No hay solicitud pendiente válida.');
    const nuevo={...r,mesa:Boolean(r.mesaSolicitada||r.mesa),rol:r.mesaSolicitada||r.rol,mesaSolicitada:null,usuarioPortal:true};
    guardarAlta(lista.map(o=>o.id===r.id?nuevo:o),nuevo,s,registro);
    return {id:r.portalId,clave};
  }
  function pendientes() {
    const s=sesion();
    if(s?.perfil!=='TestPresidente'||s.cambioObligatorio)return [];
    return obtenerResidentes().filter(r=>activo(r)&&r.portalId&&!r.usuarioPortal);
  }
  async function cambiarInicial(clave) {
    const s=sesion();
    if(!s?.cambioObligatorio)throw new Error('No hay un cambio inicial pendiente.');
    const actual=cuentas().find(c=>c.id===s.id);
    if(await derivar(String(clave),actual.sal)===actual.hash)throw new Error('La nueva contraseña debe ser distinta de la inicial.');
    const registro=await credencial(clave);
    if(sesion()?.id!==s.id||!cuentas().some(c=>c.id===s.id&&c.revision===actual.revision))throw new Error('La sesión cambió. Vuelve a iniciar sesión.');
    guardar(cuentas().map(c=>c.id===s.id?{...c,...registro,cambioObligatorio:false}:c),{modulo:'Accesos',accion:'Cambio de contraseña inicial',registroId:s.id,usuario:s.id});
    sessionStorage.setItem(claveSesion,JSON.stringify({id:s.id,revision:registro.revision,expira:s.expira}));
    window.dispatchEvent(new Event('robles-acceso'));
    return sesion();
  }
  return { configurado:()=>cuentas().length>0, configurar, iniciar, sesion, objetivos, asignar, registrarResidente, autorizar, pendientes, cambiarInicial, salir:()=>sessionStorage.removeItem(claveSesion) };
}
export const demoPortal = import.meta.env?.DEV && import.meta.env.MODE === 'demo';
export const acceso = crearServicioAcceso({demo:demoPortal});
