# Solución al Problema de Relaciones de Cajas

## Problema Identificado

### 1. Campo `caja_id` faltante en migración inicial
La tabla `movimientos_contables` tenía el campo `caja_id` definido en el schema de Prisma pero **NO estaba en la migración inicial**. Esto causaba una inconsistencia entre el schema y la base de datos.

**Estado anterior:**
- ✅ Schema Prisma: `cajaId String? @map("caja_id")`
- ❌ Migración SQL: Campo `caja_id` NO existía
- ✅ Base de datos: Campo ya existía (agregado manualmente)

### 2. Problema conceptual: Dos sistemas de cajas desconectados

Tienes **DOS lugares** donde se manejan cajas que NO están relacionados:

#### A. Tabla `cajas` (Sistema operativo)
```prisma
model Caja {
  id               String
  nombre           String
  tipo             String
  cuentaContableId String?  // Referencia OPCIONAL a cuenta contable
  responsableId    String?
  saldoInicial     Decimal
  saldoActual      Decimal
  
  // Relaciones operativas
  aperturas        AperturaCaja[]
  cierres          CierreCaja[]
  movimientos      MovimientoContable[]
  pagos            PagoCliente[]
  ventasPapeleria  VentaPapeleria[]
}
```

#### B. Tabla `cuentas_contables` (Sistema contable)
```prisma
model CuentaContable {
  id           String
  codigo       String
  nombre       String
  tipo_cuenta  String  // Puede ser "caja", "banco", etc.
  saldo_actual Decimal
  
  // Relaciones contables
  cajas        Caja[]  // Cajas que referencian esta cuenta
}
```

### 3. El Problema Real

Cuando creas una **cuenta contable** con `tipo_cuenta = 'caja'`:
- ✅ Se crea el registro en `cuentas_contables`
- ❌ NO se crea automáticamente en la tabla `cajas`
- ❌ NO puedes hacer aperturas/cierres de caja
- ❌ Los movimientos contables NO pueden referenciar esta "caja"

## Solución Implementada

### Paso 1: Sincronizar migración con schema ✅
Creé la migración `20251029135514_add_caja_id_to_movimientos_contables` que:
- Agrega la columna `caja_id` a `movimientos_contables`
- Crea el índice correspondiente
- Establece la foreign key con la tabla `cajas`

### Paso 2: Verificación ✅
- El campo `caja_id` ya existía en la base de datos
- Marqué la migración como aplicada
- Regeneré el cliente de Prisma

## Arquitectura Correcta Recomendada

### Opción 1: Caja Operativa con Referencia Contable (RECOMENDADA)

```typescript
// 1. Crear primero la cuenta contable
const cuentaContable = await prisma.cuentaContable.create({
  data: {
    codigo: "1101-001",
    nombre: "Caja Principal",
    tipo_cuenta: "caja",
    saldo_inicial: 0,
    saldo_actual: 0
  }
});

// 2. Crear la caja operativa vinculada
const caja = await prisma.caja.create({
  data: {
    nombre: "Caja Principal",
    tipo: "principal",
    cuentaContableId: cuentaContable.id,  // ← VINCULACIÓN
    responsableId: usuarioId,
    saldo_inicial: 0,
    saldo_actual: 0
  }
});

// 3. Ahora puedes hacer movimientos
const movimiento = await prisma.movimientoContable.create({
  data: {
    tipo: "ingreso",
    monto: 1000,
    categoriaId: categoriaId,
    metodo: "efectivo",
    cajaId: caja.id,  // ← AHORA FUNCIONA
    usuarioId: usuarioId,
    descripcion: "Venta de producto"
  }
});
```

### Opción 2: Trigger Automático (Avanzado)

Puedes crear un trigger en PostgreSQL que automáticamente cree una caja operativa cuando se crea una cuenta contable de tipo "caja":

```sql
CREATE OR REPLACE FUNCTION crear_caja_automatica()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tipo_cuenta = 'caja' THEN
    INSERT INTO cajas (id, nombre, tipo, cuenta_contable_id, saldo_inicial, saldo_actual, activa)
    VALUES (
      gen_random_uuid(),
      NEW.nombre,
      'general',
      NEW.id,
      NEW.saldo_inicial,
      NEW.saldo_actual,
      NEW.activa
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_crear_caja_automatica
AFTER INSERT ON cuentas_contables
FOR EACH ROW
EXECUTE FUNCTION crear_caja_automatica();
```

## Flujo de Trabajo Correcto

### Para Ingresos:

```typescript
// 1. Registrar el movimiento contable
const movimiento = await prisma.movimientoContable.create({
  data: {
    tipo: "ingreso",
    monto: 1500,
    categoriaId: categoriaIngresoId,
    metodo: "efectivo",
    cajaId: cajaId,  // ← IMPORTANTE: Especificar la caja
    usuarioId: usuarioId,
    descripcion: "Pago de cliente"
  }
});

// 2. Actualizar saldo de la caja
await prisma.caja.update({
  where: { id: cajaId },
  data: {
    saldo_actual: {
      increment: 1500
    }
  }
});

// 3. Actualizar saldo de la cuenta contable vinculada
const caja = await prisma.caja.findUnique({
  where: { id: cajaId },
  select: { cuentaContableId: true }
});

if (caja.cuentaContableId) {
  await prisma.cuentaContable.update({
    where: { id: caja.cuentaContableId },
    data: {
      saldo_actual: {
        increment: 1500
      }
    }
  });
}
```

### Para Consultas en DataTable:

```typescript
// Obtener movimientos de una caja específica
const movimientos = await prisma.movimientoContable.findMany({
  where: {
    cajaId: cajaId  // ← Ahora puedes filtrar por caja
  },
  include: {
    usuario: {
      select: {
        nombre: true,
        apellido: true
      }
    },
    categoria: true,
    caja: {
      select: {
        nombre: true
      }
    }
  },
  orderBy: {
    fecha: 'desc'
  }
});
```

## Verificación de la Solución

### 1. Verificar que el campo existe:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'movimientos_contables'
  AND column_name = 'caja_id';
```

### 2. Verificar relaciones:
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
WHERE m.caja_id IS NOT NULL
LIMIT 10;
```

### 3. Verificar cajas sin cuenta contable:
```sql
SELECT id, nombre, cuenta_contable_id
FROM cajas
WHERE cuenta_contable_id IS NULL;
```

## Próximos Pasos Recomendados

1. **Vincular cajas existentes con cuentas contables:**
   - Revisar cajas en la tabla `cajas` que no tienen `cuenta_contable_id`
   - Crear o vincular con cuentas contables correspondientes

2. **Actualizar código de aplicación:**
   - Asegurarse de que al crear movimientos se especifique `cajaId`
   - Implementar validación para requerir `cajaId` en ingresos/egresos de efectivo

3. **Crear script de sincronización:**
   - Script que sincronice saldos entre `cajas` y `cuentas_contables`
   - Ejecutar periódicamente o en cada transacción

4. **Documentar el proceso:**
   - Crear guía para el equipo sobre cómo crear cajas correctamente
   - Establecer convención de nombres entre cajas y cuentas contables

## Resumen

✅ **Problema resuelto:** El campo `caja_id` ahora está correctamente definido en `movimientos_contables`

⚠️ **Problema conceptual identificado:** Necesitas vincular las cajas operativas con las cuentas contables

📋 **Acción requerida:** Implementar la Opción 1 (vinculación manual) u Opción 2 (trigger automático) según tus necesidades

🔍 **Verificación:** Los movimientos contables ahora pueden referenciar correctamente la caja de origen
