-- Create test data for suscripciones
-- First, check if we have clientes
SELECT COUNT(*) as total_clientes FROM cliente;

-- Check if we have servicios
SELECT COUNT(*) as total_servicios FROM servicio;

-- Check if we have planes
SELECT COUNT(*) as total_planes FROM plan;

-- Check current suscripciones
SELECT COUNT(*) as total_suscripciones FROM suscripcion;

-- If we have clientes, servicios, and planes, create some test suscripciones
-- First get some client IDs
SELECT id, nombre, apellidos FROM cliente LIMIT 5;

-- Get some service IDs  
SELECT id, nombre FROM servicio LIMIT 3;

-- Get some plan IDs
SELECT id, nombre FROM plan LIMIT 3;