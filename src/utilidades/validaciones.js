export const correoValido = correo => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
export const telefonoValido = telefono => /^[0-9+()\s-]{7,}$/.test(telefono);
export const montoValido = monto => Number(monto) > 0;
