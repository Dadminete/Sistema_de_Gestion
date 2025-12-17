# Instrucciones para Aplicar Cambios en Prisma Data Platform

## Opción 1: Aplicar Solo los Cambios Necesarios (RECOMENDADO)

Esta opción mantiene tus datos existentes y solo agrega el campo faltante.

### Pasos:

1. **Accede a Prisma Data Platform**
   - Ve a https://console.prisma.io
   - Selecciona tu proyecto
   - Ve a la sección "Database" o "Query Console"

2. **Ejecuta el Script de Cambios**
   - Abre el archivo `APLICAR_CAMBIOS_CAJAS.sql`
   - Copia todo el contenido
   - Pégalo en el Query Console de Prisma Data Platform
   - Ejecuta el script

3. **Verifica los Cambios**
   El script mostrará automáticamente:
   - La estructura actualizada de `movimientos_contables`
   - Las foreign keys configuradas
   - Mensajes de confirmación de cada cambio

4. **Actualiza el Cliente de Prisma Localmente**
   ```bash
   npx prisma generate
   ```

### ✅ Ventajas de esta Opción:
- No pierdes datos existentes
- Cambios mínimos y seguros
- Rápido de aplicar
- Reversible si es necesario

---

## Opción 2: Recrear la Base de Datos Desde Cero

⚠️ **ADVERTENCIA: Esta opción ELIMINA TODOS LOS DATOS EXISTENTES**

Solo usa esta opción si:
- Estás en desarrollo y no tienes datos importantes
- Quieres empezar con una base de datos limpia
- Tienes un respaldo de tus datos

### Pasos:

1. **Respalda tus Datos (IMPORTANTE)**
   ```sql
   -- Ejecuta esto ANTES de eliminar la base de datos
   -- Guarda el resultado en un archivo
   ```

2. **Ejecuta el Script de Recreación**
   - Opción A: Usa Prisma Migrate
     ```bash
     npx prisma migrate reset --force
     ```
   
   - Opción B: Ejecuta manualmente en Prisma Data Platform
     ```sql
     DROP SCHEMA IF EXISTS public CASCADE;
     CREATE SCHEMA public;
     GRANT ALL ON SCHEMA public TO postgres;
     GRANT ALL ON SCHEMA public TO public;
     ```

3. **Aplica las Migraciones**
   ```bash
   npx prisma migrate deploy
   ```

4. **Genera el Cliente**
   ```bash
   npx prisma generate
   ```

---

## Verificación de los Cambios

Después de aplicar cualquiera de las opciones, verifica que todo esté correcto:

### 1. Verificar que el campo `caja_id` existe:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'movimientos_contables'
  AND column_name = 'caja_id';
```

**Resultado esperado:**
```
column_name | data_type | is_nullable
------------|-----------|------------
caja_id     | uuid      | YES
```

### 2. Verificar las relaciones:

```sql
SELECT 
  m.id,
  m.tipo,
  m.monto,
  c.nombre as caja_nombre,
  u.nombre as usuario_nombre
FROM movimientos_contables m
LEFT JOIN cajas c ON m.caja_id = c.id
LEFT JOIN usuarios u ON m.usuario_id = u.id
LIMIT 5;
```

### 3. Verificar que puedes crear movimientos con caja:

```sql
-- Prueba de inserción (ajusta los IDs según tu base de datos)
INSERT INTO movimientos_contables (
  tipo, 
  monto, 
  categoria_id, 
  metodo, 
  caja_id,
  usuario_id,
  descripcion
) VALUES (
  'ingreso',
  1000.00,
  'UUID_DE_CATEGORIA',  -- Reemplaza con un UUID válido
  'efectivo',
  'UUID_DE_CAJA',       -- Reemplaza con un UUID válido
  'UUID_DE_USUARIO',    -- Reemplaza con un UUID válido
  'Prueba de movimiento con caja'
);
```

---

## Solución al Problema Conceptual de Cajas

Recuerda que tienes dos sistemas de cajas que deben estar vinculados:

### Sistema Actual:
```
cuentas_contables (tipo_cuenta = 'caja')  ❌ NO RELACIONADO
                    ↓
                  cajas (tabla operativa)
```

### Sistema Correcto:
```
cuentas_contables (tipo_cuenta = 'caja')
        ↓ (cuenta_contable_id)
      cajas (tabla operativa)
        ↓ (caja_id)
movimientos_contables
```

### Script para Vincular Cajas Existentes:

```sql
-- 1. Ver cajas sin cuenta contable vinculada
SELECT id, nombre, cuenta_contable_id
FROM cajas
WHERE cuenta_contable_id IS NULL;

-- 2. Ver cuentas contables tipo 'caja' sin caja operativa
SELECT cc.id, cc.nombre, cc.tipo_cuenta
FROM cuentas_contables cc
LEFT JOIN cajas c ON c.cuenta_contable_id = cc.id
WHERE cc.tipo_cuenta = 'caja'
AND c.id IS NULL;

-- 3. Vincular manualmente (ejemplo)
UPDATE cajas
SET cuenta_contable_id = 'UUID_DE_CUENTA_CONTABLE'
WHERE id = 'UUID_DE_CAJA';
```

---

## Próximos Pasos Después de Aplicar los Cambios

1. **Actualizar tu Código de Aplicación**
   - Asegúrate de incluir `cajaId` al crear movimientos contables
   - Implementa validación para requerir caja en movimientos de efectivo

2. **Crear Cajas Correctamente**
   ```typescript
   // 1. Crear cuenta contable
   const cuentaContable = await prisma.cuentaContable.create({
     data: {
       codigo: "1101-001",
       nombre: "Caja Principal",
       tipo_cuenta: "caja",
       saldo_inicial: 0,
       saldo_actual: 0
     }
   });

   // 2. Crear caja operativa vinculada
   const caja = await prisma.caja.create({
     data: {
       nombre: "Caja Principal",
       tipo: "principal",
       cuentaContableId: cuentaContable.id,
       responsableId: usuarioId,
       saldo_inicial: 0,
       saldo_actual: 0
     }
   });
   ```

3. **Actualizar Movimientos Existentes**
   ```sql
   -- Si tienes movimientos sin caja_id, asígnalos a una caja por defecto
   UPDATE movimientos_contables
   SET caja_id = 'UUID_DE_CAJA_POR_DEFECTO'
   WHERE caja_id IS NULL
   AND metodo = 'efectivo';
   ```

---

## Troubleshooting

### Error: "column caja_id already exists"
- El campo ya existe en tu base de datos
- Solo ejecuta la parte de verificación del script

### Error: "relation cajas does not exist"
- La tabla `cajas` no existe
- Necesitas ejecutar la migración completa primero

### Error: "foreign key constraint violation"
- Estás intentando insertar un `caja_id` que no existe
- Verifica que la caja exista antes de crear el movimiento

---

## Contacto y Soporte

Si tienes problemas al aplicar estos cambios:
1. Revisa los mensajes de error en el Query Console
2. Verifica que tienes permisos de administrador en la base de datos
3. Asegúrate de estar conectado a la base de datos correcta

**Archivos de Respaldo Creados:**
- `prisma/migrations_backup/` - Contiene las migraciones originales
- `SOLUCION_CAJAS.md` - Documentación completa del problema y solución
