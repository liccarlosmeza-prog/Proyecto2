# Mi Comunidad Los Robles

Aplicación web de administración y comunicación comunitaria.

- **Fase 1:** avisos, histórico y bitácora.
- **Fase 2:** actas de asamblea y mantenimiento.
- **Fase 3:** directorio, indicadores y conciliación mensual.
- **Fase 4:** cuotas variables, proyectos y estados de cuenta.
- **Producto Integrados U4:** inicio de sesión y gestión de accesos.

## Visualizar en local

```bash
npm ci
npm run dev -- --host 127.0.0.1 --port 5177 --strictPort --mode demo
```

Abre [http://127.0.0.1:5177/](http://127.0.0.1:5177/) y configura la contraseña inicial. ID de Presidencia: **PRES-001**; Auxiliar: **AUX-001**; vecino de demostración: **Demo001Tit**. Solo en modo demo estas tres cuentas se crean con la contraseña inicial indicada y aparece el selector de simulación. Usa contraseñas ficticias.

El alta de vecinos se tramita en **Viviendas y Residentes**. El ID combina cuatro letras de la calle, número e interior opcional, y termina en **Tit** o **Ren**. Las solicitudes del Auxiliar requieren autorización de Presidencia. En **Viviendas y Residentes**, usa **Acceso al portal** y el mismo botón **Guardar** para definir la contraseña inicial, aprobar solicitudes o restablecer un acceso vecinal. El Auxiliar solo restablece accesos habilitados. **Accesos del personal** queda reservado a Presidencia. Omite `--mode demo` para usar el acceso local sin simulación.

La sesión y las cuentas se guardan en el navegador. Para compartir accesos entre dispositivos o publicar con datos reales se requiere autenticación y permisos en servidor.

Si tienes un acceso vecinal anterior con prefijo VEC-, Presidencia debe abrir ese residente en el padrón, completar calle, número e interior si aplica y guardar para generar su nuevo ID.

Al ingresar, Presidencia recibe un aviso con las altas pendientes del Auxiliar, incluidos los cargos de la Mesa Directiva. Tras aprobar el alta, la contraseña inicial del acceso vecinal se muestra una sola vez y debe cambiarse en el primer ingreso. Aprobar la pertenencia a la Mesa no otorga automáticamente los permisos de una cuenta administrativa.
