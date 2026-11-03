# Ejemplo de layout bancario

El botón Ejemplo de layout descarga los encabezados y dos filas ficticias completas. Borra ambas filas antes de colocar los movimientos de tu estado bancario. El importador rechaza las referencias EJEMPLO-BORRAR si permanecen en el archivo.

Columnas obligatorias: fecha, referencia, concepto, tipo, monto, titular.

- Fecha: AAAA-MM-DD.
- Tipo: Ingreso o Egreso.
- Monto: positivo en MXN, sin símbolo de moneda ni separador de miles.
- Referencia y titular: pueden quedar vacíos si el banco no los informa; conservar los encabezados.
- Archivo UTF-8, separado por comas o punto y coma, hasta 1 MB y 2,000 movimientos.

Solo Tesorería puede cargar un mes completo y confirmar cada asociación con un cargo o abono. El sistema valida que las fechas pertenezcan al mes seleccionado. No incluir efectivo ni caja chica.

El destino de mantenimiento o proyecto se indica en Cargos y abonos; el CSV bancario no crea pagos adicionales.
