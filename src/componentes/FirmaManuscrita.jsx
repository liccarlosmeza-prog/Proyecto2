import { useEffect, useRef, useState } from 'react';
export default function FirmaManuscrita({ alCambiar }) {
  const canvas = useRef(null), dibujando = useRef(false), trazos = useRef(0);
  const [hayFirma, setHayFirma] = useState(false);
  useEffect(() => {
    const contexto = canvas.current.getContext('2d'); contexto.strokeStyle = '#234a35'; contexto.lineWidth = 2.5; contexto.lineCap = 'round';
  }, []);
  const punto = evento => { const rect = canvas.current.getBoundingClientRect(); return [(evento.clientX - rect.left) * canvas.current.width / rect.width, (evento.clientY - rect.top) * canvas.current.height / rect.height]; };
  const finalizar = () => {
    if (!dibujando.current) return;
    dibujando.current = false;
    if (trazos.current > 4) { setHayFirma(true); alCambiar(canvas.current.toDataURL('image/png')); }
  };
  return <div className="firma-area"><p id="instruccion-firma">Dibuja tu firma con el ratón en el recuadro.</p><canvas ref={canvas} width={660} height={180} aria-label="Área para dibujar la firma manuscrita" aria-describedby="instruccion-firma" onPointerDown={evento => { evento.preventDefault(); canvas.current.setPointerCapture(evento.pointerId); dibujando.current = true; const contexto = canvas.current.getContext('2d'); contexto.beginPath(); contexto.moveTo(...punto(evento)); }} onPointerMove={evento => { if (!dibujando.current) return; canvas.current.getContext('2d').lineTo(...punto(evento)); canvas.current.getContext('2d').stroke(); trazos.current++; }} onPointerUp={finalizar} onPointerCancel={finalizar}/><div className="acciones"><button type="button" className="secundario" onClick={() => { canvas.current.getContext('2d').clearRect(0, 0, 660, 180); trazos.current = 0; setHayFirma(false); alCambiar(''); }}>Limpiar firma</button><span className="ayuda" role="status">{hayFirma ? 'Firma capturada' : 'Firma pendiente'}</span></div></div>;
}
