import { lazy, Suspense, useEffect, useState } from 'react';
import { Route, Routes, Navigate, useNavigate, Link } from 'react-router-dom';
import { establecerPerfilAuditoria } from './servicios/auditoria.js';
import { acceso, demoPortal } from './servicios/acceso.js';
import AccesoPortal from './paginas/AccesoPortal';
import CambioInicial from './paginas/CambioInicial';
import GestionAccesos from './paginas/GestionAccesos';
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
const CuotasProyectos=lazy(()=>import('./paginas/CuotasProyectos'));
const ActasAsamblea = lazy(() => import('./paginas/ActasAsamblea'));
const Directorio = lazy(() => import('./paginas/Directorio'));
const ReportesIndicadores = lazy(() => import('./paginas/ReportesIndicadores'));
const Mantenimiento = lazy(() => import('./paginas/Mantenimiento'));

export default function App() {
  const navegar=useNavigate();
  const [sesion,setSesion]=useState(acceso.sesion), [simulado,setSimulado]=useState('');
  useEffect(()=>{
    const validar=()=>setSesion(acceso.sesion());
    window.addEventListener('storage',validar);
    window.addEventListener('robles-acceso',validar);
    window.addEventListener('focus',validar);
    window.addEventListener('robles-datos',validar);
    const reloj=setInterval(validar,15000);
    return ()=>{clearInterval(reloj);window.removeEventListener('storage',validar);window.removeEventListener('robles-acceso',validar);window.removeEventListener('focus',validar);window.removeEventListener('robles-datos',validar);};
  },[]);
  const perfil=(demoPortal && simulado)||sesion?.perfil;
  establecerPerfilAuditoria(sesion?.id);
  if(!sesion)return <AccesoPortal alEntrar={s=>{setSimulado('');setSesion(s);navegar('/',{replace:true});}}/>;
  if(sesion.cambioObligatorio)return <CambioInicial alGuardar={setSesion} alSalir={()=>{acceso.salir();setSesion(null);}}/>;
  const pendientes=!simulado&&sesion.perfil==='TestPresidente'?acceso.pendientes():[];
  const administrar=!simulado && ['TestPresidente','TestAuxiliar'].includes(sesion.perfil);
  const cambiar = nuevo => {if(demoPortal){setSimulado(nuevo===sesion.perfil?'':nuevo);navegar('/');}};
  const salir=()=>{acceso.salir();setSesion(null);setSimulado('');navegar('/',{replace:true});};
  const protegida = (permiso, elemento) => <RutaProtegida perfilActual={perfil} permiso={permiso}>{elemento}</RutaProtegida>;
  return <><Encabezado perfilActual={perfil} alCambiarPerfil={cambiar} sesion={sesion} administrar={administrar} salir={salir}/>{pendientes.length>0&&<aside className="panel mensaje-info" role="status"><strong>Altas del Auxiliar pendientes de aprobación: {pendientes.length}</strong> · <Link to="/residentes">Revisar solicitudes en Viviendas y Residentes</Link></aside>}<Suspense fallback={<main><p role="status">Cargando módulo…</p></main>}><Routes>
    <Route path="/accesos" element={administrar&&sesion.perfil==='TestPresidente'?<GestionAccesos/>:<Navigate to="/" replace/>}/>
    <Route path="/cuotas-proyectos" element={protegida('reportes',<CuotasProyectos perfilActual={perfil}/>)}/>
    <Route path="/" element={<Inicio perfilActual={perfil}/>}/>
    <Route path="/directorio" element={protegida('directorio', <Directorio perfilActual={perfil}/>)}/><Route path="/reportes" element={protegida('reportes', <ReportesIndicadores perfilActual={perfil}/>)}/><Route path="/actas" element={protegida('actas', <ActasAsamblea perfilActual={perfil}/>)}/>
    <Route path="/mantenimiento" element={protegida('mantenimiento', <Mantenimiento perfilActual={perfil}/>)}/>
    <Route path="/auditoria" element={protegida('auditoria', <Bitacora perfilActual={perfil}/>)}/>
    <Route path="/residentes" element={protegida('residentes', <ViviendasResidentes perfilActual={perfil} gestionaPortal={administrar}/>)}/>
    <Route path="/tesoreria" element={protegida('tesoreria', <Tesoreria perfilActual={perfil}/>)}/>
    <Route path="/tesoreria/estados-cuenta" element={protegida('estadosCuenta', <EstadosCuenta/>)}/>
    <Route path="/tesoreria/movimientos" element={protegida('movimientos', <Movimientos perfilActual={perfil}/>)}/>
    <Route path="/tesoreria/caja-chica" element={protegida('cajaChica', <CajaChica perfilActual={perfil}/>)}/>
    <Route path="/tesoreria/ajustes-manuales" element={protegida('ajustesManuales', <AjustesManuales perfilActual={perfil}/>)}/>
    <Route path="*" element={<Inicio perfilActual={perfil}/>}/>
  </Routes></Suspense></>;
}
