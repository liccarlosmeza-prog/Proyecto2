import { useCallback, useEffect, useRef, useState } from 'react';
export default function useRegistrosFase2(consultar, perfil) {
  const [registros, setRegistros] = useState([]), [error, setError] = useState(''), [cargando, setCargando] = useState(true);
  const solicitud = useRef(0);
  const recargar = useCallback(async () => {
    const turno = ++solicitud.current;
    try { const datos = await consultar(perfil); if (turno === solicitud.current) { setRegistros(datos); setError(''); } }
    catch (fallo) { if (turno === solicitud.current) setError(fallo.message); }
    finally { if (turno === solicitud.current) setCargando(false); }
  }, [consultar, perfil]);
  useEffect(() => {
    setRegistros([]); setCargando(true); recargar();
    const canal = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('robles-fase2') : null;
    if (canal) canal.onmessage = recargar;
    else window.addEventListener('robles-fase2', recargar);
    window.addEventListener('focus', recargar);
    return () => { solicitud.current++; canal?.close(); window.removeEventListener('robles-fase2', recargar); window.removeEventListener('focus', recargar); };
  }, [recargar]);
  return { registros, error, cargando, recargar };
}
