-- Script SQL para diagnosticar suscripciones con problemas
-- Ejecutar en la base de datos de Neon

-- 1. Suscripciones con planId que no existe en la tabla Plan
SELECT 
    s.id AS suscripcion_id,
    s."clienteId",
    c.nombre || ' ' || c.apellidos AS cliente_nombre,
    c."codigoCliente",
    s."planId",
    s."precioMensual",
    'Plan ID inválido' AS problema
FROM "Suscripcion" s
LEFT JOIN "Cliente" c ON s."clienteId" = c.id
LEFT JOIN "Plan" p ON s."planId" = p.id
WHERE s.estado = 'activo' 
  AND s."planId" IS NOT NULL 
  AND p.id IS NULL;

-- 2. Suscripciones con servicioId que no existe en la tabla Servicio
SELECT 
    s.id AS suscripcion_id,
    s."clienteId",
    c.nombre || ' ' || c.apellidos AS cliente_nombre,
    c."codigoCliente",
    s."servicioId",
    s."precioMensual",
    'Servicio ID inválido' AS problema
FROM "Suscripcion" s
LEFT JOIN "Cliente" c ON s."clienteId" = c.id
LEFT JOIN "Servicio" serv ON s."servicioId" = serv.id

Add context
Images
Mentions
Workflows

Conversation mode
Planning
Agent can plan before executing tasks. Use for deep research, complex tasks, or collaborative work
Fast
Agent will execute tasks directly. Use for simple tasks that can be completed faster

Gemini 3 Pro (High)
WHERE s.estado = 'activo' 
  AND s."servicioId" IS NOT NULL 
  AND serv.id IS NULL;

-- 3. Suscripciones sin plan ni servicio
SELECT 
    s.id AS suscripcion_id,
    s."clienteId",
    c.nombre || ' ' || c.apellidos AS cliente_nombre,
    c."codigoCliente",
    s."precioMensual",
    'Sin plan ni servicio' AS problema
FROM "Suscripcion" s
LEFT JOIN "Cliente" c ON s."clienteId" = c.id
WHERE s.estado = 'activo' 
  AND s."planId" IS NULL 
  AND s."servicioId" IS NULL;

-- 4. Resumen total
SELECT 
    COUNT(*) AS total_suscripciones_activas
FROM "Suscripcion"
WHERE estado = 'activo';

-- 5. Listar planes disponibles para asignar
SELECT 
    id,
    nombre,
    precio,
    estado
FROM "Plan"
WHERE estado = 'activo'
ORDER BY nombre;

-- 6. Listar servicios disponibles para asignar
SELECT 
    id,
    nombre,
    precio,
    estado
FROM "Servicio"
WHERE estado = 'activo'
ORDER BY nombre;
