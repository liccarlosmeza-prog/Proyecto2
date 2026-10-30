import { jsPDF } from 'jspdf';
import { cargosMesa } from './fase2Reglas.js';
export const VERSION_PLANTILLA_ACTA = 2;
export function generarPdfActa(acta) {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  const margen = 20, ancho = 170;
  let y = 23;
  const espacio = alto => { if (y + alto > 272) { pdf.addPage(); y = 23; } };
  const texto = (contenido, { titulo = false, tamano = 11 } = {}) => {
    pdf.setFont('helvetica', titulo ? 'bold' : 'normal'); pdf.setFontSize(tamano);
    const lineas = pdf.splitTextToSize(String(contenido), ancho);
    for (const linea of lineas) { espacio(6); pdf.text(linea, margen, y); y += 5.6; }
    y += titulo ? 3 : 5;
  };
  const cabecera = titulo => {
    pdf.setTextColor(35, 74, 53); texto('MI COMUNIDAD LOS ROBLES', { titulo: true, tamano: 17 });
    pdf.setTextColor(40, 45, 40); texto(titulo, { titulo: true, tamano: 14 });
    texto(`${acta.folio} | ${acta.estado === 'Firmada' ? 'PARA FIRMAS AUTOGRAFAS' : 'BORRADOR SIN AUTORIZAR'}`, { tamano: 10 });
  };
  cabecera('Acta de asamblea');
  texto(acta.titulo, { titulo: true, tamano: 13 });
  texto(`Fecha de asamblea: ${acta.fecha}\nLugar: ${acta.lugar}`);
  for (const [titulo, contenido] of [['Orden del día', acta.ordenDia], ['Asistentes', acta.asistentes], ['Acuerdos', acta.acuerdos]]) {
    espacio(22); texto(titulo, { titulo: true, tamano: 12 }); texto(contenido);
  }
  if (acta.estado === 'Firmada' && acta.firma && acta.firmadoPor === 'TestPresidente') {
    espacio(67); texto('Autorización del Presidente', { titulo: true, tamano: 12 });
    pdf.addImage(acta.firma.imagen, 'PNG', margen, y, 70, 25); y += 29;
    texto(`${acta.firma.nombre} | Presidente\nFecha de autorización: ${new Date(acta.fechaFirma).toLocaleString('es-MX')}`);
    texto('Recabar las firmas autógrafas en los anexos y devolver el documento completo firmado.', { tamano: 9 });
  } else if (acta.estado === 'Firmada') texto('Documento de una versión anterior. Recabar las firmas autógrafas de la Mesa Directiva y participantes.', { tamano: 9 });
  else texto('Borrador sujeto a revisión y autorización del Presidente.', { tamano: 9 });

  pdf.addPage(); y = 23; cabecera('Anexo A Firmas de la Mesa Directiva');
  texto(acta.titulo, { titulo: true });
  texto('Los integrantes de la Mesa Directiva firman de conformidad con los acuerdos contenidos en esta acta.', { tamano: 10 });
  const nombres = [acta.firmadoPor === 'TestPresidente' ? acta.firma?.nombre : acta.presidente, acta.tesorera, acta.secretario];
  cargosMesa.forEach((cargo, indice) => {
    espacio(57); texto(cargo, { titulo: true, tamano: 12 });
    texto(`Nombre: ${nombres[indice] || '____________________________________________________'}`, { tamano: 10 });
    y += 18; pdf.setDrawColor(100); pdf.line(margen, y, margen + 135, y); y += 7;
    texto('Firma autógrafa', { tamano: 9 }); y += 5;
  });

  const participantes = String(acta.asistentes || '').split(/\r?\n/).map(nombre => nombre.trim()).filter(Boolean);
  while (participantes.length < 8) participantes.push('');
  const cabeceraParticipantes = continuacion => {
    pdf.addPage(); y = 23; cabecera(`Anexo B Participantes${continuacion ? ' continuación' : ''}`);
    texto('Nombre y firma autógrafa de quienes participaron en la asamblea.', { tamano: 10 });
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(10); pdf.text('Nombre del participante', margen, y); pdf.text('Firma autógrafa', margen + 100, y); y += 7;
  };
  cabeceraParticipantes(false);
  participantes.forEach((nombre, indice) => {
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10);
    const lineas = pdf.splitTextToSize(`${indice + 1}. ${nombre}`, 90), alto = Math.max(22, lineas.length * 5 + 10);
    if (y + alto > 268) cabeceraParticipantes(true);
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10); pdf.text(lineas, margen, y + 5);
    pdf.setDrawColor(175); pdf.line(margen + 100, y + alto - 6, 190, y + alto - 6); pdf.line(margen, y + alto, 190, y + alto); y += alto;
  });
  const paginas = pdf.getNumberOfPages();
  for (let pagina = 1; pagina <= paginas; pagina++) {
    pdf.setPage(pagina); pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(100);
    pdf.text(`${acta.folio} | ${pagina} / ${paginas}${acta.estado === 'Borrador' ? ' | BORRADOR' : ''}`, margen, 286);
  }
  return new Blob([pdf.output('arraybuffer')], { type: 'application/pdf' });
}
