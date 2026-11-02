# Conciliación mensual manual — Fase3

Solo el perfil Tesorería carga y confirma/quita asociaciones. Presidente, Auxiliar y Auditor mantienen consulta según sus permisos; Presidente ya no importa ni vincula.

1. Registrar el cobro en Cargos y abonos, indicando casa, fecha, importe, meses aplicados, Transferencia o Depósito bancario y titular de la cuenta de origen. Referencia bancaria opcional; titular obligatorio para cobros bancarios nuevos. Las capturas anteriores se conservan y pueden editarse para completar el titular.
2. Preparar CSV UTF-8 con encabezados `fecha,referencia,concepto,tipo,monto,titular`. Titular debe estar como columna, pero su celda puede estar vacía si el banco no la informa. Referencia también puede estar vacía. No inventar esos datos. Fechas AAAA-MM-DD, tipo Ingreso/Egreso, importe positivo sin separador de miles. Máximo 1 MB y 2,000 registros.
3. Elegir un mes y confirmar que contiene todas sus operaciones. El sistema verifica que ninguna fecha quede fuera del mes; no exige operaciones el primer/último día. No puede comprobar por sí solo si el banco omitió operaciones. Un archivo no abarca varios meses. Los filtros del tablero no recortan la conciliación mensual.
4. Seleccionar una fila del banco en el panel izquierdo. A la derecha se muestran capturas bancarias libres con igual fecha exacta, tipo e importe. Referencia y titular idénticos (sin distinguir acentos/mayúsculas) priorizan sugerencias; la búsqueda permite acotar por nombre parcial, referencia, casa o concepto.
5. Confirmar explícitamente la asociación. Ninguna coincidencia automática la confirma. Si no hay captura, registrar o corregir el cargo/abono correspondiente y regresar. El proceso no crea cobros desde el banco.
6. Revisar todos los registros, las casas y sus cargos/abonos asociados, o filtrar Sin identificar. Exportar CSV de asociaciones con titulares, vivienda e identificador de captura. También se conserva el CSV original.

No se divide un movimiento entre varias capturas ni se vinculan importes o fechas diferentes. Una captura no se reutiliza dentro del mismo corte. Los estados bancarios se almacenan como cortes independientes; cargar dos archivos que se solapan no los fusiona. Para evitar duplicar la revisión, cargar una sola versión de cada estado mensual.

Los cortes anteriores permanecen disponibles, marcados sin confirmación de mes completo. Las coincidencias que antes eran automáticas pasan a pendientes, excepto vínculos manuales ya guardados. Si una captura vinculada se elimina o cambia fecha, importe o tipo, la asociación deja de considerarse válida y se muestra una alerta.

Validación: 33 pruebas automáticas correctas; compilación de producción correcta. Ejemplo ficticio en public/ejemplos/corte-mensual-con-titular.csv, sin ejecutar pagos ni contactar a nadie.
