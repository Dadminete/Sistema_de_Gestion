-- CreateEnum
CREATE TYPE "Sexo" AS ENUM ('MASCULINO', 'FEMENINO', 'OTRO');

-- CreateEnum
CREATE TYPE "CategoriaCliente" AS ENUM ('NUEVO', 'REGULAR', 'VIP', 'INACTIVO');

-- CreateTable
CREATE TABLE "roles" (
    "id" BIGSERIAL NOT NULL,
    "nombre_rol" VARCHAR(100) NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "es_sistema" BOOLEAN NOT NULL DEFAULT false,
    "prioridad" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permisos" (
    "id" BIGSERIAL NOT NULL,
    "nombre_permiso" VARCHAR(100) NOT NULL,
    "descripcion" TEXT,
    "categoria" VARCHAR(50) NOT NULL DEFAULT 'general',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "es_sistema" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "permisos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "username" VARCHAR(50) NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "apellido" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100),
    "telefono" VARCHAR(20),
    "cedula" VARCHAR(20),
    "direccion" TEXT,
    "fecha_nacimiento" DATE,
    "sexo" CHAR(1),
    "avatar" TEXT,
    "password_hash" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "es_empleado" BOOLEAN NOT NULL DEFAULT false,
    "es_cliente" BOOLEAN NOT NULL DEFAULT false,
    "notas" TEXT,
    "ultimo_acceso" TIMESTAMPTZ(6),
    "intentos_fallidos" INTEGER NOT NULL DEFAULT 0,
    "bloqueado_hasta" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios_roles" (
    "usuario_id" UUID NOT NULL,
    "rol_id" BIGINT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_asignacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_vencimiento" TIMESTAMPTZ(6),
    "asignado_por" UUID,

    CONSTRAINT "usuarios_roles_pkey" PRIMARY KEY ("usuario_id","rol_id")
);

-- CreateTable
CREATE TABLE "roles_permisos" (
    "rol_id" BIGINT NOT NULL,
    "permiso_id" BIGINT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_asignacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "asignado_por" UUID,

    CONSTRAINT "roles_permisos_pkey" PRIMARY KEY ("rol_id","permiso_id")
);

-- CreateTable
CREATE TABLE "usuarios_permisos" (
    "usuario_id" UUID NOT NULL,
    "permiso_id" BIGINT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_asignacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_vencimiento" TIMESTAMPTZ(6),
    "asignado_por" UUID,
    "motivo" TEXT,

    CONSTRAINT "usuarios_permisos_pkey" PRIMARY KEY ("usuario_id","permiso_id")
);

