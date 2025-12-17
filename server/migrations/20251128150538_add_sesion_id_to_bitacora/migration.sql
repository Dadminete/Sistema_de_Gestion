/*
  Warnings:

  - You are about to drop the `detalles_factura` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `facturas` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `pagos` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "detalles_factura" DROP CONSTRAINT "detalles_factura_factura_id_fkey";

-- DropForeignKey
ALTER TABLE "facturas" DROP CONSTRAINT "facturas_suscripcion_id_fkey";

-- DropForeignKey
ALTER TABLE "facturas" DROP CONSTRAINT "facturas_usuario_id_fkey";

-- DropForeignKey
ALTER TABLE "pagos" DROP CONSTRAINT "pagos_factura_id_fkey";

-- DropForeignKey
ALTER TABLE "pagos" DROP CONSTRAINT "pagos_usuario_id_fkey";

-- AlterTable
ALTER TABLE "bitacora" ADD COLUMN     "metodo" VARCHAR(10),
ADD COLUMN     "ruta" VARCHAR(255),
ADD COLUMN     "sesion_id" UUID;

-- AlterTable
ALTER TABLE "tareas" ADD COLUMN     "descripcion" TEXT;

-- DropTable
DROP TABLE "detalles_factura";

-- DropTable
DROP TABLE "facturas";

-- DropTable
DROP TABLE "pagos";

-- CreateIndex
CREATE INDEX "bitacora_sesion_id_idx" ON "bitacora"("sesion_id");

-- CreateIndex
CREATE INDEX "bitacora_metodo_idx" ON "bitacora"("metodo");
