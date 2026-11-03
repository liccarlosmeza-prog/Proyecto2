# Conciliación mensual — Fase4 final

1. Configurar cuotas por mes y proyectos desde Cuotas y proyectos.
2. Capturar cada cobro o gasto en Cargos y abonos, seleccionando Mantenimiento o Proyecto. Un cobro de mantenimiento puede cubrir varios meses publicados, con distribución explícita que respeta sus importes variables; un cobro de proyecto se aplica solo al proyecto seleccionado. El titular de origen es obligatorio para cobros bancarios nuevos.
3. Descargar Ejemplo de layout. Contiene encabezados y dos filas ficticias. Borrar ambas antes de cargar datos. El importador rechaza las referencias EJEMPLO-BORRAR.
4. Solo Tesorería importa un mes completo. Columnas: fecha, referencia, concepto, tipo, monto, titular. Referencia y titular pueden tener celda vacía si el banco no los informa. No duplicar el mes: el sistema bloquea una segunda carga, incluso concurrente.
5. Revisar cada fila bancaria y confirmar su cargo/abono asociado. Se muestran casa y destino, incluyendo el nombre del proyecto. Nombre, casa, concepto y referencia ayudan a buscar. Se exige misma fecha exacta, tipo e importe. No hay conciliación automática.
6. Mostrar Todos, Asociados o Sin identificar. Descargar las asociaciones como CSV y conservar el original. Importar no crea pagos adicionales.

Cada registro bancario se asocia a un solo cargo/abono. Para repartir un depósito entre varios destinos sería necesario ampliar la conciliación a varias aplicaciones; esta versión conserva la relación uno a uno acordada en Fase3. No se debe capturar dos veces el mismo depósito para simularlo.

Los movimientos conciliados no se editan ni eliminan sin quitar primero su asociación. Las aprobaciones de ajustes usan las mismas validaciones y no pueden saltarse este bloqueo. Las cuotas y bases económicas de proyectos publicados se conservan para no cambiar de forma silenciosa el historial de adeudos.

Ejemplos e instrucciones: public/ejemplos/LEEME.md. La instancia local final usa el puerto 5176 y los datos de su propio navegador.
