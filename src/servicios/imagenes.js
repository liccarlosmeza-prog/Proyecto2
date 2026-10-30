export async function comprimirFotografia(archivo) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(archivo.type)) throw new Error('Selecciona una fotografía JPG, PNG o WebP.');
  if (archivo.size > 40 * 1024 * 1024) throw new Error('La fotografía no puede superar 40 MB.');
  const url = URL.createObjectURL(archivo);
  try {
    const imagen = await new Promise((resolve, reject) => {
      const elemento = new Image(); elemento.onload = () => resolve(elemento); elemento.onerror = () => reject(new Error('El archivo no contiene una fotografía válida.')); elemento.src = url;
    });
    if (!imagen.naturalWidth || !imagen.naturalHeight) throw new Error('La imagen no tiene dimensiones válidas.');
    const lienzo = document.createElement('canvas');
    const proporcion = Math.min(1, 1600 / Math.max(imagen.naturalWidth, imagen.naturalHeight));
    lienzo.width = Math.max(1, Math.round(imagen.naturalWidth * proporcion)); lienzo.height = Math.max(1, Math.round(imagen.naturalHeight * proporcion));
    const contexto = lienzo.getContext('2d');
    contexto.fillStyle = '#ffffff'; contexto.fillRect(0, 0, lienzo.width, lienzo.height); contexto.drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
    let calidad = 0.85, blob;
    for (let intento = 0; intento < 12; intento++) {
      blob = await new Promise(resolve => lienzo.toBlob(resolve, 'image/jpeg', calidad));
      if (blob && blob.size < 1024 * 1024) return { blob, nombre: archivo.name.replace(/\.[^.]+$/, '') + '.jpg', originalBytes: archivo.size, bytes: blob.size, ancho: lienzo.width, alto: lienzo.height };
      if (calidad > 0.4) calidad -= 0.15;
      else {
        const reducido = document.createElement('canvas'); reducido.width = Math.max(1, Math.round(lienzo.width * 0.75)); reducido.height = Math.max(1, Math.round(lienzo.height * 0.75)); reducido.getContext('2d').drawImage(lienzo, 0, 0, reducido.width, reducido.height);
        lienzo.width = reducido.width; lienzo.height = reducido.height; lienzo.getContext('2d').drawImage(reducido, 0, 0);
      }
    }
    throw new Error('No fue posible comprimir la fotografía por debajo de 1 MB.');
  } finally { URL.revokeObjectURL(url); }
}
