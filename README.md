# Mi Comunidad Los Robles

Aplicación web para la administración y comunicación de la comunidad.

## Etapas

- **Fase 1 · PB03 y PB04:** centro de avisos, lectura, resolución, histórico y bitácora según perfil.
- **Fase 2 · PB05 y PB06:** actas de asamblea, firma y anexos; mantenimiento con evidencia, seguimiento y cierre.
- **Fase 3 · PB07 y PB08:** directorio, indicadores y conciliación bancaria mensual manual por Tesorería.
- **Fase 4 final:** cuotas de mantenimiento por mes y año; proyectos especiales con aportaciones, presupuesto y avance; cobros, estados de cuenta e indicadores separados; ejemplo de layout bancario con dos filas ilustrativas que deben borrarse.

## Visualizar en local

Requiere Node.js y npm. Desde esta carpeta, instalar dependencias la primera vez:

```bash
npm ci
```

Iniciar la aplicación:

```bash
npm run dev -- --host 127.0.0.1 --port 5176 --strictPort
```

Abrir [http://127.0.0.1:5176/](http://127.0.0.1:5176/) en el navegador.
