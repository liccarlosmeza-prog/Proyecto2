import {useState} from 'react';
const perfiles=[['TestUsuario','Vecino'],['TestPresidente','Presidencia'],['TestAuxiliar','Auxiliar de Presidencia'],['TestTesoreria','Tesorería'],['TestAuxiliarTesoreria','Auxiliar de Tesorería'],['TestAuditor','Auditor']];
export default function SelectorPerfilPrueba({perfilActual,alCambiar}){
 const [abierto,setAbierto]=useState(false);
 return <div className="portal-demo"><button type="button" className="secundario" aria-expanded={abierto} onClick={()=>setAbierto(!abierto)}>Perfil de prueba</button>{abierto&&<label>Simular perfil<select value={perfilActual} onChange={e=>{alCambiar(e.target.value);setAbierto(false);}}>{perfiles.map(([p,n])=><option key={p} value={p}>{n}</option>)}</select></label>}</div>;
}
