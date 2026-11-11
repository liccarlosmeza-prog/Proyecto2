import {useState} from 'react';
import {acceso} from '../servicios/acceso.js';

export default function CambioInicial({alGuardar,alSalir}){
 const [error,setError]=useState(''),[ocupado,setOcupado]=useState(false);
 async function guardar(e){
  e.preventDefault();
  const d=new FormData(e.currentTarget);setError('');setOcupado(true);
  try{
   if(d.get('clave')!==d.get('confirmar'))throw new Error('Las contraseñas no coinciden.');
   alGuardar(await acceso.cambiarInicial(d.get('clave')));
  }catch(e){setError(e.message);}finally{setOcupado(false);}
 }
 return <main className="portal-acceso"><section className="panel"><h1>Cambia tu contraseña inicial</h1><p>Para continuar al portal, define una contraseña personal de al menos 12 caracteres.</p><form onSubmit={guardar}><label>Nueva contraseña<input type="password" name="clave" minLength={12} maxLength={128} autoComplete="new-password" required/></label><label>Confirma la nueva contraseña<input type="password" name="confirmar" minLength={12} maxLength={128} autoComplete="new-password" required/></label>{error&&<p role="alert">{error}</p>}<button disabled={ocupado}>Guardar y entrar</button></form><button className="secundario" disabled={ocupado} onClick={alSalir}>Cerrar sesión</button></section></main>;
}
