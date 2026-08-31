# Documentación Scrum — Plataforma Mi Comunidad "Los Robles"

**Producto:** Plataforma web para la administración de la comunidad "Los Robles"  
**Product Owner:** Mesa Directiva  
**Scrum Master:** José Carlos Meza López  
**Equipo de desarrollo:** Desarrollo Full Stack, QA, Administración, Tesorería y Legal  
**Acceso de GitHub:** `https://github.com/TU-USUARIO/mi-comunidad-los-robles` *(sustituir TU-USUARIO al publicar)*

## 1. Visión del producto

Centralizar la información operativa de la comunidad para mejorar la comunicación, la transparencia financiera, el mantenimiento y la consulta segura de documentos.

## 2. Product Backlog

| ID | Historia / alias | Prioridad | Sprint | Estimación / costo |
|---|---|---:|---:|---:|
| ROBLES-PB-01 | Padrón, usuarios y acceso | Máxima | 1 | 6 PH / $5,000 |
| ROBLES-PB-02 | Conciliación y control de pagos | Máxima | 2 | 8 PH / $34,000 |
| ROBLES-PB-03 | Auditoría y seguridad | Alta | 2 | 3 PH / $10,000 |
| ROBLES-PB-04 | Centro de notificaciones | Alta | 3 | 5 PH / $14,000 |
| ROBLES-PB-05 | Actas de asamblea | Media | 4 | 5 PH / $12,000 |
| ROBLES-PB-06 | Gestor de mantenimiento | Media | 5 | 5 PH / $17,000 |
| ROBLES-PB-07 | Directorio interactivo | Media | 5 | 3 PH / $7,000 |
| ROBLES-PB-08 | Reportes e indicadores | Baja | 6 | 3 PH / $6,000 |

## 3. Fichas de backlog

### ROBLES-PB-01 — Padrón, usuarios y acceso

**Como** Mesa Directiva, **quiero** registrar viviendas, residentes, roles y consentimiento de privacidad, **para** que cada persona consulte únicamente la información y funciones autorizadas.

- Prioridad: máxima. Sprint: 1. Estimación: 6 puntos / 80 horas.
- Criterios de aceptación: vivienda y usuario relacionados; roles aplicados; el registro se bloquea sin consentimiento; los datos quedan disponibles para los demás módulos.
- Entregable implementado: aplicación React con altas de vivienda y usuarios, asignación de roles, consentimiento obligatorio, validación de duplicados y persistencia local.

### ROBLES-PB-02 — Conciliación y control de pagos

**Como** responsable de Tesorería, **quiero** importar movimientos y registrar pagos conciliados contra el padrón, **para** actualizar saldos y disminuir la morosidad.

- Prioridad: máxima. Sprint: 2. Estimación: 8 puntos / 208 horas.
- Criterios: SPEI conciliado, recibo para pagos en efectivo, saldos actualizados y excepciones identificadas.

### ROBLES-PB-03 — Auditoría y seguridad

**Como** auditor, **quiero** una bitácora inalterable de operaciones y cambios, **para** conservar trazabilidad y detectar cambios no autorizados.

- Prioridad: alta. Sprint: 2. Estimación: 3 puntos.
- Criterios: usuario, acción, fecha, registro afectado y resultado; no editable desde la aplicación.

### ROBLES-PB-04 — Centro de notificaciones

**Como** integrante de Mesa Directiva, **quiero** publicar alertas segmentadas y consultar su lectura, **para** comunicar avisos oportunos.

- Prioridad: alta. Sprint: 3. Estimación: 5 puntos.
- Criterios: recepción móvil, segmentación correcta y evidencia de lectura.

### ROBLES-PB-05 — Actas de asamblea

**Como** responsable de Secretaría, **quiero** generar, firmar y resguardar actas como documentos finales, **para** consultar acuerdos de forma permanente.

- Prioridad: media. Sprint: 4. Estimación: 5 puntos.
- Criterios: PDF firmado, disponible para consulta y bloqueado contra modificaciones.

### ROBLES-PB-06 — Gestor de mantenimiento

**Como** residente, **quiero** reportar fallas con evidencia fotográfica y consultar su estado, **para** dar seguimiento transparente.

- Prioridad: media. Sprint: 5. Estimación: 5 puntos.
- Criterios: folio, foto comprimida, responsable, estado e historial.

### ROBLES-PB-07 — Directorio interactivo

**Como** residente, **quiero** consultar un directorio actualizado de contactos comunitarios y emergencia, **para** comunicarme rápidamente.

- Prioridad: media. Sprint: 5. Estimación: 3 puntos.
- Criterios: datos autorizados y vigentes; botones de teléfono y correo operativos.

### ROBLES-PB-08 — Reportes e indicadores

**Como** Mesa Directiva, **quiero** visualizar indicadores de recaudación, morosidad y adopción, **para** tomar decisiones verificables.

- Prioridad: baja. Sprint: 6. Estimación: 3 puntos.
- Criterios: totales conciliados, tasas calculadas y exportación para cierre.

## 4. Sprint Planning — Sprint 1

**Objetivo:** crear una base segura de datos de viviendas y residentes, con acceso por rol y consentimiento de privacidad.

| Elemento | Responsable | Estimación | Resultado esperado |
|---|---|---:|---|
| Diseñar padrón de viviendas y residentes | Dev BD / Admin | 16 h | Modelo con una vivienda y sus residentes |
| Registro y vinculación de usuarios | Dev Full Stack | 16 h | Usuario relacionado con vivienda y contacto |
| Roles y permisos | Dev Backend | 16 h | Cada rol ve solo funciones autorizadas |
| Aviso y consentimiento | Legal / Frontend | 8 h | Registro bloqueado sin consentimiento |
| Administración de usuarios y viviendas | Frontend | 16 h | Altas, cambios y bajas controlados |
| Pruebas de acceso y aceptación | QA / Administrador | 8 h | Sin accesos indebidos; evidencia de consentimiento |

**Definition of Done:** código integrado, pruebas manuales de criterios de aceptación aprobadas, sin defectos críticos y documentación actualizada.

## 5. Calendarización de sprints

Se propone una cadencia de 10 días hábiles por sprint, comenzando cuando el equipo defina la fecha de inicio.

| Sprint | Duración | Historias | Resultado esperado |
|---|---:|---|---|
| Sprint 1 | Días 1–10 | PB-01 | Padrón, acceso, roles y privacidad |
| Sprint 2 | Días 11–20 | PB-02, PB-03 | Pagos conciliados y bitácora de auditoría |
| Sprint 3 | Días 21–30 | PB-04 | Alertas segmentadas y lectura registrada |
| Sprint 4 | Días 31–40 | PB-05 | Actas firmadas y resguardadas |
| Sprint 5 | Días 41–50 | PB-06, PB-07 | Mantenimiento y directorio operativo |
| Sprint 6 | Días 51–60 | PB-08 | Indicadores, exportación y cierre |

## 6. Ceremonias Scrum

- **Sprint Planning:** al inicio de cada sprint; se revisa capacidad, objetivo y criterios de aceptación.
- **Daily Scrum:** 15 minutos diarios; avances, impedimentos y siguiente acción.
- **Sprint Review:** último día; demostración al Product Owner y recopilación de comentarios.
- **Retrospectiva:** después de la review; acordar una mejora concreta para el siguiente sprint.

## 7. Evidencia de código

El repositorio incluye la aplicación React del Sprint 1. Para ejecutarla: `npm install` y `npm run dev`. Para generar la compilación de producción: `npm run build`.
