-- Update CategoriaCliente enum to replace REGULAR with VIEJO

-- First, alter the column to remove the default constraint temporarily
ALTER TABLE "clientes" ALTER COLUMN "categoria_cliente" DROP DEFAULT;

-- Create a new enum type with the correct values
CREATE TYPE "CategoriaCliente_new" AS ENUM ('NUEVO', 'VIEJO', 'VIP', 'INACTIVO');

-- Update any existing REGULAR values to NUEVO (as a fallback)
UPDATE "clientes" SET "categoria_cliente" = 'NUEVO' WHERE "categoria_cliente" = 'REGULAR';

-- Alter the column to use the new type
ALTER TABLE "clientes" ALTER COLUMN "categoria_cliente" TYPE "CategoriaCliente_new" USING "categoria_cliente"::text::"CategoriaCliente_new";

-- Add the default back
ALTER TABLE "clientes" ALTER COLUMN "categoria_cliente" SET DEFAULT 'NUEVO'::"CategoriaCliente_new";

-- Drop the old enum
DROP TYPE "CategoriaCliente";

-- Rename the new enum to the old name
ALTER TYPE "CategoriaCliente_new" RENAME TO "CategoriaCliente";
