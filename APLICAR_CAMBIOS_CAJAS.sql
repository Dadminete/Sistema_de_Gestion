-- ============================================
-- SCRIPT PARA APLICAR CAMBIOS EN PRISMA DATA PLATFORM
-- ============================================
-- Este script agrega el campo "caja_id" a la tabla "movimientos_contables"
-- que faltaba en la migración inicial
-- ============================================

-- VERIFICAR SI LA COLUMNA YA EXISTE
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'movimientos_contables' 
        AND column_name = 'caja_id'
    ) THEN
        -- Agregar la columna caja_id
        ALTER TABLE "public"."movimientos_contables" 
        ADD COLUMN "caja_id" UUID;
        
        RAISE NOTICE 'Columna caja_id agregada exitosamente';
    ELSE
        RAISE NOTICE 'La columna caja_id ya existe';
    END IF;
END $$;

-- CREAR ÍNDICE SI NO EXISTE
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE schemaname = 'public'
        AND tablename = 'movimientos_contables'
        AND indexname = 'movimientos_contables_caja_id_idx'
    ) THEN
        CREATE INDEX "movimientos_contables_caja_id_idx" 
        ON "public"."movimientos_contables"("caja_id");
        
        RAISE NOTICE 'Índice caja_id creado exitosamente';
    ELSE
        RAISE NOTICE 'El índice caja_id ya existe';
    END IF;
END $$;

-- AGREGAR FOREIGN KEY SI NO EXISTE
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_schema = 'public'
        AND table_name = 'movimientos_contables'
        AND constraint_name = 'movimientos_contables_caja_id_fkey'
    ) THEN
        ALTER TABLE "public"."movimientos_contables" 
        ADD CONSTRAINT "movimientos_contables_caja_id_fkey" 
        FOREIGN KEY ("caja_id") 
        REFERENCES "public"."cajas"("id") 
        ON DELETE SET NULL 
        ON UPDATE CASCADE;
        
        RAISE NOTICE 'Foreign key caja_id agregada exitosamente';
    ELSE
        RAISE NOTICE 'La foreign key caja_id ya existe';
    END IF;
END $$;

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================

-- Mostrar la estructura de la tabla movimientos_contables
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'movimientos_contables'
ORDER BY ordinal_position;

-- Mostrar las foreign keys de la tabla
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name = 'movimientos_contables'
AND tc.table_schema = 'public';
