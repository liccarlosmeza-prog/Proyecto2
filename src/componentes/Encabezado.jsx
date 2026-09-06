import { Link } from 'react-router-dom'; import SelectorPerfilPrueba from './SelectorPerfilPrueba';
export default function Encabezado({ perfilActual, alCambiarPerfil }) { return <header><Link to="/" className="marca"><span>Mi Comunidad</span><strong>LOS ROBLES</strong></Link><SelectorPerfilPrueba perfilActual={perfilActual} alCambiar={alCambiarPerfil}/></header>; }
