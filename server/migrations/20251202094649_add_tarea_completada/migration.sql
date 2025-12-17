-- AlterTable
ALTER TABLE "tareas" ADD COLUMN     "completada" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "tareas_completada_idx" ON "tareas"("completada");
