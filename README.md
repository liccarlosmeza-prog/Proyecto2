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
