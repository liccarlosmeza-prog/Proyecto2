import { Link } from 'react-router-dom';
export default function TarjetaModulo({ titulo, texto, ruta }) { return <Link to={ruta} className="tarjeta"><h3>{titulo}</h3><p>{texto}</p><span>Ver módulo</span></Link>; }
