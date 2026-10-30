import { actualizarRegistro, listarRegistros } from './baseFase2.js';
import { editaActas, firmaActas, validarActa } from './fase2Reglas.js';
import { generarPdfActa, VERSION_PLANTILLA_ACTA } from './pdfActas.js';
import { registrarEvento } from './auditoria.js';
function auditar(evento) {
  try { registrarEvento({ modulo: 'Actas de asamblea', ...evento }); }
  catch (error) { console.warn('El acta y su historial se guardaron; la bitácora general no pudo actualizarse.', error); }
}
export async function consultarActas(perfil) {
  return (await listarRegistros('actas')).filter(acta => editaActas(perfil) || acta.estado === 'Firmada').sort((a, b) => b.creada.localeCompare(a.creada));
}
export async function guardarBorrador(datos, perfil, id, version) {
  if (!editaActas(perfil)) throw new Error('Solo Auxiliar (Secretario) y Presidente pueden redactar actas.');
  validarActa(datos);
  const identificador = id || crypto.randomUUID(), ahora = new Date().toISOString();
  const acta = await actualizarRegistro('actas', identificador, anterior => {
    if (id && !anterior) throw new Error('No se encontró el acta.');
    if (anterior?.estado === 'Firmada') throw new Error('El acta firmada está bloqueada y no admite cambios.');
    if (anterior && anterior.version !== version) throw new Error('El acta cambió en otra pestaña. Vuelve a abrirla antes de editar.');
    const contenido = Object.fromEntries(['titulo', 'fecha', 'lugar', 'ordenDia', 'asistentes', 'acuerdos', 'presidente', 'tesorera', 'secretario'].map(campo => [campo, String(datos[campo] || '').trim()]));
    return { ...contenido, id: identificador, folio: anterior?.folio || `ACT-${ahora.slice(0, 4)}-${identificador.slice(0, 8).toUpperCase()}`, estado: 'Borrador', creada: anterior?.creada || ahora, creadaPor: anterior?.creadaPor || perfil, actualizada: ahora, version: (anterior?.version || 0) + 1, historial: [...(anterior?.historial || []), { fecha: ahora, usuario: perfil, accion: anterior ? 'Borrador actualizado' : 'Borrador creado' }] };
  });
  auditar({ accion: 'Guardar borrador', registroId: acta.folio, usuario: perfil, detalle: acta.titulo });
  return acta;
}
export async function firmarActa(id, firma, perfil, version) {
  if (!firmaActas(perfil)) throw new Error('Solo Presidente puede firmar y autorizar la descarga para firmas autógrafas.');
  if (firma.cargo !== 'Presidente') throw new Error('El cargo del firmante debe ser Presidente.');
  if (!firma.nombre?.trim() || !firma.cargo?.trim() || !firma.confirmado || !/^data:image\/png;base64,/.test(firma.imagen || '') || firma.imagen.length > 400000) throw new Error('Completa el nombre, cargo, firma manuscrita y confirmación de cierre.');
  if (firma.nombre.length > 120 || firma.cargo.length > 100) throw new Error('El nombre o cargo supera la longitud permitida.');
  const original = (await listarRegistros('actas')).find(acta => acta.id === id);
  if (!original || original.estado !== 'Borrador') throw new Error('Solo se puede firmar un borrador existente.');
  if (original.version !== version) throw new Error('El borrador cambió. Revísalo de nuevo antes de firmar.');
  validarActa(original);
  const firmada = { ...original, estado: 'Firmada', plantillaVersion: VERSION_PLANTILLA_ACTA, firma: { nombre: firma.nombre.trim(), cargo: firma.cargo.trim(), imagen: firma.imagen }, fechaFirma: new Date().toISOString(), firmadoPor: perfil, version: original.version + 1 };
  const pdfFinal = generarPdfActa(firmada);
  const digest = await crypto.subtle.digest('SHA-256', await pdfFinal.arrayBuffer());
  firmada.pdfFinal = pdfFinal;
  firmada.huellaPdf = [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
  firmada.historial = [...original.historial, { fecha: firmada.fechaFirma, usuario: perfil, accion: 'Acta firmada y bloqueada' }];
  const resultado = await actualizarRegistro('actas', id, actual => {
    if (!actual || actual.estado !== 'Borrador' || actual.version !== version) throw new Error('El acta cambió durante la firma. Vuelve a consultarla.');
    return firmada;
  });
  auditar({ accion: 'Firma y bloqueo', registroId: resultado.folio, usuario: perfil, detalle: resultado.huellaPdf });
  return resultado;
}

export async function cargarActaFirmada(id, archivo, perfil, version, confirmado, observaciones = '') {
  if (!editaActas(perfil)) throw new Error('Solo Auxiliar y Presidente pueden cargar el acta firmada.');
  if (!confirmado) throw new Error('Confirma que revisaste las firmas autógrafas del documento.');
  if (!archivo || !archivo.name?.toLowerCase().endsWith('.pdf') || archivo.size <= 0 || archivo.size > 20 * 1024 * 1024) throw new Error('Selecciona un PDF válido de hasta 20 MB.');
  const bytes = await archivo.arrayBuffer();
  if (!new TextDecoder().decode(bytes.slice(0, 8)).startsWith('%PDF-')) throw new Error('El archivo no contiene un PDF válido.');
  try {
    const { PDFDocument } = await import('pdf-lib');
    const documento = await PDFDocument.load(bytes);
    if (documento.isEncrypted || documento.getPageCount() < 1) throw new Error('PDF no disponible');
  } catch { throw new Error('El PDF está dañado o protegido. Carga una copia legible sin contraseña.'); }
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  const anexo = { observaciones: String(observaciones).trim().slice(0, 500), id: crypto.randomUUID(), nombre: archivo.name, blob: new Blob([bytes], { type: 'application/pdf' }), fecha: new Date().toISOString(), usuario: perfil, bytes: archivo.size, huella: [...new Uint8Array(hash)].map(byte => byte.toString(16).padStart(2, '0')).join('') };
  const resultado = await actualizarRegistro('actas', id, actual => {
    if (!actual || actual.estado !== 'Firmada') throw new Error('Primero el Presidente debe autorizar el acta para firmas.');
    if (actual.version !== version) throw new Error('El acta cambió. Vuelve a abrirla antes de cargar el documento.');
    if (actual.pdfsFirmados?.some(pdf => pdf.huella === anexo.huella)) throw new Error('Este PDF ya se encuentra resguardado en el acta.');
    return { ...actual, version: actual.version + 1, pdfsFirmados: [...(actual.pdfsFirmados || []), anexo], historial: [...actual.historial, { fecha: anexo.fecha, usuario: perfil, accion: 'PDF con firmas autógrafas recibido', archivo: archivo.name }] };
  });
  auditar({ accion: 'Recepción de acta firmada', registroId: resultado.folio, usuario: perfil, detalle: `${anexo.nombre} · ${anexo.huella}` });
  return resultado;
}

export function pdfParaFirmas(acta) {
  return acta.plantillaVersion === VERSION_PLANTILLA_ACTA && acta.pdfFinal ? acta.pdfFinal : generarPdfActa(acta);
}
