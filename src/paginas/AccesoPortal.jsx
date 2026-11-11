import {useState} from 'react';
import {acceso, demoPortal} from '../servicios/acceso.js';

export default function AccesoPortal({alEntrar}) {
 const [configurado,setConfigurado]=useState(acceso.configurado),[error,setError]=useState(''),[ocupado,setOcupado]=useState(false),[aviso,setAviso]=useState('');
 async function enviar(e) {
   e.preventDefault();
   const datos=new FormData(e.currentTarget);
   setError('');setOcupado(true);
   try {
     if (!configurado) {
       if(datos.get('clave')!==datos.get('confirmar'))throw new Error('Las contraseñas no coinciden.');
       await acceso.configurar(datos.get('clave'));
       setConfigurado(true);setAviso('Configuración guardada. Ya puedes iniciar sesión.');
     } else alEntrar(await acceso.iniciar(datos.get('id'),datos.get('clave')));
   } catch(e){setError(e.message);} finally{setOcupado(false);}
 }
 return <main className="portal-acceso"><section className="panel"><p className="sobretitulo">MI COMUNIDAD LOS ROBLES · U4</p><h1>{configurado?'Iniciar sesión':'Configurar acceso de Presidencia'}</h1>
 <p>{configurado?'Usa el ID y la contraseña que te entregó la administración.':'En esta instalación local, Presidencia define la contraseña inicial de PRES-001.'}</p>
 <dl><dt>Presidencia</dt><dd><code>PRES-001</code></dd><dt>Auxiliar de Presidencia</dt><dd><code>AUX-001</code></dd><dt>Vecinos</dt><dd>Cuatro letras de la calle, número e interior si aplica, más Tit o Ren. Ejemplo: <code>Maga781CTit</code>.</dd></dl>
 {demoPortal&&<p className="mensaje-info">Modo demostración. En la primera configuración se crean también AUX-001 y Demo001Tit con la contraseña inicial que definas aquí. Usa datos ficticios.</p>}
 <form key={configurado?'entrar':'configurar'} onSubmit={enviar}>
 {configurado&&<label>ID de acceso<input name="id" required autoComplete="username" maxLength={120}/></label>}
 <label>Contraseña<input name="clave" type="password" required minLength={configurado?undefined:12} maxLength={128} autoComplete={configurado?'current-password':'new-password'}/></label>
 {!configurado&&<label>Confirma la contraseña<input name="confirmar" type="password" required minLength={12} maxLength={128} autoComplete="new-password"/></label>}
 {error&&<p role="alert" className="mensaje-error">{error}</p>}{aviso&&<p role="status">{aviso}</p>}
 <button disabled={ocupado}>{configurado?'Entrar al portal':'Configurar Presidencia'}</button></form>
 <p className="ayuda">Para recuperar el acceso, contacta a Presidencia o a su Auxiliar. La configuración se guarda en este navegador.</p>
 </section></main>;
}
