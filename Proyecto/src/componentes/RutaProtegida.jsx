import { Navigate } from 'react-router-dom'; import { tienePermiso } from '../servicios/permisos';
export default function RutaProtegida({ perfilActual, permiso, children }) { return tienePermiso(perfilActual, permiso) ? children : <Navigate to="/" replace />; }