-- CreateTable
CREATE TABLE "bitacora" (
    "id" BIGSERIAL NOT NULL,
    "usuario_id" UUID,
    "accion" VARCHAR(100) NOT NULL,
    "tabla_afectada" VARCHAR(100),
    "registro_afectado_id" TEXT,
    "detalles_anteriores" JSONB,
    "detalles_nuevos" JSONB,
    "ip_address" INET,
    "user_agent" TEXT,
    "resultado" VARCHAR(20) NOT NULL DEFAULT 'exitoso',
    "mensaje_error" TEXT,
    "duracion_ms" INTEGER,
    "fecha_hora" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bitacora_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sesiones_usuario" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "usuario_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "ip_address" INET,
    "user_agent" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "fecha_inicio" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_ultimo_uso" TIMESTAMPTZ(6) NOT NULL,
    "fecha_expiracion" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sesiones_usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuraciones" (
    "id" BIGSERIAL NOT NULL,
    "clave" VARCHAR(100) NOT NULL,
    "valor" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" VARCHAR(20) NOT NULL DEFAULT 'string',
    "es_publica" BOOLEAN NOT NULL DEFAULT false,
    "categoria" VARCHAR(50) NOT NULL DEFAULT 'general',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "configuraciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "empresa" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nombre" VARCHAR(150) NOT NULL,
    "razon_social" VARCHAR(200),
    "rnc" VARCHAR(50),
    "telefono" VARCHAR(50),
    "email" VARCHAR(100),
    "direccion" TEXT,
    "ciudad" VARCHAR(50),
    "provincia" VARCHAR(50),
    "codigo_postal" VARCHAR(20),
    "logo_url" TEXT,
    "sitio_web" VARCHAR(100),
    "moneda_principal" VARCHAR(3) NOT NULL DEFAULT 'DOP',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "usuario_id" UUID,
    "codigo_cliente" VARCHAR(20) NOT NULL,
    "cedula" VARCHAR(20),
    "nombre" VARCHAR(100) NOT NULL,
    "apellidos" VARCHAR(100) NOT NULL,
    "telefono" VARCHAR(20),
    "telefono_secundario" VARCHAR(20),
    "email" VARCHAR(100),
    "direccion" TEXT,
    "sector_barrio" VARCHAR(100),
    "ciudad" VARCHAR(50),
    "provincia" VARCHAR(50),
    "codigo_postal" VARCHAR(10),
    "coordenadas_lat" DECIMAL(10,8),
    "coordenadas_lng" DECIMAL(11,8),
    "fecha_suscripcion" DATE,
    "sexo" "Sexo",
    "foto_url" TEXT,
    "contacto" VARCHAR(100),
    "contacto_emergencia" VARCHAR(100),
    "telefono_emergencia" VARCHAR(20),
    "referencia_direccion" TEXT,
    "tipo_cliente" VARCHAR(20) NOT NULL DEFAULT 'residencial',
    "categoria_cliente" "CategoriaCliente" NOT NULL DEFAULT 'NUEVO',
    "estado" VARCHAR(20) NOT NULL DEFAULT 'activo',
    "limite_crediticio" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "credito_disponible" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "dias_credito" INTEGER NOT NULL DEFAULT 0,
    "descuento_porcentaje" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "notas" TEXT,
    "referido_por" UUID,
    "fecha_ingreso" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" UUID NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "descripcion" TEXT,
    "icono" VARCHAR(100),
    "color" VARCHAR(50),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servicios" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nombre" VARCHAR(200) NOT NULL,
    "descripcion" TEXT,
    "descripcion_corta" TEXT,
    "categoria_id" UUID NOT NULL,
    "tipo" VARCHAR(50) NOT NULL,
    "es_recurrente" BOOLEAN NOT NULL DEFAULT false,
    "requiere_plan" BOOLEAN NOT NULL DEFAULT false,
    "precio_base" DECIMAL(10,2),
    "moneda" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "unidad_tiempo" VARCHAR(50),
    "imagen" TEXT,
    "caracteristicas" JSONB,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "destacado" BOOLEAN NOT NULL DEFAULT false,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "servicios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planes" (
    "id" BIGSERIAL NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "descripcion" TEXT,
    "categoria_id" UUID NOT NULL,
    "precio" DECIMAL(10,2) NOT NULL,
    "moneda" VARCHAR(3) NOT NULL DEFAULT 'DOP',
    "subida_kbps" INTEGER NOT NULL,
    "bajada_mbps" INTEGER NOT NULL,
    "detalles" JSONB,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "planes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suscripciones" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "cliente_id" UUID NOT NULL,
    "servicio_id" UUID,
    "plan_id" BIGINT,
    "usuario_id" UUID NOT NULL,
    "numero_contrato" VARCHAR(50) NOT NULL,
    "fecha_inicio" DATE NOT NULL,
    "fecha_vencimiento" DATE,
    "fecha_instalacion" DATE,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    "precio_mensual" DECIMAL(10,2) NOT NULL,
    "descuento_aplicado" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "fecha_proximo_pago" DATE,
    "dia_facturacion" INTEGER NOT NULL DEFAULT 1,
    "notas_instalacion" TEXT,
    "notas_servicio" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "suscripciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipos_cliente" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "cliente_id" UUID NOT NULL,
    "suscripcion_id" UUID,
    "tipo_equipo" VARCHAR(50) NOT NULL,
    "marca" VARCHAR(100) NOT NULL,
    "modelo" VARCHAR(100) NOT NULL,
    "numero_serie" VARCHAR(100) NOT NULL,
    "mac_address" VARCHAR(17),
    "ip_asignada" INET,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'instalado',
    "fecha_instalacion" DATE,
    "fecha_retiro" DATE,
    "ubicacion" TEXT,
    "notas" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "contrato_id" UUID,

    CONSTRAINT "equipos_cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facturas" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "numero_factura" VARCHAR(50) NOT NULL,
    "usuario_id" UUID NOT NULL,
    "suscripcion_id" UUID,
    "fecha_emision" DATE NOT NULL,
    "fecha_vencimiento" DATE NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "impuestos" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "descuentos" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,
    "moneda" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "estado" VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    "metodo_pago" VARCHAR(50),
    "notas" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "facturas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detalles_factura" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "factura_id" UUID NOT NULL,
    "concepto" VARCHAR(200) NOT NULL,
    "descripcion" TEXT,
    "cantidad" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "precio_unitario" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "impuesto" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "descuento" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "detalles_factura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "factura_id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "numero_recibo" VARCHAR(50) NOT NULL,
    "fecha_pago" TIMESTAMPTZ(6) NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "moneda" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "metodo_pago" VARCHAR(50) NOT NULL,
    "referencia_pago" VARCHAR(100),
    "estado" VARCHAR(20) NOT NULL DEFAULT 'procesado',
    "notas" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "pagos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "numero_ticket" VARCHAR(20) NOT NULL,
    "usuario_id" UUID NOT NULL,
    "suscripcion_id" UUID,
    "asunto" VARCHAR(200) NOT NULL,
    "descripcion" TEXT NOT NULL,
    "categoria" VARCHAR(50) NOT NULL,
    "prioridad" VARCHAR(20) NOT NULL DEFAULT 'media',
    "estado" VARCHAR(20) NOT NULL DEFAULT 'abierto',
    "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_cierre" TIMESTAMPTZ(6),
    "tiempo_respuesta" INTEGER,
    "satisfaccion" INTEGER,
    "notas" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "tecnico_asignado_id" BIGINT,
    "cliente_id" UUID,
    "contrato_id" UUID,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "respuestas_tickets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ticket_id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "mensaje" TEXT NOT NULL,
    "es_interno" BOOLEAN NOT NULL DEFAULT false,
    "fecha_respuesta" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "imagen_url" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "respuestas_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias_papeleria" (
    "id" BIGSERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" TEXT,
    "icono" VARCHAR(50),
    "color" VARCHAR(7),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "categorias_papeleria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productos_papeleria" (
    "id" BIGSERIAL NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,
    "descripcion" TEXT,
    "categoria_id" BIGINT NOT NULL,
    "marca" VARCHAR(100),
    "modelo" VARCHAR(100),
    "unidad_medida" VARCHAR(20) NOT NULL,
    "precio_compra" DECIMAL(10,2) NOT NULL,
    "precio_venta" DECIMAL(10,2) NOT NULL,
    "margen_ganancia" DECIMAL(5,2) NOT NULL,
    "stock_minimo" INTEGER NOT NULL DEFAULT 0,
    "stock_actual" INTEGER NOT NULL DEFAULT 0,
    "ubicacion" VARCHAR(100),
    "codigo_barras" VARCHAR(50),
    "imagen" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "proveedor_id" UUID,

    CONSTRAINT "productos_papeleria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos_inventario" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "producto_id" BIGINT NOT NULL,
    "usuario_id" UUID NOT NULL,
    "tipo_movimiento" VARCHAR(20) NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "cantidad_anterior" INTEGER NOT NULL,
    "cantidad_nueva" INTEGER NOT NULL,
    "motivo" VARCHAR(100) NOT NULL,
    "referencia" VARCHAR(100),
    "notas" TEXT,
    "fecha_movimiento" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_inventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ventas_papeleria" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "numero_venta" VARCHAR(50) NOT NULL,
    "usuario_id" UUID NOT NULL,
    "cliente_nombre" VARCHAR(200),
    "cliente_cedula" VARCHAR(20),
    "fecha_venta" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "impuestos" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "descuentos" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,
    "moneda" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "metodo_pago" VARCHAR(50) NOT NULL,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'completada',
    "notas" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "cliente_id" UUID,
    "cuenta_bancaria_id" UUID,
    "caja_id" UUID,

    CONSTRAINT "ventas_papeleria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detalles_venta_papeleria" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "venta_id" UUID NOT NULL,
    "producto_id" BIGINT NOT NULL,
    "nombre_producto" VARCHAR(200),
    "cantidad" INTEGER NOT NULL,
    "precio_unitario" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "impuesto" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "descuento" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "detalles_venta_papeleria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departamentos" (
    "id_departamento" BIGSERIAL NOT NULL,
    "nombre_departamento" VARCHAR(100) NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_modificacion" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "departamentos_pkey" PRIMARY KEY ("id_departamento")
);

-- CreateTable
CREATE TABLE "cargos" (
    "id_cargo" BIGSERIAL NOT NULL,
    "nombre_cargo" VARCHAR(100) NOT NULL,
    "descripcion" TEXT,
    "salario_minimo" DECIMAL(10,2),
    "salario_maximo" DECIMAL(10,2),
    "nivel_cargo" INTEGER,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cargos_pkey" PRIMARY KEY ("id_cargo")
);

-- CreateTable
CREATE TABLE "empleados" (
    "id_empleado" BIGSERIAL NOT NULL,
    "codigo_empleado" VARCHAR(20) NOT NULL,
    "cedula" VARCHAR(20) NOT NULL,
    "nombres" VARCHAR(100) NOT NULL,
    "apellidos" VARCHAR(100) NOT NULL,
    "fecha_nacimiento" DATE,
    "genero" CHAR(1),
    "estado_civil" VARCHAR(20),
    "telefono" VARCHAR(15),
    "celular" VARCHAR(15),
    "email" VARCHAR(100),
    "direccion" TEXT,
    "id_departamento" BIGINT,
    "id_cargo" BIGINT,
    "fecha_ingreso" DATE NOT NULL,
    "fecha_retiro" DATE,
    "tipo_contrato" VARCHAR(50),
    "salario_base" DECIMAL(10,2) NOT NULL,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
    "banco" VARCHAR(100),
    "numero_cuenta" VARCHAR(30),
    "tipo_cuenta" VARCHAR(20),
    "numero_dependientes" INTEGER NOT NULL DEFAULT 0,
    "exento_isr" BOOLEAN NOT NULL DEFAULT false,
    "usuario_id" UUID,
    "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_modificacion" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "empleados_pkey" PRIMARY KEY ("id_empleado")
);

-- CreateTable
CREATE TABLE "tipos_comision" (
    "id_tipo_comision" BIGSERIAL NOT NULL,
    "nombre_tipo" VARCHAR(100) NOT NULL,
    "descripcion" TEXT,
    "porcentaje_base" DECIMAL(5,2),
    "monto_fijo" DECIMAL(10,2),
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "tipos_comision_pkey" PRIMARY KEY ("id_tipo_comision")
);

-- CreateTable
CREATE TABLE "comisiones" (
    "id_comision" BIGSERIAL NOT NULL,
    "id_empleado" BIGINT NOT NULL,
    "id_tipo_comision" BIGINT NOT NULL,
    "periodo_año" INTEGER NOT NULL,
    "periodo_mes" INTEGER NOT NULL,
    "monto_base" DECIMAL(12,2) NOT NULL,
    "porcentaje_aplicado" DECIMAL(5,2) NOT NULL,
    "monto_comision" DECIMAL(10,2) NOT NULL,
    "descripcion" TEXT,
    "fecha_generacion" DATE NOT NULL DEFAULT CURRENT_DATE,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    "fecha_pago" DATE,
    "observaciones" TEXT,

    CONSTRAINT "comisiones_pkey" PRIMARY KEY ("id_comision")
);

-- CreateTable
CREATE TABLE "tipos_prestamo" (
    "id_tipo_prestamo" BIGSERIAL NOT NULL,
    "nombre_tipo" VARCHAR(100) NOT NULL,
    "descripcion" TEXT,
    "monto_maximo" DECIMAL(12,2),
    "plazo_maximo_meses" INTEGER,
    "tasa_interes" DECIMAL(5,2),
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "tipos_prestamo_pkey" PRIMARY KEY ("id_tipo_prestamo")
);

-- CreateTable
CREATE TABLE "prestamos" (
    "id_prestamo" BIGSERIAL NOT NULL,
    "id_empleado" BIGINT NOT NULL,
    "id_tipo_prestamo" BIGINT NOT NULL,
    "codigo_prestamo" VARCHAR(20) NOT NULL,
    "monto_solicitado" DECIMAL(12,2) NOT NULL,
    "monto_aprobado" DECIMAL(12,2) NOT NULL,
    "tasa_interes" DECIMAL(5,2),
    "plazo_meses" INTEGER NOT NULL,
    "cuota_mensual" DECIMAL(10,2) NOT NULL,
    "fecha_solicitud" DATE NOT NULL DEFAULT CURRENT_DATE,
    "fecha_aprobacion" DATE,
    "fecha_desembolso" DATE,
    "fecha_primer_pago" DATE,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'SOLICITADO',
    "saldo_pendiente" DECIMAL(12,2),
    "cuotas_pagadas" INTEGER NOT NULL DEFAULT 0,
    "motivo" TEXT,
    "garantia" TEXT,
    "observaciones" TEXT,
    "aprobado_por" BIGINT,
    "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prestamos_pkey" PRIMARY KEY ("id_prestamo")
);

-- CreateTable
CREATE TABLE "pagos_prestamos" (
    "id_pago_prestamo" BIGSERIAL NOT NULL,
    "id_prestamo" BIGINT NOT NULL,
    "numero_cuota" INTEGER NOT NULL,
    "fecha_programada" DATE NOT NULL,
    "fecha_pago" DATE,
    "monto_cota" DECIMAL(10,2) NOT NULL,
    "monto_capital" DECIMAL(10,2) NOT NULL,
    "monto_interes" DECIMAL(10,2) NOT NULL,
    "monto_pagado" DECIMAL(10,2),
    "saldo_restante" DECIMAL(12,2),
    "estado" VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    "observaciones" TEXT,

    CONSTRAINT "pagos_prestamos_pkey" PRIMARY KEY ("id_pago_prestamo")
);

-- CreateTable
CREATE TABLE "tipos_vacacion" (
    "id_tipo_vacacion" BIGSERIAL NOT NULL,
    "nombre_tipo" VARCHAR(100) NOT NULL,
    "descripcion" TEXT,
    "dias_por_año" DECIMAL(4,2),
    "acumulable" BOOLEAN NOT NULL DEFAULT true,
    "maximo_acumulable" INTEGER,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "tipos_vacacion_pkey" PRIMARY KEY ("id_tipo_vacacion")
);

-- CreateTable
CREATE TABLE "periodos_vacaciones" (
    "id_periodo_vacacion" BIGSERIAL NOT NULL,
    "id_empleado" BIGINT NOT NULL,
    "id_tipo_vacacion" BIGINT NOT NULL,
    "ano" INTEGER NOT NULL,
    "dias_ganados" DECIMAL(4,2) NOT NULL,
    "dias_tomados" DECIMAL(4,2) NOT NULL DEFAULT 0,
    "dias_pagados" DECIMAL(4,2) NOT NULL DEFAULT 0,
    "dias_disponibles" DECIMAL(4,2) NOT NULL,
    "fecha_corte" DATE,
    "observaciones" TEXT,

    CONSTRAINT "periodos_vacaciones_pkey" PRIMARY KEY ("id_periodo_vacacion")
);

-- CreateTable
CREATE TABLE "solicitudes_vacaciones" (
    "id_solicitud_vacacion" BIGSERIAL NOT NULL,
    "id_empleado" BIGINT NOT NULL,
    "id_tipo_vacacion" BIGINT NOT NULL,
    "fecha_inicio" DATE NOT NULL,
    "fecha_fin" DATE NOT NULL,
    "dias_solicitados" INTEGER NOT NULL,
    "motivo" TEXT,
    "fecha_solicitud" DATE NOT NULL DEFAULT CURRENT_DATE,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    "aprobado_por" BIGINT,
    "fecha_aprobacion" DATE,
    "observaciones_aprobacion" TEXT,
    "pago_adelantado" BOOLEAN NOT NULL DEFAULT false,
    "monto_pago" DECIMAL(10,2),

    CONSTRAINT "solicitudes_vacaciones_pkey" PRIMARY KEY ("id_solicitud_vacacion")
);

-- CreateTable
CREATE TABLE "periodos_nomina" (
    "id_periodo" BIGSERIAL NOT NULL,
    "codigo_periodo" VARCHAR(20) NOT NULL,
    "ano" INTEGER NOT NULL,
    "mes" INTEGER,
    "quincena" INTEGER,
    "fecha_inicio" DATE NOT NULL,
    "fecha_fin" DATE NOT NULL,
    "fecha_pago" DATE NOT NULL,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'ABIERTO',
    "tipo_periodo" VARCHAR(20) NOT NULL,
    "observaciones" TEXT,

    CONSTRAINT "periodos_nomina_pkey" PRIMARY KEY ("id_periodo")
);

-- CreateTable
CREATE TABLE "nomina" (
    "id_nomina" BIGSERIAL NOT NULL,
    "id_periodo" BIGINT NOT NULL,
    "id_empleado" BIGINT NOT NULL,
    "dias_trabajados" INTEGER NOT NULL,
    "horas_trabajadas" DECIMAL(6,2),
    "salario_base" DECIMAL(10,2) NOT NULL,
    "horas_extras_ordinarias" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "horas_extras_nocturnas" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "horas_extras_feriados" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "bonificaciones" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "comisiones" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "viaticos" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "subsidios" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "retroactivos" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "vacaciones_pagadas" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "otros_ingresos" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "seguridad_social" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "seguro_salud" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "isr" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "prestamos" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "adelantos" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "faltas" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "tardanzas" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "otras_deducciones" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_ingresos" DECIMAL(12,2) NOT NULL,
    "total_deducciones" DECIMAL(12,2) NOT NULL,
    "salario_neto" DECIMAL(12,2) NOT NULL,
    "forma_pago" VARCHAR(20),
    "numero_transaccion" VARCHAR(50),
    "fecha_pago" DATE,
    "estado_pago" VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    "fecha_calculo" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "calculado_por" BIGINT,
    "observaciones" TEXT,

    CONSTRAINT "nomina_pkey" PRIMARY KEY ("id_nomina")
);

-- CreateTable
CREATE TABLE "nomina_prestamos" (
    "id_nomina_prestamo" BIGSERIAL NOT NULL,
    "id_nomina" BIGINT NOT NULL,
    "id_prestamo" BIGINT NOT NULL,
    "id_pago_prestamo" BIGINT NOT NULL,
    "monto_deducido" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "nomina_prestamos_pkey" PRIMARY KEY ("id_nomina_prestamo")
);

-- CreateTable
CREATE TABLE "nomina_comisiones" (
    "id_nomina_comision" BIGSERIAL NOT NULL,
    "id_nomina" BIGINT NOT NULL,
    "id_comision" BIGINT NOT NULL,
    "monto_pagado" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "nomina_comisiones_pkey" PRIMARY KEY ("id_nomina_comision")
);

-- CreateTable
CREATE TABLE "historial_salarios" (
    "id_historial" BIGSERIAL NOT NULL,
    "id_empleado" BIGINT NOT NULL,
    "salario_anterior" DECIMAL(10,2),
    "salario_nuevo" DECIMAL(10,2) NOT NULL,
    "motivo" VARCHAR(200),
    "fecha_efectiva" DATE NOT NULL,
    "aprobado_por" BIGINT,
    "fecha_registro" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historial_salarios_pkey" PRIMARY KEY ("id_historial")
);

-- CreateTable
CREATE TABLE "banks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nombre" VARCHAR(100) NOT NULL,
    "codigo" VARCHAR(10),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "banks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias_cuentas" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "codigo" VARCHAR(10) NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "tipo" VARCHAR(20) NOT NULL,
    "subtipo" VARCHAR(50),
    "padre_id" UUID,
    "nivel" INTEGER NOT NULL DEFAULT 1,
    "es_detalle" BOOLEAN NOT NULL DEFAULT true,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categorias_cuentas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cuentas_contables" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "codigo" VARCHAR(20) NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "categoria_id" UUID,
    "tipo_cuenta" VARCHAR(30) NOT NULL,
    "moneda" VARCHAR(3) NOT NULL DEFAULT 'DOP',
    "saldo_inicial" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "saldo_actual" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "cuentas_contables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cuentas_bancarias" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "bank_id" UUID NOT NULL,
    "numero_cuenta" VARCHAR(50) NOT NULL,
    "tipo_cuenta" VARCHAR(50),
    "moneda" VARCHAR(3) NOT NULL DEFAULT 'DOP',
    "nombre_oficial_cuenta" VARCHAR(150),
    "cuenta_contable_id" UUID NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "observaciones" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "cuentas_bancarias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cajas" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" TEXT,
    "tipo" VARCHAR(20) NOT NULL,
    "cuenta_contable_id" UUID,
    "responsable_id" UUID,
    "saldo_inicial" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "saldo_actual" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "limite_maximo" DECIMAL(12,2),
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "cajas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chats" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "titulo" VARCHAR(100),
    "tipo" VARCHAR(20) NOT NULL,
    "cliente_id" UUID,
    "ticket_id" UUID,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'activo',
    "creado_por" UUID NOT NULL,
    "ultimo_mensaje" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "chats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_participantes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "chat_id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "rol" VARCHAR(20) NOT NULL DEFAULT 'participante',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_participantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mensajes_chat" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "chat_id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "mensaje" TEXT NOT NULL,
    "tipo" VARCHAR(20) NOT NULL DEFAULT 'texto',
    "archivo_id" UUID,
    "leido" BOOLEAN NOT NULL DEFAULT false,
    "editado" BOOLEAN NOT NULL DEFAULT false,
    "fecha_edicion" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mensajes_chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "archivos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nombre_original" VARCHAR(255) NOT NULL,
    "nombre_archivo" VARCHAR(255) NOT NULL,
    "ruta_archivo" VARCHAR(500) NOT NULL,
    "tipo_mime" VARCHAR(100) NOT NULL,
    "tamaño" BIGINT NOT NULL,
    "categoria" VARCHAR(50),
    "descripcion" TEXT,
    "es_publico" BOOLEAN NOT NULL DEFAULT false,
    "subido_por" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cliente_id" UUID,

    CONSTRAINT "archivos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eventos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "titulo" VARCHAR(255) NOT NULL,
    "descripcion" TEXT,
    "fecha_inicio" TIMESTAMPTZ(6) NOT NULL,
    "fecha_fin" TIMESTAMPTZ(6),
    "todo_el_dia" BOOLEAN NOT NULL DEFAULT false,
    "color" VARCHAR(7),
    "ubicacion" TEXT,
    "creado_por_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "eventos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos_contables" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tipo" VARCHAR(20) NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "categoria_id" UUID NOT NULL,
    "metodo" VARCHAR(20) NOT NULL,
    "caja_id" UUID,
    "bank_id" UUID,
    "cuenta_bancaria_id" UUID,
    "descripcion" TEXT,
    "fecha" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "movimientos_contables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proveedores" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "codigo" VARCHAR(20) NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "razon_social" VARCHAR(200),
    "rnc" VARCHAR(20),
    "telefono" VARCHAR(20),
    "email" VARCHAR(100),
    "direccion" TEXT,
    "contacto" VARCHAR(100),
    "telefono_contacto" VARCHAR(20),
    "email_contacto" VARCHAR(100),
    "tipo_proveedor" VARCHAR(30) NOT NULL DEFAULT 'papeleria',
    "condiciones_pago" TEXT,
    "dias_credito" INTEGER,
    "limite_credito" DECIMAL(12,2),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "observaciones" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "proveedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compras_papeleria" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "numero_compra" VARCHAR(30) NOT NULL,
    "proveedor_id" UUID NOT NULL,
    "fecha_compra" DATE NOT NULL,
    "numero_factura" VARCHAR(50),
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "descuento" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "itbis" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    "forma_pago" VARCHAR(20),
    "observaciones" TEXT,
    "recibida_por" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "compras_papeleria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detalle_compras_papeleria" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "compra_id" UUID NOT NULL,
    "producto_id" BIGINT NOT NULL,
    "cantidad" DECIMAL(10,3) NOT NULL,
    "costo_unitario" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "descuento" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "impuesto" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL,
    "fecha_vencimiento" DATE,
    "lote" VARCHAR(50),
    "orden" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "detalle_compras_papeleria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes_papeleria" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nombre" VARCHAR(100) NOT NULL,
    "apellido" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100),
    "telefono" VARCHAR(20),
    "cedula" VARCHAR(20),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "clientes_papeleria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contratos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "numero_contrato" VARCHAR(30) NOT NULL,
    "cliente_id" UUID NOT NULL,
    "servicio_id" UUID NOT NULL,
    "fecha_inicio" DATE NOT NULL,
    "fecha_fin" DATE,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'activo',
    "precio_mensual" DECIMAL(10,2) NOT NULL,
    "direccion_instalacion" TEXT,
    "observaciones" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "contratos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facturas_clientes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "numero_factura" VARCHAR(30) NOT NULL,
    "cliente_id" UUID NOT NULL,
    "contrato_id" UUID,
    "tipo_factura" VARCHAR(20) NOT NULL DEFAULT 'servicio',
    "fecha_factura" DATE NOT NULL,
    "fecha_vencimiento" DATE,
    "periodo_facturado_inicio" DATE,
    "periodo_facturado_fin" DATE,
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "descuento" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "itbis" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    "forma_pago" VARCHAR(20),
    "observaciones" TEXT,
    "facturada_por" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "facturas_clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detalle_facturas" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "factura_id" UUID NOT NULL,
    "concepto" VARCHAR(200) NOT NULL,
    "cantidad" DECIMAL(10,3) NOT NULL DEFAULT 1,
    "precio_unitario" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "descuento" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "impuesto" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL,
    "servicio_id" UUID,
    "producto_id" BIGINT,
    "orden" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "detalle_facturas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos_clientes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "factura_id" UUID,
    "cliente_id" UUID NOT NULL,
    "numero_pago" VARCHAR(30) NOT NULL,
    "fecha_pago" DATE NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "moneda" VARCHAR(3) NOT NULL DEFAULT 'DOP',
    "metodo_pago" VARCHAR(30) NOT NULL,
    "numero_referencia" VARCHAR(50),
    "cuenta_bancaria_id" UUID,
    "caja_id" UUID,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'confirmado',
    "observaciones" TEXT,
    "recibido_por" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "pagos_clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cuentas_por_cobrar" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "factura_id" UUID,
    "cliente_id" UUID NOT NULL,
    "numero_documento" VARCHAR(30) NOT NULL,
    "fecha_emision" DATE NOT NULL,
    "fecha_vencimiento" DATE NOT NULL,
    "monto_original" DECIMAL(12,2) NOT NULL,
    "monto_pendiente" DECIMAL(12,2) NOT NULL,
    "moneda" VARCHAR(3) NOT NULL DEFAULT 'DOP',
    "estado" VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    "dias_vencido" INTEGER NOT NULL DEFAULT 0,
    "observaciones" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "cuentas_por_cobrar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cuentas_por_pagar" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "proveedor_id" UUID,
    "numero_documento" VARCHAR(30) NOT NULL,
    "tipo_documento" VARCHAR(20) NOT NULL,
    "fecha_emision" DATE NOT NULL,
    "fecha_vencimiento" DATE NOT NULL,
    "concepto" VARCHAR(200) NOT NULL,
    "monto_original" DECIMAL(12,2) NOT NULL,
    "monto_pendiente" DECIMAL(12,2) NOT NULL,
    "moneda" VARCHAR(3) NOT NULL DEFAULT 'DOP',
    "estado" VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    "dias_vencido" INTEGER NOT NULL DEFAULT 0,
    "observaciones" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "cuentas_por_pagar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos_fijos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" TEXT,
    "monto" DECIMAL(12,2) NOT NULL,
    "moneda" VARCHAR(3) NOT NULL DEFAULT 'DOP',
    "dia_vencimiento" INTEGER NOT NULL,
    "cuenta_contable_id" UUID,
    "proveedor_id" UUID,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "proximo_vencimiento" DATE,
    "observaciones" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "pagos_fijos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos_pagos_fijos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "pago_fijo_id" UUID NOT NULL,
    "fecha_pago" DATE NOT NULL,
    "monto_pagado" DECIMAL(12,2) NOT NULL,
    "metodo_pago" VARCHAR(30) NOT NULL,
    "numero_referencia" VARCHAR(50),
    "observaciones" TEXT,
    "pagado_por" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pagos_pagos_fijos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "traspasos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "numero_traspaso" VARCHAR(30) NOT NULL,
    "fecha_traspaso" DATE NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "moneda" VARCHAR(3) NOT NULL DEFAULT 'DOP',
    "concepto_traspaso" TEXT NOT NULL,
    "banco_origen_id" UUID,
    "banco_destino_id" UUID,
    "caja_origen_id" UUID,
    "caja_destino_id" UUID,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'completado',
    "observaciones" TEXT,
    "autorizado_por" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "traspasos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asientos_contables" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "numero_asiento" VARCHAR(20) NOT NULL,
    "fecha_asiento" DATE NOT NULL,
    "descripcion" TEXT NOT NULL,
    "tipo" VARCHAR(20),
    "referencia" VARCHAR(50),
    "total_debe" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_haber" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'borrador',
    "creado_por" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asientos_contables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detalle_asientos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "asiento_id" UUID NOT NULL,
    "cuenta_id" UUID,
    "caja_id" UUID,
    "descripcion" TEXT,
    "debe" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "haber" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "orden" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "detalle_asientos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tareas" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "creadoPorId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tareas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aperturas_caja" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "caja_id" UUID NOT NULL,
    "monto_inicial" DECIMAL(12,2) NOT NULL,
    "fecha_apertura" TIMESTAMPTZ(6) NOT NULL,
    "usuario_id" UUID NOT NULL,
    "observaciones" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aperturas_caja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cierres_caja" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "caja_id" UUID NOT NULL,
    "monto_final" DECIMAL(12,2) NOT NULL,
    "ingresos_del_dia" DECIMAL(12,2) NOT NULL,
    "gastos_del_dia" DECIMAL(12,2) NOT NULL,
    "fecha_cierre" TIMESTAMPTZ(6) NOT NULL,
    "usuario_id" UUID NOT NULL,
    "observaciones" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cierres_caja_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_nombre_rol_key" ON "roles"("nombre_rol");

-- CreateIndex
CREATE UNIQUE INDEX "permisos_nombre_permiso_key" ON "permisos"("nombre_permiso");

-- CreateIndex
CREATE INDEX "permisos_categoria_idx" ON "permisos"("categoria");

-- CreateIndex
CREATE INDEX "permisos_activo_idx" ON "permisos"("activo");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_username_key" ON "usuarios"("username");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_cedula_key" ON "usuarios"("cedula");

-- CreateIndex
CREATE INDEX "usuarios_ultimo_acceso_idx" ON "usuarios"("ultimo_acceso");

-- CreateIndex
CREATE INDEX "usuarios_roles_usuario_id_idx" ON "usuarios_roles"("usuario_id");

-- CreateIndex
CREATE INDEX "usuarios_roles_rol_id_idx" ON "usuarios_roles"("rol_id");

-- CreateIndex
CREATE INDEX "usuarios_roles_fecha_asignacion_idx" ON "usuarios_roles"("fecha_asignacion");

-- CreateIndex
CREATE INDEX "roles_permisos_rol_id_idx" ON "roles_permisos"("rol_id");

-- CreateIndex
CREATE INDEX "roles_permisos_permiso_id_idx" ON "roles_permisos"("permiso_id");

-- CreateIndex
CREATE INDEX "roles_permisos_fecha_asignacion_idx" ON "roles_permisos"("fecha_asignacion");

-- CreateIndex
CREATE INDEX "usuarios_permisos_usuario_id_idx" ON "usuarios_permisos"("usuario_id");

-- CreateIndex
CREATE INDEX "usuarios_permisos_permiso_id_idx" ON "usuarios_permisos"("permiso_id");

-- CreateIndex
CREATE INDEX "usuarios_permisos_fecha_asignacion_idx" ON "usuarios_permisos"("fecha_asignacion");

-- CreateIndex
CREATE INDEX "usuarios_permisos_fecha_vencimiento_idx" ON "usuarios_permisos"("fecha_vencimiento");

-- CreateIndex
CREATE INDEX "bitacora_usuario_id_idx" ON "bitacora"("usuario_id");

-- CreateIndex
CREATE INDEX "bitacora_fecha_hora_idx" ON "bitacora"("fecha_hora");

-- CreateIndex
CREATE INDEX "bitacora_accion_idx" ON "bitacora"("accion");

-- CreateIndex
CREATE INDEX "bitacora_tabla_afectada_idx" ON "bitacora"("tabla_afectada");

-- CreateIndex
CREATE INDEX "sesiones_usuario_usuario_id_idx" ON "sesiones_usuario"("usuario_id");

-- CreateIndex
CREATE INDEX "sesiones_usuario_activa_idx" ON "sesiones_usuario"("activa");

-- CreateIndex
CREATE INDEX "sesiones_usuario_fecha_expiracion_idx" ON "sesiones_usuario"("fecha_expiracion");

-- CreateIndex
CREATE INDEX "sesiones_usuario_fecha_inicio_idx" ON "sesiones_usuario"("fecha_inicio");

-- CreateIndex
CREATE UNIQUE INDEX "configuraciones_clave_key" ON "configuraciones"("clave");

-- CreateIndex
CREATE INDEX "configuraciones_categoria_idx" ON "configuraciones"("categoria");

-- CreateIndex
CREATE INDEX "configuraciones_es_publica_idx" ON "configuraciones"("es_publica");

-- CreateIndex
CREATE UNIQUE INDEX "empresa_rnc_key" ON "empresa"("rnc");

-- CreateIndex
CREATE INDEX "empresa_ciudad_idx" ON "empresa"("ciudad");

-- CreateIndex
CREATE INDEX "empresa_provincia_idx" ON "empresa"("provincia");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_usuario_id_key" ON "clientes"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_codigo_cliente_key" ON "clientes"("codigo_cliente");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_cedula_key" ON "clientes"("cedula");

-- CreateIndex
CREATE INDEX "clientes_usuario_id_idx" ON "clientes"("usuario_id");

-- CreateIndex
CREATE INDEX "clientes_tipo_cliente_idx" ON "clientes"("tipo_cliente");

-- CreateIndex
CREATE INDEX "clientes_estado_idx" ON "clientes"("estado");

-- CreateIndex
CREATE INDEX "clientes_referido_por_idx" ON "clientes"("referido_por");

-- CreateIndex
CREATE INDEX "clientes_fecha_ingreso_idx" ON "clientes"("fecha_ingreso");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_nombre_key" ON "categorias"("nombre");

-- CreateIndex
CREATE INDEX "categorias_activo_idx" ON "categorias"("activo");

-- CreateIndex
CREATE INDEX "servicios_categoria_id_idx" ON "servicios"("categoria_id");

-- CreateIndex
CREATE INDEX "servicios_tipo_idx" ON "servicios"("tipo");

-- CreateIndex
CREATE INDEX "servicios_activo_idx" ON "servicios"("activo");

-- CreateIndex
CREATE INDEX "servicios_destacado_idx" ON "servicios"("destacado");

-- CreateIndex
CREATE INDEX "planes_categoria_id_idx" ON "planes"("categoria_id");

-- CreateIndex
CREATE INDEX "planes_activo_idx" ON "planes"("activo");

-- CreateIndex
CREATE UNIQUE INDEX "suscripciones_numero_contrato_key" ON "suscripciones"("numero_contrato");

-- CreateIndex
CREATE INDEX "suscripciones_cliente_id_idx" ON "suscripciones"("cliente_id");

-- CreateIndex
CREATE INDEX "suscripciones_servicio_id_idx" ON "suscripciones"("servicio_id");

-- CreateIndex
CREATE INDEX "suscripciones_usuario_id_idx" ON "suscripciones"("usuario_id");

-- CreateIndex
CREATE INDEX "suscripciones_estado_idx" ON "suscripciones"("estado");

-- CreateIndex
CREATE INDEX "suscripciones_fecha_proximo_pago_idx" ON "suscripciones"("fecha_proximo_pago");

-- CreateIndex
CREATE INDEX "suscripciones_fecha_inicio_idx" ON "suscripciones"("fecha_inicio");

-- CreateIndex
CREATE UNIQUE INDEX "equipos_cliente_numero_serie_key" ON "equipos_cliente"("numero_serie");

-- CreateIndex
CREATE UNIQUE INDEX "equipos_cliente_mac_address_key" ON "equipos_cliente"("mac_address");

-- CreateIndex
CREATE INDEX "equipos_cliente_cliente_id_idx" ON "equipos_cliente"("cliente_id");

-- CreateIndex
CREATE INDEX "equipos_cliente_suscripcion_id_idx" ON "equipos_cliente"("suscripcion_id");

-- CreateIndex
CREATE INDEX "equipos_cliente_estado_idx" ON "equipos_cliente"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "facturas_numero_factura_key" ON "facturas"("numero_factura");

-- CreateIndex
CREATE INDEX "facturas_usuario_id_idx" ON "facturas"("usuario_id");

-- CreateIndex
CREATE INDEX "facturas_suscripcion_id_idx" ON "facturas"("suscripcion_id");

-- CreateIndex
CREATE INDEX "facturas_estado_idx" ON "facturas"("estado");

-- CreateIndex
CREATE INDEX "facturas_fecha_emision_idx" ON "facturas"("fecha_emision");

-- CreateIndex
CREATE INDEX "detalles_factura_factura_id_idx" ON "detalles_factura"("factura_id");

-- CreateIndex
CREATE UNIQUE INDEX "pagos_numero_recibo_key" ON "pagos"("numero_recibo");

-- CreateIndex
CREATE INDEX "pagos_factura_id_idx" ON "pagos"("factura_id");

-- CreateIndex
CREATE INDEX "pagos_usuario_id_idx" ON "pagos"("usuario_id");

-- CreateIndex
CREATE INDEX "pagos_fecha_pago_idx" ON "pagos"("fecha_pago");

-- CreateIndex
CREATE INDEX "pagos_estado_idx" ON "pagos"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_numero_ticket_key" ON "tickets"("numero_ticket");

-- CreateIndex
CREATE INDEX "tickets_usuario_id_idx" ON "tickets"("usuario_id");

-- CreateIndex
CREATE INDEX "tickets_suscripcion_id_idx" ON "tickets"("suscripcion_id");

-- CreateIndex
CREATE INDEX "tickets_prioridad_idx" ON "tickets"("prioridad");

-- CreateIndex
CREATE INDEX "tickets_estado_idx" ON "tickets"("estado");

-- CreateIndex
CREATE INDEX "tickets_tecnico_asignado_id_idx" ON "tickets"("tecnico_asignado_id");

-- CreateIndex
CREATE INDEX "tickets_cliente_id_idx" ON "tickets"("cliente_id");

-- CreateIndex
CREATE INDEX "tickets_contrato_id_idx" ON "tickets"("contrato_id");

-- CreateIndex
CREATE INDEX "respuestas_tickets_ticket_id_idx" ON "respuestas_tickets"("ticket_id");

-- CreateIndex
CREATE INDEX "respuestas_tickets_usuario_id_idx" ON "respuestas_tickets"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_papeleria_nombre_key" ON "categorias_papeleria"("nombre");

-- CreateIndex
CREATE INDEX "categorias_papeleria_activo_idx" ON "categorias_papeleria"("activo");

-- CreateIndex
CREATE UNIQUE INDEX "productos_papeleria_codigo_key" ON "productos_papeleria"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "productos_papeleria_codigo_barras_key" ON "productos_papeleria"("codigo_barras");

-- CreateIndex
CREATE INDEX "productos_papeleria_categoria_id_idx" ON "productos_papeleria"("categoria_id");

-- CreateIndex
CREATE INDEX "productos_papeleria_proveedor_id_idx" ON "productos_papeleria"("proveedor_id");

-- CreateIndex
CREATE INDEX "productos_papeleria_activo_idx" ON "productos_papeleria"("activo");

-- CreateIndex
CREATE INDEX "movimientos_inventario_producto_id_idx" ON "movimientos_inventario"("producto_id");

-- CreateIndex
CREATE INDEX "movimientos_inventario_usuario_id_idx" ON "movimientos_inventario"("usuario_id");

-- CreateIndex
CREATE INDEX "movimientos_inventario_fecha_movimiento_idx" ON "movimientos_inventario"("fecha_movimiento");

-- CreateIndex
CREATE INDEX "movimientos_inventario_tipo_movimiento_idx" ON "movimientos_inventario"("tipo_movimiento");

-- CreateIndex
CREATE UNIQUE INDEX "ventas_papeleria_numero_venta_key" ON "ventas_papeleria"("numero_venta");

-- CreateIndex
CREATE INDEX "ventas_papeleria_usuario_id_idx" ON "ventas_papeleria"("usuario_id");

-- CreateIndex
CREATE INDEX "ventas_papeleria_cliente_id_idx" ON "ventas_papeleria"("cliente_id");

-- CreateIndex
CREATE INDEX "ventas_papeleria_fecha_venta_idx" ON "ventas_papeleria"("fecha_venta");

-- CreateIndex
CREATE INDEX "ventas_papeleria_estado_idx" ON "ventas_papeleria"("estado");

-- CreateIndex
CREATE INDEX "ventas_papeleria_cuenta_bancaria_id_idx" ON "ventas_papeleria"("cuenta_bancaria_id");

-- CreateIndex
CREATE INDEX "ventas_papeleria_caja_id_idx" ON "ventas_papeleria"("caja_id");

-- CreateIndex
CREATE INDEX "detalles_venta_papeleria_venta_id_idx" ON "detalles_venta_papeleria"("venta_id");

-- CreateIndex
CREATE INDEX "detalles_venta_papeleria_producto_id_idx" ON "detalles_venta_papeleria"("producto_id");

-- CreateIndex
CREATE UNIQUE INDEX "empleados_codigo_empleado_key" ON "empleados"("codigo_empleado");

-- CreateIndex
CREATE UNIQUE INDEX "empleados_cedula_key" ON "empleados"("cedula");

-- CreateIndex
CREATE UNIQUE INDEX "empleados_usuario_id_key" ON "empleados"("usuario_id");

-- CreateIndex
CREATE INDEX "empleados_id_departamento_idx" ON "empleados"("id_departamento");

-- CreateIndex
CREATE INDEX "empleados_id_cargo_idx" ON "empleados"("id_cargo");

-- CreateIndex
CREATE INDEX "empleados_estado_idx" ON "empleados"("estado");

-- CreateIndex
CREATE INDEX "comisiones_id_empleado_idx" ON "comisiones"("id_empleado");

-- CreateIndex
CREATE INDEX "comisiones_id_tipo_comision_idx" ON "comisiones"("id_tipo_comision");

-- CreateIndex
CREATE INDEX "comisiones_periodo_año_periodo_mes_idx" ON "comisiones"("periodo_año", "periodo_mes");

-- CreateIndex
CREATE UNIQUE INDEX "prestamos_codigo_prestamo_key" ON "prestamos"("codigo_prestamo");

-- CreateIndex
CREATE INDEX "prestamos_id_empleado_idx" ON "prestamos"("id_empleado");

-- CreateIndex
CREATE INDEX "prestamos_id_tipo_prestamo_idx" ON "prestamos"("id_tipo_prestamo");

-- CreateIndex
CREATE INDEX "prestamos_estado_idx" ON "prestamos"("estado");

-- CreateIndex
CREATE INDEX "prestamos_aprobado_por_idx" ON "prestamos"("aprobado_por");

-- CreateIndex
CREATE INDEX "pagos_prestamos_id_prestamo_idx" ON "pagos_prestamos"("id_prestamo");

-- CreateIndex
CREATE INDEX "pagos_prestamos_numero_cuota_idx" ON "pagos_prestamos"("numero_cuota");

-- CreateIndex
CREATE INDEX "pagos_prestamos_fecha_programada_idx" ON "pagos_prestamos"("fecha_programada");

-- CreateIndex
CREATE INDEX "pagos_prestamos_fecha_pago_idx" ON "pagos_prestamos"("fecha_pago");

-- CreateIndex
CREATE INDEX "periodos_vacaciones_id_empleado_idx" ON "periodos_vacaciones"("id_empleado");

-- CreateIndex
CREATE INDEX "periodos_vacaciones_id_tipo_vacacion_idx" ON "periodos_vacaciones"("id_tipo_vacacion");

-- CreateIndex
CREATE INDEX "periodos_vacaciones_ano_idx" ON "periodos_vacaciones"("ano");

-- CreateIndex
CREATE UNIQUE INDEX "periodos_vacaciones_id_empleado_ano_id_tipo_vacacion_key" ON "periodos_vacaciones"("id_empleado", "ano", "id_tipo_vacacion");

-- CreateIndex
CREATE INDEX "solicitudes_vacaciones_id_empleado_idx" ON "solicitudes_vacaciones"("id_empleado");

-- CreateIndex
CREATE INDEX "solicitudes_vacaciones_id_tipo_vacacion_idx" ON "solicitudes_vacaciones"("id_tipo_vacacion");

-- CreateIndex
CREATE INDEX "solicitudes_vacaciones_estado_idx" ON "solicitudes_vacaciones"("estado");

-- CreateIndex
CREATE INDEX "solicitudes_vacaciones_aprobado_por_idx" ON "solicitudes_vacaciones"("aprobado_por");

-- CreateIndex
CREATE INDEX "solicitudes_vacaciones_fecha_inicio_idx" ON "solicitudes_vacaciones"("fecha_inicio");

-- CreateIndex
CREATE UNIQUE INDEX "periodos_nomina_codigo_periodo_key" ON "periodos_nomina"("codigo_periodo");

-- CreateIndex
CREATE INDEX "periodos_nomina_ano_mes_idx" ON "periodos_nomina"("ano", "mes");

-- CreateIndex
CREATE INDEX "periodos_nomina_fecha_pago_idx" ON "periodos_nomina"("fecha_pago");

-- CreateIndex
CREATE INDEX "nomina_id_periodo_idx" ON "nomina"("id_periodo");

-- CreateIndex
CREATE INDEX "nomina_id_empleado_idx" ON "nomina"("id_empleado");

-- CreateIndex
CREATE INDEX "nomina_estado_pago_idx" ON "nomina"("estado_pago");

-- CreateIndex
CREATE INDEX "nomina_fecha_pago_idx" ON "nomina"("fecha_pago");

-- CreateIndex
CREATE UNIQUE INDEX "nomina_id_periodo_id_empleado_key" ON "nomina"("id_periodo", "id_empleado");

-- CreateIndex
CREATE INDEX "nomina_prestamos_id_nomina_idx" ON "nomina_prestamos"("id_nomina");

-- CreateIndex
CREATE INDEX "nomina_prestamos_id_prestamo_idx" ON "nomina_prestamos"("id_prestamo");

-- CreateIndex
CREATE INDEX "nomina_prestamos_id_pago_prestamo_idx" ON "nomina_prestamos"("id_pago_prestamo");

-- CreateIndex
CREATE INDEX "nomina_comisiones_id_nomina_idx" ON "nomina_comisiones"("id_nomina");

-- CreateIndex
CREATE INDEX "nomina_comisiones_id_comision_idx" ON "nomina_comisiones"("id_comision");

-- CreateIndex
CREATE INDEX "historial_salarios_id_empleado_idx" ON "historial_salarios"("id_empleado");

-- CreateIndex
CREATE INDEX "historial_salarios_aprobado_por_idx" ON "historial_salarios"("aprobado_por");

-- CreateIndex
CREATE INDEX "historial_salarios_fecha_efectiva_idx" ON "historial_salarios"("fecha_efectiva");

-- CreateIndex
CREATE UNIQUE INDEX "banks_codigo_key" ON "banks"("codigo");

-- CreateIndex
CREATE INDEX "banks_activo_idx" ON "banks"("activo");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_cuentas_codigo_key" ON "categorias_cuentas"("codigo");

-- CreateIndex
CREATE INDEX "categorias_cuentas_padre_id_idx" ON "categorias_cuentas"("padre_id");

-- CreateIndex
CREATE INDEX "categorias_cuentas_tipo_idx" ON "categorias_cuentas"("tipo");

-- CreateIndex
CREATE UNIQUE INDEX "cuentas_contables_codigo_key" ON "cuentas_contables"("codigo");

-- CreateIndex
CREATE INDEX "cuentas_contables_categoria_id_idx" ON "cuentas_contables"("categoria_id");

-- CreateIndex
CREATE INDEX "cuentas_contables_activa_idx" ON "cuentas_contables"("activa");

-- CreateIndex
CREATE UNIQUE INDEX "cuentas_bancarias_numero_cuenta_key" ON "cuentas_bancarias"("numero_cuenta");

-- CreateIndex
CREATE INDEX "cuentas_bancarias_bank_id_idx" ON "cuentas_bancarias"("bank_id");

-- CreateIndex
CREATE INDEX "cuentas_bancarias_cuenta_contable_id_idx" ON "cuentas_bancarias"("cuenta_contable_id");

-- CreateIndex
CREATE INDEX "cuentas_bancarias_activo_idx" ON "cuentas_bancarias"("activo");

-- CreateIndex
CREATE INDEX "cajas_cuenta_contable_id_idx" ON "cajas"("cuenta_contable_id");

-- CreateIndex
CREATE INDEX "cajas_responsable_id_idx" ON "cajas"("responsable_id");

-- CreateIndex
CREATE INDEX "cajas_activa_idx" ON "cajas"("activa");

-- CreateIndex
CREATE INDEX "chats_cliente_id_idx" ON "chats"("cliente_id");

-- CreateIndex
CREATE INDEX "chats_ticket_id_idx" ON "chats"("ticket_id");

-- CreateIndex
CREATE INDEX "chats_tipo_idx" ON "chats"("tipo");

-- CreateIndex
CREATE INDEX "chats_creado_por_idx" ON "chats"("creado_por");

-- CreateIndex
CREATE INDEX "chats_estado_idx" ON "chats"("estado");

-- CreateIndex
CREATE INDEX "chat_participantes_chat_id_idx" ON "chat_participantes"("chat_id");

-- CreateIndex
CREATE INDEX "chat_participantes_usuario_id_idx" ON "chat_participantes"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "chat_participantes_chat_id_usuario_id_key" ON "chat_participantes"("chat_id", "usuario_id");

-- CreateIndex
CREATE INDEX "mensajes_chat_chat_id_idx" ON "mensajes_chat"("chat_id");

-- CreateIndex
CREATE INDEX "mensajes_chat_usuario_id_idx" ON "mensajes_chat"("usuario_id");

-- CreateIndex
CREATE INDEX "mensajes_chat_archivo_id_idx" ON "mensajes_chat"("archivo_id");

-- CreateIndex
CREATE INDEX "archivos_subido_por_idx" ON "archivos"("subido_por");

-- CreateIndex
CREATE INDEX "archivos_cliente_id_idx" ON "archivos"("cliente_id");

-- CreateIndex
CREATE INDEX "archivos_categoria_idx" ON "archivos"("categoria");

-- CreateIndex
CREATE INDEX "eventos_creado_por_id_idx" ON "eventos"("creado_por_id");

-- CreateIndex
CREATE INDEX "eventos_fecha_inicio_idx" ON "eventos"("fecha_inicio");

-- CreateIndex
CREATE INDEX "eventos_todo_el_dia_idx" ON "eventos"("todo_el_dia");

-- CreateIndex
CREATE INDEX "movimientos_contables_categoria_id_idx" ON "movimientos_contables"("categoria_id");

-- CreateIndex
CREATE INDEX "movimientos_contables_usuario_id_idx" ON "movimientos_contables"("usuario_id");

-- CreateIndex
CREATE INDEX "movimientos_contables_caja_id_idx" ON "movimientos_contables"("caja_id");

-- CreateIndex
CREATE INDEX "movimientos_contables_bank_id_idx" ON "movimientos_contables"("bank_id");

-- CreateIndex
CREATE INDEX "movimientos_contables_cuenta_bancaria_id_idx" ON "movimientos_contables"("cuenta_bancaria_id");

-- CreateIndex
CREATE INDEX "movimientos_contables_metodo_idx" ON "movimientos_contables"("metodo");

-- CreateIndex
CREATE INDEX "movimientos_contables_fecha_idx" ON "movimientos_contables"("fecha");

-- CreateIndex
CREATE INDEX "movimientos_contables_tipo_idx" ON "movimientos_contables"("tipo");

-- CreateIndex
CREATE UNIQUE INDEX "proveedores_codigo_key" ON "proveedores"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "proveedores_rnc_key" ON "proveedores"("rnc");

-- CreateIndex
CREATE INDEX "proveedores_activo_idx" ON "proveedores"("activo");

-- CreateIndex
CREATE UNIQUE INDEX "compras_papeleria_numero_compra_key" ON "compras_papeleria"("numero_compra");

-- CreateIndex
CREATE INDEX "compras_papeleria_proveedor_id_idx" ON "compras_papeleria"("proveedor_id");

-- CreateIndex
CREATE INDEX "compras_papeleria_estado_idx" ON "compras_papeleria"("estado");

-- CreateIndex
CREATE INDEX "compras_papeleria_fecha_compra_idx" ON "compras_papeleria"("fecha_compra");

-- CreateIndex
CREATE INDEX "compras_papeleria_recibida_por_idx" ON "compras_papeleria"("recibida_por");

-- CreateIndex
CREATE INDEX "detalle_compras_papeleria_compra_id_idx" ON "detalle_compras_papeleria"("compra_id");

-- CreateIndex
CREATE INDEX "detalle_compras_papeleria_producto_id_idx" ON "detalle_compras_papeleria"("producto_id");

-- CreateIndex
CREATE INDEX "clientes_papeleria_activo_idx" ON "clientes_papeleria"("activo");

-- CreateIndex
CREATE UNIQUE INDEX "contratos_numero_contrato_key" ON "contratos"("numero_contrato");

-- CreateIndex
CREATE INDEX "contratos_cliente_id_idx" ON "contratos"("cliente_id");

-- CreateIndex
CREATE INDEX "contratos_servicio_id_idx" ON "contratos"("servicio_id");

-- CreateIndex
CREATE INDEX "contratos_estado_idx" ON "contratos"("estado");

-- CreateIndex
CREATE INDEX "contratos_fecha_inicio_idx" ON "contratos"("fecha_inicio");

-- CreateIndex
CREATE UNIQUE INDEX "facturas_clientes_numero_factura_key" ON "facturas_clientes"("numero_factura");

-- CreateIndex
CREATE INDEX "facturas_clientes_cliente_id_idx" ON "facturas_clientes"("cliente_id");

-- CreateIndex
CREATE INDEX "facturas_clientes_contrato_id_idx" ON "facturas_clientes"("contrato_id");

-- CreateIndex
CREATE INDEX "facturas_clientes_estado_idx" ON "facturas_clientes"("estado");

-- CreateIndex
CREATE INDEX "facturas_clientes_fecha_factura_idx" ON "facturas_clientes"("fecha_factura");

-- CreateIndex
CREATE INDEX "facturas_clientes_facturada_por_idx" ON "facturas_clientes"("facturada_por");

-- CreateIndex
CREATE INDEX "detalle_facturas_factura_id_idx" ON "detalle_facturas"("factura_id");

-- CreateIndex
CREATE INDEX "detalle_facturas_servicio_id_idx" ON "detalle_facturas"("servicio_id");

-- CreateIndex
CREATE INDEX "detalle_facturas_producto_id_idx" ON "detalle_facturas"("producto_id");

-- CreateIndex
CREATE UNIQUE INDEX "pagos_clientes_numero_pago_key" ON "pagos_clientes"("numero_pago");

-- CreateIndex
CREATE INDEX "pagos_clientes_cliente_id_idx" ON "pagos_clientes"("cliente_id");

-- CreateIndex
CREATE INDEX "pagos_clientes_factura_id_idx" ON "pagos_clientes"("factura_id");

-- CreateIndex
CREATE INDEX "pagos_clientes_cuenta_bancaria_id_idx" ON "pagos_clientes"("cuenta_bancaria_id");

-- CreateIndex
CREATE INDEX "pagos_clientes_caja_id_idx" ON "pagos_clientes"("caja_id");

-- CreateIndex
CREATE INDEX "pagos_clientes_estado_idx" ON "pagos_clientes"("estado");

-- CreateIndex
CREATE INDEX "pagos_clientes_fecha_pago_idx" ON "pagos_clientes"("fecha_pago");

-- CreateIndex
CREATE INDEX "pagos_clientes_recibido_por_idx" ON "pagos_clientes"("recibido_por");

-- CreateIndex
CREATE UNIQUE INDEX "cuentas_por_cobrar_numero_documento_key" ON "cuentas_por_cobrar"("numero_documento");

-- CreateIndex
CREATE INDEX "cuentas_por_cobrar_cliente_id_idx" ON "cuentas_por_cobrar"("cliente_id");

-- CreateIndex
CREATE INDEX "cuentas_por_cobrar_factura_id_idx" ON "cuentas_por_cobrar"("factura_id");

-- CreateIndex
CREATE INDEX "cuentas_por_cobrar_estado_idx" ON "cuentas_por_cobrar"("estado");

-- CreateIndex
CREATE INDEX "cuentas_por_cobrar_fecha_vencimiento_idx" ON "cuentas_por_cobrar"("fecha_vencimiento");

-- CreateIndex
CREATE UNIQUE INDEX "cuentas_por_pagar_numero_documento_key" ON "cuentas_por_pagar"("numero_documento");

-- CreateIndex
CREATE INDEX "cuentas_por_pagar_proveedor_id_idx" ON "cuentas_por_pagar"("proveedor_id");

-- CreateIndex
CREATE INDEX "cuentas_por_pagar_estado_idx" ON "cuentas_por_pagar"("estado");

-- CreateIndex
CREATE INDEX "cuentas_por_pagar_fecha_vencimiento_idx" ON "cuentas_por_pagar"("fecha_vencimiento");

-- CreateIndex
CREATE INDEX "pagos_fijos_cuenta_contable_id_idx" ON "pagos_fijos"("cuenta_contable_id");

-- CreateIndex
CREATE INDEX "pagos_fijos_proveedor_id_idx" ON "pagos_fijos"("proveedor_id");

-- CreateIndex
CREATE INDEX "pagos_fijos_activo_idx" ON "pagos_fijos"("activo");

-- CreateIndex
CREATE INDEX "pagos_pagos_fijos_pago_fijo_id_idx" ON "pagos_pagos_fijos"("pago_fijo_id");

-- CreateIndex
CREATE INDEX "pagos_pagos_fijos_pagado_por_idx" ON "pagos_pagos_fijos"("pagado_por");

-- CreateIndex
CREATE INDEX "pagos_pagos_fijos_fecha_pago_idx" ON "pagos_pagos_fijos"("fecha_pago");

-- CreateIndex
CREATE UNIQUE INDEX "traspasos_numero_traspaso_key" ON "traspasos"("numero_traspaso");

-- CreateIndex
CREATE INDEX "traspasos_banco_origen_id_idx" ON "traspasos"("banco_origen_id");

-- CreateIndex
CREATE INDEX "traspasos_banco_destino_id_idx" ON "traspasos"("banco_destino_id");

-- CreateIndex
CREATE INDEX "traspasos_caja_origen_id_idx" ON "traspasos"("caja_origen_id");

-- CreateIndex
CREATE INDEX "traspasos_caja_destino_id_idx" ON "traspasos"("caja_destino_id");

-- CreateIndex
CREATE INDEX "traspasos_autorizado_por_idx" ON "traspasos"("autorizado_por");

-- CreateIndex
CREATE INDEX "traspasos_fecha_traspaso_idx" ON "traspasos"("fecha_traspaso");

-- CreateIndex
CREATE UNIQUE INDEX "asientos_contables_numero_asiento_key" ON "asientos_contables"("numero_asiento");

-- CreateIndex
CREATE INDEX "asientos_contables_fecha_asiento_idx" ON "asientos_contables"("fecha_asiento");

-- CreateIndex
CREATE INDEX "asientos_contables_estado_idx" ON "asientos_contables"("estado");

-- CreateIndex
CREATE INDEX "asientos_contables_creado_por_idx" ON "asientos_contables"("creado_por");

-- CreateIndex
CREATE INDEX "detalle_asientos_asiento_id_idx" ON "detalle_asientos"("asiento_id");

-- CreateIndex
CREATE INDEX "detalle_asientos_cuenta_id_idx" ON "detalle_asientos"("cuenta_id");

-- CreateIndex
CREATE INDEX "detalle_asientos_caja_id_idx" ON "detalle_asientos"("caja_id");

-- CreateIndex
CREATE INDEX "tareas_creadoPorId_idx" ON "tareas"("creadoPorId");

-- CreateIndex
CREATE INDEX "aperturas_caja_caja_id_idx" ON "aperturas_caja"("caja_id");

-- CreateIndex
CREATE INDEX "aperturas_caja_usuario_id_idx" ON "aperturas_caja"("usuario_id");

-- CreateIndex
CREATE INDEX "aperturas_caja_fecha_apertura_idx" ON "aperturas_caja"("fecha_apertura");

-- CreateIndex
CREATE INDEX "cierres_caja_caja_id_idx" ON "cierres_caja"("caja_id");

-- CreateIndex
CREATE INDEX "cierres_caja_usuario_id_idx" ON "cierres_caja"("usuario_id");

-- CreateIndex
CREATE INDEX "cierres_caja_fecha_cierre_idx" ON "cierres_caja"("fecha_cierre");

-- AddForeignKey
ALTER TABLE "usuarios_roles" ADD CONSTRAINT "usuarios_roles_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios_roles" ADD CONSTRAINT "usuarios_roles_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios_roles" ADD CONSTRAINT "usuarios_roles_asignado_por_fkey" FOREIGN KEY ("asignado_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles_permisos" ADD CONSTRAINT "roles_permisos_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles_permisos" ADD CONSTRAINT "roles_permisos_permiso_id_fkey" FOREIGN KEY ("permiso_id") REFERENCES "permisos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles_permisos" ADD CONSTRAINT "roles_permisos_asignado_por_fkey" FOREIGN KEY ("asignado_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios_permisos" ADD CONSTRAINT "usuarios_permisos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios_permisos" ADD CONSTRAINT "usuarios_permisos_permiso_id_fkey" FOREIGN KEY ("permiso_id") REFERENCES "permisos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios_permisos" ADD CONSTRAINT "usuarios_permisos_asignado_por_fkey" FOREIGN KEY ("asignado_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bitacora" ADD CONSTRAINT "bitacora_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesiones_usuario" ADD CONSTRAINT "sesiones_usuario_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_referido_por_fkey" FOREIGN KEY ("referido_por") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servicios" ADD CONSTRAINT "servicios_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planes" ADD CONSTRAINT "planes_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suscripciones" ADD CONSTRAINT "suscripciones_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suscripciones" ADD CONSTRAINT "suscripciones_servicio_id_fkey" FOREIGN KEY ("servicio_id") REFERENCES "servicios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suscripciones" ADD CONSTRAINT "suscripciones_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "planes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suscripciones" ADD CONSTRAINT "suscripciones_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipos_cliente" ADD CONSTRAINT "equipos_cliente_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipos_cliente" ADD CONSTRAINT "equipos_cliente_suscripcion_id_fkey" FOREIGN KEY ("suscripcion_id") REFERENCES "suscripciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipos_cliente" ADD CONSTRAINT "equipos_cliente_contrato_id_fkey" FOREIGN KEY ("contrato_id") REFERENCES "contratos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_suscripcion_id_fkey" FOREIGN KEY ("suscripcion_id") REFERENCES "suscripciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_factura" ADD CONSTRAINT "detalles_factura_factura_id_fkey" FOREIGN KEY ("factura_id") REFERENCES "facturas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_factura_id_fkey" FOREIGN KEY ("factura_id") REFERENCES "facturas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_suscripcion_id_fkey" FOREIGN KEY ("suscripcion_id") REFERENCES "suscripciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_tecnico_asignado_id_fkey" FOREIGN KEY ("tecnico_asignado_id") REFERENCES "empleados"("id_empleado") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_contrato_id_fkey" FOREIGN KEY ("contrato_id") REFERENCES "contratos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "respuestas_tickets" ADD CONSTRAINT "respuestas_tickets_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "respuestas_tickets" ADD CONSTRAINT "respuestas_tickets_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos_papeleria" ADD CONSTRAINT "productos_papeleria_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias_papeleria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos_papeleria" ADD CONSTRAINT "productos_papeleria_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos_papeleria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas_papeleria" ADD CONSTRAINT "ventas_papeleria_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas_papeleria" ADD CONSTRAINT "ventas_papeleria_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas_papeleria" ADD CONSTRAINT "ventas_papeleria_cuenta_bancaria_id_fkey" FOREIGN KEY ("cuenta_bancaria_id") REFERENCES "cuentas_bancarias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas_papeleria" ADD CONSTRAINT "ventas_papeleria_caja_id_fkey" FOREIGN KEY ("caja_id") REFERENCES "cajas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_venta_papeleria" ADD CONSTRAINT "detalles_venta_papeleria_venta_id_fkey" FOREIGN KEY ("venta_id") REFERENCES "ventas_papeleria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_venta_papeleria" ADD CONSTRAINT "detalles_venta_papeleria_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos_papeleria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empleados" ADD CONSTRAINT "empleados_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empleados" ADD CONSTRAINT "empleados_id_departamento_fkey" FOREIGN KEY ("id_departamento") REFERENCES "departamentos"("id_departamento") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empleados" ADD CONSTRAINT "empleados_id_cargo_fkey" FOREIGN KEY ("id_cargo") REFERENCES "cargos"("id_cargo") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comisiones" ADD CONSTRAINT "comisiones_id_empleado_fkey" FOREIGN KEY ("id_empleado") REFERENCES "empleados"("id_empleado") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comisiones" ADD CONSTRAINT "comisiones_id_tipo_comision_fkey" FOREIGN KEY ("id_tipo_comision") REFERENCES "tipos_comision"("id_tipo_comision") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prestamos" ADD CONSTRAINT "prestamos_id_empleado_fkey" FOREIGN KEY ("id_empleado") REFERENCES "empleados"("id_empleado") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prestamos" ADD CONSTRAINT "prestamos_id_tipo_prestamo_fkey" FOREIGN KEY ("id_tipo_prestamo") REFERENCES "tipos_prestamo"("id_tipo_prestamo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prestamos" ADD CONSTRAINT "prestamos_aprobado_por_fkey" FOREIGN KEY ("aprobado_por") REFERENCES "empleados"("id_empleado") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_prestamos" ADD CONSTRAINT "pagos_prestamos_id_prestamo_fkey" FOREIGN KEY ("id_prestamo") REFERENCES "prestamos"("id_prestamo") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "periodos_vacaciones" ADD CONSTRAINT "periodos_vacaciones_id_empleado_fkey" FOREIGN KEY ("id_empleado") REFERENCES "empleados"("id_empleado") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "periodos_vacaciones" ADD CONSTRAINT "periodos_vacaciones_id_tipo_vacacion_fkey" FOREIGN KEY ("id_tipo_vacacion") REFERENCES "tipos_vacacion"("id_tipo_vacacion") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes_vacaciones" ADD CONSTRAINT "solicitudes_vacaciones_id_empleado_fkey" FOREIGN KEY ("id_empleado") REFERENCES "empleados"("id_empleado") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes_vacaciones" ADD CONSTRAINT "solicitudes_vacaciones_id_tipo_vacacion_fkey" FOREIGN KEY ("id_tipo_vacacion") REFERENCES "tipos_vacacion"("id_tipo_vacacion") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes_vacaciones" ADD CONSTRAINT "solicitudes_vacaciones_aprobado_por_fkey" FOREIGN KEY ("aprobado_por") REFERENCES "empleados"("id_empleado") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nomina" ADD CONSTRAINT "nomina_id_periodo_fkey" FOREIGN KEY ("id_periodo") REFERENCES "periodos_nomina"("id_periodo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nomina" ADD CONSTRAINT "nomina_id_empleado_fkey" FOREIGN KEY ("id_empleado") REFERENCES "empleados"("id_empleado") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nomina" ADD CONSTRAINT "nomina_calculado_por_fkey" FOREIGN KEY ("calculado_por") REFERENCES "empleados"("id_empleado") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nomina_prestamos" ADD CONSTRAINT "nomina_prestamos_id_nomina_fkey" FOREIGN KEY ("id_nomina") REFERENCES "nomina"("id_nomina") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nomina_prestamos" ADD CONSTRAINT "nomina_prestamos_id_prestamo_fkey" FOREIGN KEY ("id_prestamo") REFERENCES "prestamos"("id_prestamo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nomina_prestamos" ADD CONSTRAINT "nomina_prestamos_id_pago_prestamo_fkey" FOREIGN KEY ("id_pago_prestamo") REFERENCES "pagos_prestamos"("id_pago_prestamo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nomina_comisiones" ADD CONSTRAINT "nomina_comisiones_id_nomina_fkey" FOREIGN KEY ("id_nomina") REFERENCES "nomina"("id_nomina") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nomina_comisiones" ADD CONSTRAINT "nomina_comisiones_id_comision_fkey" FOREIGN KEY ("id_comision") REFERENCES "comisiones"("id_comision") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_salarios" ADD CONSTRAINT "historial_salarios_id_empleado_fkey" FOREIGN KEY ("id_empleado") REFERENCES "empleados"("id_empleado") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_salarios" ADD CONSTRAINT "historial_salarios_aprobado_por_fkey" FOREIGN KEY ("aprobado_por") REFERENCES "empleados"("id_empleado") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categorias_cuentas" ADD CONSTRAINT "categorias_cuentas_padre_id_fkey" FOREIGN KEY ("padre_id") REFERENCES "categorias_cuentas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuentas_contables" ADD CONSTRAINT "cuentas_contables_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias_cuentas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuentas_bancarias" ADD CONSTRAINT "cuentas_bancarias_bank_id_fkey" FOREIGN KEY ("bank_id") REFERENCES "banks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuentas_bancarias" ADD CONSTRAINT "cuentas_bancarias_cuenta_contable_id_fkey" FOREIGN KEY ("cuenta_contable_id") REFERENCES "cuentas_contables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cajas" ADD CONSTRAINT "cajas_cuenta_contable_id_fkey" FOREIGN KEY ("cuenta_contable_id") REFERENCES "cuentas_contables"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cajas" ADD CONSTRAINT "cajas_responsable_id_fkey" FOREIGN KEY ("responsable_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chats" ADD CONSTRAINT "chats_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chats" ADD CONSTRAINT "chats_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chats" ADD CONSTRAINT "chats_creado_por_fkey" FOREIGN KEY ("creado_por") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_participantes" ADD CONSTRAINT "chat_participantes_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_participantes" ADD CONSTRAINT "chat_participantes_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensajes_chat" ADD CONSTRAINT "mensajes_chat_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensajes_chat" ADD CONSTRAINT "mensajes_chat_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensajes_chat" ADD CONSTRAINT "mensajes_chat_archivo_id_fkey" FOREIGN KEY ("archivo_id") REFERENCES "archivos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "archivos" ADD CONSTRAINT "archivos_subido_por_fkey" FOREIGN KEY ("subido_por") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "archivos" ADD CONSTRAINT "archivos_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos" ADD CONSTRAINT "eventos_creado_por_id_fkey" FOREIGN KEY ("creado_por_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_contables" ADD CONSTRAINT "movimientos_contables_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias_cuentas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_contables" ADD CONSTRAINT "movimientos_contables_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_contables" ADD CONSTRAINT "movimientos_contables_caja_id_fkey" FOREIGN KEY ("caja_id") REFERENCES "cajas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_contables" ADD CONSTRAINT "movimientos_contables_bank_id_fkey" FOREIGN KEY ("bank_id") REFERENCES "banks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_contables" ADD CONSTRAINT "movimientos_contables_cuenta_bancaria_id_fkey" FOREIGN KEY ("cuenta_bancaria_id") REFERENCES "cuentas_bancarias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compras_papeleria" ADD CONSTRAINT "compras_papeleria_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compras_papeleria" ADD CONSTRAINT "compras_papeleria_recibida_por_fkey" FOREIGN KEY ("recibida_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_compras_papeleria" ADD CONSTRAINT "detalle_compras_papeleria_compra_id_fkey" FOREIGN KEY ("compra_id") REFERENCES "compras_papeleria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_compras_papeleria" ADD CONSTRAINT "detalle_compras_papeleria_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos_papeleria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_servicio_id_fkey" FOREIGN KEY ("servicio_id") REFERENCES "servicios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas_clientes" ADD CONSTRAINT "facturas_clientes_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas_clientes" ADD CONSTRAINT "facturas_clientes_contrato_id_fkey" FOREIGN KEY ("contrato_id") REFERENCES "contratos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas_clientes" ADD CONSTRAINT "facturas_clientes_facturada_por_fkey" FOREIGN KEY ("facturada_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_facturas" ADD CONSTRAINT "detalle_facturas_factura_id_fkey" FOREIGN KEY ("factura_id") REFERENCES "facturas_clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_facturas" ADD CONSTRAINT "detalle_facturas_servicio_id_fkey" FOREIGN KEY ("servicio_id") REFERENCES "servicios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_facturas" ADD CONSTRAINT "detalle_facturas_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos_papeleria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_clientes" ADD CONSTRAINT "pagos_clientes_factura_id_fkey" FOREIGN KEY ("factura_id") REFERENCES "facturas_clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_clientes" ADD CONSTRAINT "pagos_clientes_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_clientes" ADD CONSTRAINT "pagos_clientes_cuenta_bancaria_id_fkey" FOREIGN KEY ("cuenta_bancaria_id") REFERENCES "cuentas_bancarias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_clientes" ADD CONSTRAINT "pagos_clientes_caja_id_fkey" FOREIGN KEY ("caja_id") REFERENCES "cajas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_clientes" ADD CONSTRAINT "pagos_clientes_recibido_por_fkey" FOREIGN KEY ("recibido_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuentas_por_cobrar" ADD CONSTRAINT "cuentas_por_cobrar_factura_id_fkey" FOREIGN KEY ("factura_id") REFERENCES "facturas_clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuentas_por_cobrar" ADD CONSTRAINT "cuentas_por_cobrar_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuentas_por_pagar" ADD CONSTRAINT "cuentas_por_pagar_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_fijos" ADD CONSTRAINT "pagos_fijos_cuenta_contable_id_fkey" FOREIGN KEY ("cuenta_contable_id") REFERENCES "cuentas_contables"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_fijos" ADD CONSTRAINT "pagos_fijos_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_pagos_fijos" ADD CONSTRAINT "pagos_pagos_fijos_pago_fijo_id_fkey" FOREIGN KEY ("pago_fijo_id") REFERENCES "pagos_fijos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_pagos_fijos" ADD CONSTRAINT "pagos_pagos_fijos_pagado_por_fkey" FOREIGN KEY ("pagado_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "traspasos" ADD CONSTRAINT "traspasos_banco_origen_id_fkey" FOREIGN KEY ("banco_origen_id") REFERENCES "cuentas_bancarias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "traspasos" ADD CONSTRAINT "traspasos_banco_destino_id_fkey" FOREIGN KEY ("banco_destino_id") REFERENCES "cuentas_bancarias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "traspasos" ADD CONSTRAINT "traspasos_caja_origen_id_fkey" FOREIGN KEY ("caja_origen_id") REFERENCES "cajas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "traspasos" ADD CONSTRAINT "traspasos_caja_destino_id_fkey" FOREIGN KEY ("caja_destino_id") REFERENCES "cajas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "traspasos" ADD CONSTRAINT "traspasos_autorizado_por_fkey" FOREIGN KEY ("autorizado_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asientos_contables" ADD CONSTRAINT "asientos_contables_creado_por_fkey" FOREIGN KEY ("creado_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_asientos" ADD CONSTRAINT "detalle_asientos_asiento_id_fkey" FOREIGN KEY ("asiento_id") REFERENCES "asientos_contables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_asientos" ADD CONSTRAINT "detalle_asientos_cuenta_id_fkey" FOREIGN KEY ("cuenta_id") REFERENCES "cuentas_contables"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_asientos" ADD CONSTRAINT "detalle_asientos_caja_id_fkey" FOREIGN KEY ("caja_id") REFERENCES "cajas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tareas" ADD CONSTRAINT "tareas_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aperturas_caja" ADD CONSTRAINT "aperturas_caja_caja_id_fkey" FOREIGN KEY ("caja_id") REFERENCES "cajas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aperturas_caja" ADD CONSTRAINT "aperturas_caja_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cierres_caja" ADD CONSTRAINT "cierres_caja_caja_id_fkey" FOREIGN KEY ("caja_id") REFERENCES "cajas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cierres_caja" ADD CONSTRAINT "cierres_caja_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
