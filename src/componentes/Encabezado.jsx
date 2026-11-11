import {Link} from 'react-router-dom';
import SelectorPerfilPrueba from './SelectorPerfilPrueba';
import {demoPortal} from '../servicios/acceso.js';
export default function Encabezado({perfilActual,alCambiarPerfil,sesion,administrar,salir}){
 return <header><Link to="/" className="marca"><span>Mi Comunidad</span><strong>LOS ROBLES</strong><small className="fase2-marca">PRODUCTO INTEGRADOS U4</small></Link>
 <div className="portal-acciones"><small>ID: <strong>{sesion.id}</strong></small>{administrar&&sesion.perfil==='TestPresidente'&&<Link to="/accesos">Accesos del personal</Link>}{demoPortal&&<SelectorPerfilPrueba perfilActual={perfilActual} alCambiar={alCambiarPerfil}/>}<button className="secundario" onClick={salir}>Cerrar sesión</button></div></header>;
}
