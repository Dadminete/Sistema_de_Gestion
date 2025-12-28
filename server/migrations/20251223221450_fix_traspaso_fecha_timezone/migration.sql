-- AlterTable
ALTER TABLE "cuentas_por_pagar" ADD COLUMN     "cuota_mensual" DECIMAL(12,2);

-- AlterTable
ALTER TABLE "empleados" ADD COLUMN     "monto_afp" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "monto_isr" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "monto_sfs" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "otros_descuentos" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "tipo_salario" VARCHAR(20) NOT NULL DEFAULT 'MENSUAL';

-- AlterTable
ALTER TABLE "nomina" ADD COLUMN     "cuenta_bancaria_id" UUID,
ADD COLUMN     "monto_banco" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "monto_caja" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "pagos_clientes" ADD COLUMN     "descuento" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "traspasos" ALTER COLUMN "fecha_traspaso" SET DATA TYPE TIMESTAMPTZ(6);

-- CreateTable
CREATE TABLE "pagos_cuentas_por_pagar" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "cuenta_por_pagar_id" UUID NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "fecha_pago" DATE NOT NULL,
    "metodo_pago" VARCHAR(50) NOT NULL,
    "numero_referencia" VARCHAR(100),
    "observaciones" TEXT,
    "creado_por" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "pagos_cuentas_por_pagar_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pagos_cuentas_por_pagar_cuenta_por_pagar_id_idx" ON "pagos_cuentas_por_pagar"("cuenta_por_pagar_id");

-- CreateIndex
CREATE INDEX "pagos_cuentas_por_pagar_fecha_pago_idx" ON "pagos_cuentas_por_pagar"("fecha_pago");

-- CreateIndex
CREATE INDEX "pagos_cuentas_por_pagar_creado_por_idx" ON "pagos_cuentas_por_pagar"("creado_por");

-- CreateIndex
CREATE INDEX "pagos_cuentas_por_pagar_metodo_pago_idx" ON "pagos_cuentas_por_pagar"("metodo_pago");

-- AddForeignKey
ALTER TABLE "nomina" ADD CONSTRAINT "nomina_cuenta_bancaria_id_fkey" FOREIGN KEY ("cuenta_bancaria_id") REFERENCES "cuentas_bancarias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_cuentas_por_pagar" ADD CONSTRAINT "pagos_cuentas_por_pagar_cuenta_por_pagar_id_fkey" FOREIGN KEY ("cuenta_por_pagar_id") REFERENCES "cuentas_por_pagar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_cuentas_por_pagar" ADD CONSTRAINT "pagos_cuentas_por_pagar_creado_por_fkey" FOREIGN KEY ("creado_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
