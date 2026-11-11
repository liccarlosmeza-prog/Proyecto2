import {useState} from 'react';
import {Link} from 'react-router-dom';
import {acceso} from '../servicios/acceso.js';

export default function GestionAccesos() {
 const [objetivos,setObjetivos]=useState(()=>acceso.objetivos().filter(o=>o.perfil!=='TestUsuario')),[mensaje,setMensaje]=useState(''),[error,setError]=useState(''),[ocupado,setOcupado]=useState(false);
 async function guardar(e){
  e.preventDefault();
  const form=e.currentTarget,d=new FormData(form);
  setError('');setMensaje('');setOcupado(true);
  try {
   if(d.get('clave')!==d.get('confirmar'))throw new Error('Las contraseñas no coinciden.');
   await acceso.asignar(d.get('id'),d.get('clave'));
   form.reset();
   if(acceso.sesion())setObjetivos(acceso.objetivos().filter(o=>o.perfil!=='TestUsuario'));
   setMensaje('Acceso guardado. Entrega el ID y la nueva contraseña por un canal privado.');
  }catch(e){setError(e.message);}finally{setOcupado(false);}
 }
 return <main className="pagina"><Link to="/">← Inicio</Link><h1>Accesos del personal</h1><p>Solo Presidencia puede generar o restablecer credenciales del personal.</p>
 <p className="ayuda">Las nuevas altas vecinales se tramitan en Viviendas y Residentes. Restablecer una contraseña invalida la sesión anterior de esa cuenta.</p>
 {objetivos.length?<form className="panel portal-acceso-form" onSubmit={guardar}><label>Cuenta<select name="id" required><option value="">Selecciona un ID</option>{objetivos.map(o=><option key={o.id} value={o.id}>{o.id} · {o.vivienda?'Vivienda '+o.vivienda:o.perfil.replace('Test','')} · {o.habilitado?'Habilitado':'Sin acceso'}</option>)}</select></label>
 <label>Nueva contraseña<input name="clave" type="password" autoComplete="new-password" required minLength={12} maxLength={128}/></label>
 <label>Confirmar contraseña<input name="confirmar" type="password" autoComplete="new-password" required minLength={12} maxLength={128}/></label><button disabled={ocupado}>Guardar acceso</button></form>:<p>No hay viviendas activas disponibles.</p>}
 {mensaje&&<p role="status">{mensaje}</p>}{error&&<p role="alert">{error}</p>}
 </main>;
}
