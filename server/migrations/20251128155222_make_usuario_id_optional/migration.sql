-- DropForeignKey
ALTER TABLE "public"."suscripciones" DROP CONSTRAINT "suscripciones_usuario_id_fkey";

-- AlterTable
ALTER TABLE "suscripciones" ALTER COLUMN "usuario_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "suscripciones" ADD CONSTRAINT "suscripciones_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
