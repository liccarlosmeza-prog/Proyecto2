# Plataforma Mi Comunidad Los Robles

Proyecto académico desarrollado en React para la administración del fraccionamiento Residencial Los Robles.

## Tecnologías

- React
- Vite
- JavaScript
- CSS
- React Router DOM
- localStorage

## Funcionalidades actuales

- Inicio y avisos
- Viviendas y residentes
- Perfiles de prueba
- Tesorería
- Estados de cuenta
- Cargos y abonos
- Caja chica
- Aprobaciones de ajustes financieros

## Instalación

```bash
npm install
```

## Ejecutar

```bash
npm run dev
```

## Compilar

```bash
npm run build
```

## Sprint 1 PB03 y PB04 en web

El centro de avisos se encuentra en Inicio. Presidente y Auxiliar pueden publicar a toda la comunidad, Mesa Directiva o Tesorería. Los tipos disponibles son Informativo general, Aviso temporal (requiere vigencia futura) y Aviso urgente (prioridad visual). Cada tipo incluye una plantilla editable. Todos los perfiles pueden confirmar la lectura de los avisos que les corresponden; solo Presidente actúa como administrador y puede marcar concluido para pasar a Resuelto. La fecha de vencimiento no resuelve un aviso automáticamente.

La bitácora completa y el histórico de pagos están disponibles para Auxiliar, Presidente y Auditor. Tesorería solo consulta el histórico de pagos y los eventos del módulo Pagos. Usuario y Auxiliar de Tesorería no tienen acceso a auditoría. Incluye filtros de módulo, usuario, texto y fechas, además del histórico de pagos por vivienda. El almacenamiento existente registra altas, cambios y bajas de padrón, pagos, caja chica y ajustes financieros. Los eventos guardan usuario, acción, fecha, registro afectado y resultado. No hay controles de edición o eliminación de eventos. Los movimientos anteriores al sprint se conservan; no se inventan eventos retroactivos.

### Alcance del entorno local

La aplicación continúa siendo una demostración React con perfiles de prueba y localStorage. Los datos se comparten entre pestañas del mismo origen en el mismo navegador, no entre equipos. Las lecturas identifican perfiles de prueba, no personas autenticadas. Los permisos son controles de interfaz y servicio del cliente; no constituyen autorización de servidor. La bitácora solo admite inserciones desde la aplicación, pero el usuario del equipo puede alterar o borrar localStorage. Para garantizar inalterabilidad y seguridad real de PB03 se requiere persistencia en servidor, autenticación y permisos de base de datos.

Las notificaciones de escritorio son opcionales y requieren permiso del navegador. Se muestran al recibir nuevos avisos en una pestaña del sitio en segundo plano. Sin ese permiso, los avisos se pueden consultar y leer dentro del sitio. No se implementó push con el sitio cerrado: eso requiere un servicio de envío y suscripciones Web Push en servidor. No se usa Android ni iOS.

### Verificación

Ejecutar `node --test tests/sprint1.test.mjs` para validar publicación, resolución exclusiva del administrador, segmentación, lecturas idempotentes, vigencia, auditoría del padrón y pagos, conservación de eventos y acceso a auditoría. Ejecutar `npm run build` para compilar.

Para revisión manual: publicar un aviso con Presidente, cambiar a Usuario y marcarlo leído, regresar a Presidente y consultar el registro de lectura, marcarlo concluido y filtrar Resueltos. Publicar otro para Tesorería y verificar que Usuario no lo recibe. Registrar o modificar un residente y un pago, y consultar los eventos como Auditor. La bitácora no ofrece edición ni eliminación.

El perfil Usuario organiza sus avisos en Activos sin leer, Leídos en seguimiento, Concluidos por archivar e Histórico. La resolución exige una nueva lectura del cierre, incluso si el aviso original ya se había leído. Solo un aviso resuelto cuyo cierre fue leído puede enviarse al histórico personal; archivarlo no cambia el estado global ni lo oculta a otros perfiles.

## Fase 2 Semana 2 PB05 y PB06

Esta carpeta es una copia independiente del código actual de Proyecto2, con todas las funciones de la fase 1 y los módulos nuevos. La carpeta Proyecto2 conserva su versión anterior. No se copió su directorio Git ni se realizaron envíos a GitHub. Las dependencias se instalaron en Fase2 y se actualizaron Vite y source-map-js por los avisos de seguridad detectados durante la instalación de jsPDF.

### PB05 Actas de asamblea

- Auxiliar (Secretario) y Presidente pueden crear y editar borradores con fecha, lugar, orden del día, asistentes y acuerdos.
- El borrador permite generar una vista PDF. Solo Presidente autoriza el documento con nombre, cargo fijo Presidente, firma manuscrita y confirmación de cierre.
- Al confirmar se genera y guarda una única versión del PDF final, junto con firma, fecha, perfil y huella SHA-256. El servicio bloquea la edición y una segunda firma.
- Los demás perfiles consultan las actas firmadas y pueden descargar su PDF. Los borradores solo son visibles para Auxiliar y Presidente.
- El control de versión evita que una pestaña sobrescriba o firme cambios que otra pestaña haya realizado sin revisión.

