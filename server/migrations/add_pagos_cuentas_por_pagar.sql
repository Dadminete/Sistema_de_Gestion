-- Migración: Agregar tabla para almacenar historial de pagos de cuentas por pagar
-- Fecha: 2025-12-21

-- Crear tabla para pagos de cuentas por pagar
CREATE TABLE IF NOT EXISTS pagos_cuentas_por_pagar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cuenta_por_pagar_id UUID NOT NULL REFERENCES cuentas_por_pagar(id) ON DELETE CASCADE,
    monto DECIMAL(12, 2) NOT NULL,
    fecha_pago DATE NOT NULL,
    metodo_pago VARCHAR(50) NOT NULL,
    numero_referencia VARCHAR(100),
    observaciones TEXT,
    creado_por UUID REFERENCES usuarios(id),
    created_at TIMESTAMPTZ(6) DEFAULT NOW(),
    updated_at TIMESTAMPTZ(6) DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_pagos_cpp_cuenta_id ON pagos_cuentas_por_pagar(cuenta_por_pagar_id);
CREATE INDEX IF NOT EXISTS idx_pagos_cpp_fecha_pago ON pagos_cuentas_por_pagar(fecha_pago);
CREATE INDEX IF NOT EXISTS idx_pagos_cpp_creado_por ON pagos_cuentas_por_pagar(creado_por);
CREATE INDEX IF NOT EXISTS idx_pagos_cpp_metodo_pago ON pagos_cuentas_por_pagar(metodo_pago);

-- Comentarios para documentación
COMMENT ON TABLE pagos_cuentas_por_pagar IS 'Almacena el historial de pagos realizados a las cuentas por pagar';
COMMENT ON COLUMN pagos_cuentas_por_pagar.cuenta_por_pagar_id IS 'Referencia a la cuenta por pagar';
COMMENT ON COLUMN pagos_cuentas_por_pagar.monto IS 'Monto pagado en este pago';
COMMENT ON COLUMN pagos_cuentas_por_pagar.fecha_pago IS 'Fecha en que se realizó el pago';
COMMENT ON COLUMN pagos_cuentas_por_pagar.metodo_pago IS 'Método de pago utilizado (efectivo, transferencia, cheque, etc.)';
COMMENT ON COLUMN pagos_cuentas_por_pagar.numero_referencia IS 'Número de referencia del pago (opcional)';
