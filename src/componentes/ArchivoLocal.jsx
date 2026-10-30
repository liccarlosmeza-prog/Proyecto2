import { useEffect, useState } from 'react';
export function useUrlArchivo(blob) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    if (!blob) { setUrl(''); return; }
    const nueva = URL.createObjectURL(blob); setUrl(nueva);
    return () => URL.revokeObjectURL(nueva);
  }, [blob]);
  return url;
}
export function Fotografia({ fotografia }) {
  const url = useUrlArchivo(fotografia?.blob);
  return url ? <figure className="evidencia"><a href={url} target="_blank" rel="noreferrer"><img src={url} alt="Evidencia fotográfica de la falla reportada"/></a><figcaption>{fotografia.nombre} · {(fotografia.bytes / 1024).toFixed(0)} KB guardados · Original: {(fotografia.originalBytes / 1024 / 1024).toFixed(2)} MB</figcaption></figure> : null;
}