### PB06 Gestor de mantenimiento

- Los perfiles de residentes pueden crear reportes con título, ubicación, categoría, descripción y fotografía obligatoria. Auditor no genera reportes.
- Se admiten JPG, PNG y WebP de hasta 40 MB. Antes de guardar se convierten a JPEG con un máximo de 1600 píxeles en su lado mayor y menos de 1 MB de peso.
- Cada reporte recibe folio, autor, fecha e historial. Cada perfil consulta sus propios reportes; Presidente y Auxiliar administran todos.
- Estatus global: Activo o Cerrado. Resuelto sigue Activo hasta el cierre. Etapas: Reportado → Seguimiento (opcional) → Asignado → En proceso → Resuelto → Cerrado. Resuelto puede volver a En proceso si se requiere otra intervención. Cerrado no admite más cambios.
- La asignación requiere responsable. Cada seguimiento requiere una nota, registra fecha y autor, y conserva los eventos anteriores.

### Almacenamiento y alcance

Las actas, PDF finales y fotografías se guardan en IndexedDB del navegador para evitar el límite de localStorage. El servidor de Fase2 usa la misma dirección 127.0.0.1:5173 que la versión anterior; así se conservan los datos de fase 1 existentes en ese navegador. Copiar los archivos del proyecto a otro equipo no copia estos datos. Cambiar de navegador u origen requiere migrar o volver a registrar la información. La consulta permanece disponible mientras se conserve el almacenamiento local.

Se conservan los perfiles de prueba, no cuentas individuales autenticadas. La firma manuscrita es una demostración gráfica y no una firma digital certificada. La huella identifica los bytes del PDF; no certifica identidad. El bloqueo protege el flujo de la aplicación, no las herramientas externas del navegador. El resguardo central, respaldos, autenticación real y firma certificada requieren servicios de servidor.

El historial de cada acta o reporte se guarda junto con el registro. Las acciones también se envían a la bitácora general de fase 1; si ese almacenamiento estuviera lleno o corrupto, el registro y su historial se conservan y la consola informa que falló la actualización de la bitácora general.

### Ejecución y comprobación

- `npm ci`: instalar las versiones del archivo de bloqueo.
- `npm run dev -- --host 127.0.0.1 --port 5173 --strictPort`: iniciar esta versión local.
- `npm test`: pruebas de fases 1 y 2, incluidos permisos, bloqueo de actas, resguardo PDF, concurrencia, evidencia y flujo de mantenimiento.
- `npm run build`: compilar la versión web.

Validación realizada: 16 pruebas automatizadas; consulta de PDF firmado y de documento de cuatro páginas; creación y firma de acta en navegador; fotografía de prueba de 11.35 MB comprimida a 860 KB; reporte, asignación y seguimiento por Auxiliar. Los ejemplos visibles se identifican como pruebas locales.


## Ajustes de revisión de Fase 2

El centro de avisos inicia con el filtro Activos. En Usuario se conserva el retorno de un cierre sin leer a la bandeja de pendientes; las bandejas de concluidos e histórico seleccionan Resueltos para mostrar su contenido.

Mantenimiento inicia con el estatus global Activos. El filtro de proceso y sus conteos son independientes: Reportado, Seguimiento, Asignado, En proceso, Resuelto y Cerrado. Un reporte resuelto sigue Activo hasta su cierre administrativo. Los datos existentes se clasifican por su etapa actual, sin sobrescribir su historial.

Se eliminó el perfil Secretaría del selector y de los permisos. Auxiliar ejerce como Secretario; Auxiliar y Presidente redactan y editan borradores, pero solo Presidente puede firmar y autorizar el PDF oficial. El cargo del firmante está fijado a Presidente en la interfaz y en el servicio. La Mesa Directiva se presenta con tres puestos: Presidente, Tesorera y Secretario. El padrón reconoce también el valor antiguo Tesorero para preservar los registros financieros existentes.

El PDF de impresión contiene el acta, una hoja para firmas autógrafas de la Mesa Directiva y un anexo con nombres y espacios de firma de participantes. El PDF generado ya no incluye el perfil de prueba. La autorización del Presidente no implica que se hayan recibido todas las firmas. El acta aparece como pendiente de firmas hasta la carga del documento de regreso.

Auxiliar y Presidente pueden cargar un PDF de hasta 20 MB después de revisar las firmas y confirmar que corresponde al acta. Se valida su estructura, legibilidad y ausencia de contraseña; la aplicación no verifica automáticamente la autenticidad de firmas manuscritas. Se guarda el PDF recibido con fecha, autor y huella SHA-256, sin reemplazar el documento original para firmas; se conservan las entregas anteriores. Los demás perfiles pueden consultar los documentos recibidos.

Los PDF de una plantilla anterior se muestran para impresión con los anexos del formato actual, conservando los bytes originales resguardados. Las actas anteriores no autorizadas por Presidente se identifican como documentos de la versión anterior, sin atribuirle una firma que no realizó.
