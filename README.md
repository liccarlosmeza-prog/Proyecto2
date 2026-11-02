# Mi Comunidad Los Robles

Aplicación web para la administración y comunicación de la comunidad.

## Etapas

- **Fase 1 · PB03 y PB04:** centro de avisos informativos, temporales y urgentes; lectura, resolución e histórico de avisos; bitácora de avisos e histórico de pagos según perfil.
- **Fase 2 · PB05 y PB06:** actas de asamblea, autorización del Presidente, anexos para firmas y carga del acta firmada; reportes de mantenimiento con evidencia, seguimiento y cierre.
- **Fase 3 · PB07 y PB08:** directorio comunitario; reportes de recaudación y morosidad; carga de estados bancarios mensuales y conciliación manual por Tesorería, vinculando cada movimiento con su cargo o abono y vivienda.

## Visualizar en local

Requiere Node.js y npm. Desde la carpeta del proyecto, instalar las dependencias la primera vez:

```bash
npm ci
```

Iniciar la aplicación:

```bash
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Abrir [http://127.0.0.1:5173/](http://127.0.0.1:5173/) en el navegador.
