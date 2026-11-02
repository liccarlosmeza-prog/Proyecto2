import { lazy, Suspense, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import { establecerPerfilAuditoria } from './servicios/auditoria.js';
import { guardarPerfilPrueba, obtenerPerfilPrueba } from './servicios/almacenamiento';
import Encabezado from './componentes/Encabezado';
import RutaProtegida from './componentes/RutaProtegida';
import Inicio from './paginas/Inicio';
import ViviendasResidentes from './paginas/ViviendasResidentes';
import Tesoreria from './paginas/Tesoreria';
import EstadosCuenta from './paginas/EstadosCuenta';
import Movimientos from './paginas/Movimientos';
import CajaChica from './paginas/CajaChica';
import AjustesManuales from './paginas/AjustesManuales';
import Bitacora from './paginas/Bitacora';
const ActasAsamblea = lazy(() => import('./paginas/ActasAsamblea'));
const Directorio = lazy(() => import('./paginas/Directorio'));
const ReportesIndicadores = lazy(() => import('./paginas/ReportesIndicadores'));
const Mantenimiento = lazy(() => import('./paginas/Mantenimiento'));

export default function App() {
  const [perfil, setPerfil] = useState(obtenerPerfilPrueba());
  establecerPerfilAuditoria(perfil);
  const cambiar = nuevo => { guardarPerfilPrueba(nuevo); setPerfil(nuevo); };
  const protegida = (permiso, elemento) => <RutaProtegida perfilActual={perfil} permiso={permiso}>{elemento}</RutaProtegida>;
  return <><Encabezado perfilActual={perfil} alCambiarPerfil={cambiar}/><Suspense fallback={<main><p role="status">Cargando módulo…</p></main>}><Routes>
    <Route path="/" element={<Inicio perfilActual={perfil}/>}/>
    <Route path="/directorio" element={protegida('directorio', <Directorio perfilActual={perfil}/>)}/><Route path="/reportes" element={protegida('reportes', <ReportesIndicadores perfilActual={perfil}/>)}/><Route path="/actas" element={protegida('actas', <ActasAsamblea perfilActual={perfil}/>)}/>
    <Route path="/mantenimiento" element={protegida('mantenimiento', <Mantenimiento perfilActual={perfil}/>)}/>
    <Route path="/auditoria" element={protegida('auditoria', <Bitacora perfilActual={perfil}/>)}/>
    <Route path="/residentes" element={protegida('residentes', <ViviendasResidentes perfilActual={perfil}/>)}/>
    <Route path="/tesoreria" element={protegida('tesoreria', <Tesoreria perfilActual={perfil}/>)}/>
    <Route path="/tesoreria/estados-cuenta" element={protegida('estadosCuenta', <EstadosCuenta/>)}/>
    <Route path="/tesoreria/movimientos" element={protegida('movimientos', <Movimientos perfilActual={perfil}/>)}/>
    <Route path="/tesoreria/caja-chica" element={protegida('cajaChica', <CajaChica perfilActual={perfil}/>)}/>
    <Route path="/tesoreria/ajustes-manuales" element={protegida('ajustesManuales', <AjustesManuales perfilActual={perfil}/>)}/>
    <Route path="*" element={<Inicio perfilActual={perfil}/>}/>
  </Routes></Suspense></>;
}
