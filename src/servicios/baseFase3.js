let conexion;
export function abrirBase() {
  if (!conexion) conexion = new Promise((resolve, reject) => {
    const solicitud = indexedDB.open('los_robles_fase3', 1);
    solicitud.onupgradeneeded = () => {
      for (const nombre of ['cortes']) solicitud.result.createObjectStore(nombre, { keyPath: 'id' });
    };
    solicitud.onsuccess = () => resolve(solicitud.result);
    solicitud.onerror = () => { conexion = null; reject(new Error('No se pudo abrir el almacenamiento local.')); };
    solicitud.onblocked = () => { conexion = null; reject(new Error('Cierra las otras pestañas del sitio para actualizar el almacenamiento.')); };
  });
  return conexion;
}
export async function listarRegistros(nombre) {
  const db = await abrirBase();
  return new Promise((resolve, reject) => {
    const peticion = db.transaction(nombre).objectStore(nombre).getAll();
    peticion.onsuccess = () => resolve(peticion.result);
    peticion.onerror = () => reject(new Error('No fue posible consultar los registros.'));
  });
}
// La lectura y escritura ocurren en una transacción para evitar sobrescribir cambios de otra pestaña.
export async function actualizarRegistro(nombre, id, transformar) {
  const db = await abrirBase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(nombre, 'readwrite'), almacen = tx.objectStore(nombre);
    let actualizado, fallo;
    const peticion = almacen.get(id);
    peticion.onsuccess = () => {
      try {
        actualizado = transformar(peticion.result);
        almacen.put(actualizado);
      } catch (error) { fallo = error; tx.abort(); }
    };
    tx.oncomplete = () => {
      window.dispatchEvent(new Event('robles-fase2'));
      if (typeof BroadcastChannel !== 'undefined') { const canal = new BroadcastChannel('robles-fase2'); canal.postMessage({ nombre, id }); canal.close(); }
      resolve(actualizado);
    };
    tx.onabort = tx.onerror = () => reject(fallo || new Error('No se pudo guardar. Revisa el espacio disponible del navegador.'));
  });
}
