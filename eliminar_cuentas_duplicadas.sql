-- Eliminar cuentas contables duplicadas (1101-001 y 1101-002)
-- Estas fueron creadas por error y no tienen cajas vinculadas

-- Verificar antes de eliminar
SELECT id, codigo, nombre, tipo_cuenta
FROM cuentas_contables
WHERE codigo IN ('1101-001', '1101-002');

-- Eliminar las cuentas duplicadas
DELETE FROM cuentas_contables
WHERE codigo IN ('1101-001', '1101-002');

-- Verificar que se eliminaron
SELECT id, codigo, nombre, tipo_cuenta
FROM cuentas_contables
ORDER BY codigo;
