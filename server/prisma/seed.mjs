import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

// Configuración de Prisma estándar para Node.js
const prisma = new PrismaClient();

// Logging configuration is handled by Prisma Client with Accelerate

async function main() {
  console.log('🌱 Iniciando el proceso de seeding completo...');

  // ============================================
  // 1. CONFIGURACIÓN DE LA EMPRESA
  // ============================================
  console.log('\n📊 Configurando datos de la empresa...');
  
  let empresa = await prisma.empresa.findFirst();
  if (!empresa) {
    empresa = await prisma.empresa.create({
      data: {
        nombre: 'Sistema ISP 2.0',
        razonSocial: 'Sistema ISP 2.0 S.R.L.',
        rnc: '123456789',
        telefono: '809-123-4567',
        email: 'info@sistemaisp.com',
        direccion: 'Av. Principal #123, Santo Domingo',
        ciudad: 'Santo Domingo',
        provincia: 'Distrito Nacional',
        codigoPostal: '10101',
        monedaPrincipal: 'DOP',
      },
    });
    console.log('✅ Empresa creada.');
  } else {
    console.log('ℹ️ Empresa ya existe.');
  }

  // ============================================
  // 2. SISTEMA DE ROLES Y PERMISOS
  // ============================================
  console.log('\n👥 Configurando roles y permisos...');

  // Crear roles
  const roles = [
    { nombre: 'Administrador', descripcion: 'Rol con acceso total al sistema', prioridad: 1 },
    { nombre: 'Gerente', descripcion: 'Rol de gerencia con acceso a reportes', prioridad: 2 },
    { nombre: 'Técnico', descripcion: 'Rol para técnicos de campo', prioridad: 3 },
    { nombre: 'Cajero', descripcion: 'Rol para cajeros y ventas', prioridad: 4 },
    { nombre: 'Cliente', descripcion: 'Rol para clientes del sistema', prioridad: 5 },
  ];

  const createdRoles = {};
  for (const roleData of roles) {
    let role = await prisma.role.findUnique({
      where: { nombreRol: roleData.nombre },
    });

    if (!role) {
      role = await prisma.role.create({
        data: {
          nombreRol: roleData.nombre,
          descripcion: roleData.descripcion,
          prioridad: roleData.prioridad,
          activo: true,
        },
      });
      console.log(`✅ Rol "${roleData.nombre}" creado.`);
    } else {
      console.log(`ℹ️ Rol "${roleData.nombre}" ya existe.`);
    }
    createdRoles[roleData.nombre] = role;
  }

  // Crear permisos
  const permissions = [
    // Administración
    { name: 'gestionar_usuarios', description: 'Permite crear, ver, editar y eliminar usuarios', categoria: 'Administración' },
    { name: 'gestionar_roles', description: 'Permite gestionar los roles y sus permisos', categoria: 'Administración' },
    { name: 'gestionar_permisos', description: 'Permite gestionar los permisos del sistema', categoria: 'Administración' },
    { name: 'ver_dashboard_admin', description: 'Permite ver el dashboard de administración', categoria: 'Administración' },
    
    // Clientes y Servicios
    { name: 'gestionar_clientes', description: 'Permite gestionar clientes', categoria: 'Clientes' },
    { name: 'gestionar_servicios', description: 'Permite gestionar servicios', categoria: 'Servicios' },
    { name: 'gestionar_planes', description: 'Permite gestionar planes de servicio', categoria: 'Servicios' },
    { name: 'gestionar_contratos', description: 'Permite gestionar contratos', categoria: 'Contratos' },
    
    // Contabilidad
    { name: 'gestionar_contabilidad', description: 'Permite gestionar contabilidad', categoria: 'Contabilidad' },
    { name: 'gestionar_facturacion', description: 'Permite gestionar facturación', categoria: 'Contabilidad' },
    { name: 'gestionar_pagos', description: 'Permite gestionar pagos', categoria: 'Contabilidad' },
    
    // Papelería
    { name: 'gestionar_papeleria', description: 'Permite gestionar papelería', categoria: 'Papelería' },
    { name: 'gestionar_inventario', description: 'Permite gestionar inventario', categoria: 'Papelería' },
    { name: 'gestionar_ventas', description: 'Permite gestionar ventas', categoria: 'Papelería' },
    
    // Recursos Humanos
    { name: 'gestionar_empleados', description: 'Permite gestionar empleados', categoria: 'RRHH' },
    { name: 'gestionar_nomina', description: 'Permite gestionar nómina', categoria: 'RRHH' },
    
    // Reportes
    { name: 'ver_reportes', description: 'Permite ver reportes', categoria: 'Reportes' },
    { name: 'exportar_datos', description: 'Permite exportar datos', categoria: 'Reportes' },
    
    // Sistema
    { name: 'ver_bitacora', description: 'Permite ver bitácora del sistema', categoria: 'Sistema' },
    { name: 'gestionar_configuracion', description: 'Permite gestionar configuración', categoria: 'Sistema' },
  ];

  const createdPermissions = {};
  for (const permData of permissions) {
    let permission = await prisma.permiso.findUnique({
      where: { nombrePermiso: permData.name },
    });

    if (!permission) {
      permission = await prisma.permiso.create({
        data: {
          nombrePermiso: permData.name,
          descripcion: permData.description,
          categoria: permData.categoria,
          activo: true,
        },
      });
      console.log(`✅ Permiso "${permData.name}" creado.`);
    } else {
      console.log(`ℹ️ Permiso "${permData.name}" ya existe.`);
    }
    createdPermissions[permData.name] = permission;
  }

  // Asignar permisos a roles
  const rolePermissions = {
    'Administrador': Object.keys(createdPermissions), // Todos los permisos
    'Gerente': [
      'gestionar_clientes', 'gestionar_servicios', 'gestionar_planes', 'gestionar_contratos',
      'gestionar_contabilidad', 'gestionar_facturacion', 'gestionar_pagos',
      'gestionar_papeleria', 'gestionar_inventario', 'gestionar_ventas',
      'gestionar_empleados', 'gestionar_nomina',
      'ver_reportes', 'exportar_datos', 'ver_bitacora'
    ],
    'Técnico': [
      'gestionar_clientes', 'gestionar_servicios', 'ver_reportes'
    ],
    'Cajero': [
      'gestionar_clientes', 'gestionar_papeleria', 'gestionar_ventas', 'gestionar_pagos'
    ],
    'Cliente': [
      'ver_reportes'
    ],
  };

  for (const [roleName, permissionNames] of Object.entries(rolePermissions)) {
    const role = createdRoles[roleName];
    if (role) {
      for (const permName of permissionNames) {
        const permission = createdPermissions[permName];
        if (permission) {
          const existing = await prisma.rolePermiso.findUnique({
            where: {
              rolId_permisoId: {
                rolId: role.id,
                permisoId: permission.id,
              },
            },
          });

          if (!existing) {
            await prisma.rolePermiso.create({
              data: {
                rolId: role.id,
                permisoId: permission.id,
                activo: true,
              },
            });
          }
        }
      }
      console.log(`✅ Permisos asignados al rol "${roleName}".`);
    }
  }

  // ============================================
  // 3. CONFIGURACIÓN DE USUARIOS
  // ============================================
  console.log('\n👤 Configurando usuarios...');

  // Obtener el rol de administrador
  const adminRole = await prisma.role.findFirst({
    where: { nombreRol: 'Administrador' },
  });

  if (!adminRole) {
    console.error('❌ No se encontró el rol de Administrador. Asegúrate de que los roles se hayan creado correctamente.');
    return;
  }

  // Crear cargos
  const cargos = [
    { nombre: 'Administrador General', descripcion: 'Administrador general del sistema', salarioMinimo: 50000, salarioMaximo: 80000 },
    { nombre: 'Gerente General', descripcion: 'Gerente general', salarioMinimo: 40000, salarioMaximo: 60000 },
    { nombre: 'Técnico Senior', descripcion: 'Técnico senior', salarioMinimo: 25000, salarioMaximo: 35000 },
    { nombre: 'Técnico Junior', descripcion: 'Técnico junior', salarioMinimo: 15000, salarioMaximo: 25000 },
    { nombre: 'Cajero', descripcion: 'Cajero de ventas', salarioMinimo: 12000, salarioMaximo: 20000 },
    { nombre: 'Contador', descripcion: 'Contador', salarioMinimo: 20000, salarioMaximo: 30000 },
  ];

  const createdCargos = {};
  for (const cargoData of cargos) {
    let cargo = await prisma.cargo.findFirst({
      where: { nombreCargo: cargoData.nombre },
    });

    if (!cargo) {
      cargo = await prisma.cargo.create({
        data: {
          nombreCargo: cargoData.nombre,
          descripcion: cargoData.descripcion,
          salarioMinimo: cargoData.salarioMinimo,
          salarioMaximo: cargoData.salarioMaximo,
          activo: true,
        },
      });
      console.log(`✅ Cargo "${cargoData.nombre}" creado.`);
    } else {
      console.log(`ℹ️ Cargo "${cargoData.nombre}" ya existe.`);
    }
    createdCargos[cargoData.nombre] = cargo;
  }

  // Crear usuarios
  const usuarios = [
    {
      username: 'admin',
      nombre: 'Administrador',
      apellido: 'Sistema',
      email: 'admin@example.com',
      password: 'admin123',
      rol: 'Administrador',
    },
    {
      username: 'gerente',
      nombre: 'María',
      apellido: 'González',
      email: 'maria@example.com',
      password: 'gerente123',
      rol: 'Gerente',
    },
    {
      username: 'tecnico1',
      nombre: 'Carlos',
      apellido: 'Rodríguez',
      email: 'carlos@example.com',
      password: 'tecnico123',
      rol: 'Técnico',
    },
    {
      username: 'cajero1',
      nombre: 'Ana',
      apellido: 'Martínez',
      email: 'ana@example.com',
      password: 'cajero123',
      rol: 'Cajero',
    },
  ];

  for (const userData of usuarios) {
    let user = await prisma.usuario.findUnique({
      where: { username: userData.username },
    });

    if (!user) {
      // Hashear la contraseña
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // Crear el usuario
      user = await prisma.usuario.create({
        data: {
          username: userData.username,
          nombre: userData.nombre,
          apellido: userData.apellido,
          email: userData.email,
          passwordHash: hashedPassword,
          activo: true,
          ultimoAcceso: new Date(),
          // Asignar rol
          usuariosRoles: {
            create: [
              {
                rol: {
                  connect: { id: createdRoles[userData.rol].id },
                },
                activo: true,
                fechaAsignacion: new Date(),
              },
            ],
          },
        },
      });
      console.log(`✅ Usuario "${userData.username}" creado.`);
    } else {
      console.log(`ℹ️ Usuario "${userData.username}" ya existe.`);
    }
  }

  // ============================================
  // 4. CONFIGURACIÓN BÁSICA DEL SISTEMA
  // ============================================
  console.log('\n⚙️ Configurando parámetros del sistema...');

  // Verificar y crear configuraciones del sistema si no existen
  const configuraciones = [
    {
      clave: 'SISTEMA_NOMBRE',
      valor: 'Sistema ISP 2.0',
      descripcion: 'Nombre del sistema',
      tipo: 'texto',
      esPublica: true,
    },
    {
      clave: 'SISTEMA_VERSION',
      valor: '1.0.0',
      descripcion: 'Versión actual del sistema',
      tipo: 'texto',
      esPublica: true,
    },
    {
      clave: 'PAGINACION_ITEMS_POR_PAGINA',
      valor: '10',
      descripcion: 'Número de ítems por página en listados',
      tipo: 'numero',
      esPublica: true,
    },
  ];

  for (const config of configuraciones) {
    const existeConfig = await prisma.configuracion.findUnique({
      where: { clave: config.clave },
    });

    if (!existeConfig) {
      await prisma.configuracion.create({
        data: {
          clave: config.clave,
          valor: config.valor,
          descripcion: config.descripcion,
          tipo: config.tipo,
          esPublica: config.esPublica,
        },
      });
      console.log(`✅ Configuración "${config.clave}" creada.`);
    } else {
      console.log(`ℹ️ Configuración "${config.clave}" ya existe.`);
    }
  }

  // Crear categorías de SERVICIOS (para ISP)
  const categoriasServicios = [
    { nombre: 'Internet', descripcion: 'Servicios de internet', color: '#3B82F6' },
    { nombre: 'Telefonía', descripcion: 'Servicios de telefonía', color: '#10B981' },
    { nombre: 'Televisión', descripcion: 'Servicios de televisión', color: '#F59E0B' },
    { nombre: 'Combo', descripcion: 'Paquetes combinados', color: '#8B5CF6' },
  ];

  const createdCategoriasServicios = {};
  for (const cat of categoriasServicios) {
    let categoria = await prisma.categoria.findFirst({ where: { nombre: cat.nombre } });
    if (!categoria) {
      categoria = await prisma.categoria.create({
        data: {
          nombre: cat.nombre,
          descripcion: cat.descripcion,
          color: cat.color,
          activo: true,
        },
      });
      console.log(`✅ Categoría de servicio "${cat.nombre}" creada.`);
    } else {
      console.log(`ℹ️ Categoría de servicio "${cat.nombre}" ya existe.`);
    }
    createdCategoriasServicios[cat.nombre] = categoria;
  }

  // Crear servicios de ejemplo
  const servicios = [
    {
      nombre: 'Internet Básico',
      descripcion: 'Internet de 10 Mbps',
      categoria: 'Internet',
      tipo: 'internet',
      precioBase: 1500,
      esRecurrente: true,
      requierePlan: true,
    },
    {
      nombre: 'Internet Avanzado',
      descripcion: 'Internet de 50 Mbps',
      categoria: 'Internet',
      tipo: 'internet',
      precioBase: 2500,
      esRecurrente: true,
      requierePlan: true,
    },
    {
      nombre: 'Línea Telefónica',
      descripcion: 'Línea telefónica básica',
      categoria: 'Telefonía',
      tipo: 'telefonia',
      precioBase: 800,
      esRecurrente: true,
      requierePlan: false,
    },
    {
      nombre: 'TV Básica',
      descripcion: 'Televisión básica con 50 canales',
      categoria: 'Televisión',
      tipo: 'television',
      precioBase: 1200,
      esRecurrente: true,
      requierePlan: false,
    },
    {
      nombre: 'Combo Familiar',
      descripcion: 'Internet + TV + Teléfono',
      categoria: 'Combo',
      tipo: 'combo',
      precioBase: 3500,
      esRecurrente: true,
      requierePlan: true,
    },
  ];

  for (const servData of servicios) {
    let servicio = await prisma.servicio.findFirst({
      where: { nombre: servData.nombre },
    });

    if (!servicio) {
      const categoria = createdCategoriasServicios[servData.categoria];
      servicio = await prisma.servicio.create({
        data: {
          nombre: servData.nombre,
          descripcion: servData.descripcion,
          categoriaId: categoria.id,
          tipo: servData.tipo,
          esRecurrente: servData.esRecurrente,
          requierePlan: servData.requierePlan,
          precioBase: servData.precioBase,
          moneda: 'DOP',
          activo: true,
        },
      });
      console.log(`✅ Servicio "${servData.nombre}" creado.`);
    } else {
      console.log(`ℹ️ Servicio "${servData.nombre}" ya existe.`);
    }
  }

  // Crear planes
  const planes = [
    {
      nombre: 'Plan Básico 10 Mbps',
      descripcion: 'Plan básico de internet',
      categoria: 'Internet',
      precio: 1500,
      subidaKbps: 1000,
      bajadaMbps: 10,
    },
    {
      nombre: 'Plan Avanzado 50 Mbps',
      descripcion: 'Plan avanzado de internet',
      categoria: 'Internet',
      precio: 2500,
      subidaKbps: 5000,
      bajadaMbps: 50,
    },
    {
      nombre: 'Plan Premium 100 Mbps',
      descripcion: 'Plan premium de internet',
      categoria: 'Internet',
      precio: 4000,
      subidaKbps: 10000,
      bajadaMbps: 100,
    },
  ];

  for (const planData of planes) {
    let plan = await prisma.plan.findFirst({
      where: { nombre: planData.nombre },
    });

    if (!plan) {
      const categoria = createdCategoriasServicios[planData.categoria];
      plan = await prisma.plan.create({
        data: {
          nombre: planData.nombre,
          descripcion: planData.descripcion,
          categoriaId: categoria.id,
          precio: planData.precio,
          moneda: 'DOP',
          subidaKbps: planData.subidaKbps,
          bajadaMbps: planData.bajadaMbps,
          activo: true,
        },
      });
      console.log(`✅ Plan "${planData.nombre}" creado.`);
    } else {
      console.log(`ℹ️ Plan "${planData.nombre}" ya existe.`);
    }
  }

  // ============================================
  // 5. SISTEMA CONTABLE
  // ============================================
  console.log('\n💰 Configurando sistema contable...');

  // Crear bancos
  const bancos = [
    { nombre: 'Banco Popular Dominicano', codigo: 'BPD' },
    { nombre: 'Banco de Reservas', codigo: 'BRD' },
    { nombre: 'Banco BHD León', codigo: 'BHD' },
    { nombre: 'Scotiabank', codigo: 'SBK' },
    { nombre: 'Banco Promerica', codigo: 'BPR' },
  ];

  const createdBancos = {};
  for (const bancoData of bancos) {
    let banco = await prisma.bank.findFirst({
      where: { nombre: bancoData.nombre },
    });

    if (!banco) {
      banco = await prisma.bank.create({
        data: {
          nombre: bancoData.nombre,
          codigo: bancoData.codigo,
          activo: true,
        },
      });
      console.log(`✅ Banco "${bancoData.nombre}" creado.`);
    } else {
      console.log(`ℹ️ Banco "${bancoData.nombre}" ya existe.`);
    }
    createdBancos[bancoData.nombre] = banco;
  }

  // Crear categorías de cuentas
  const categoriasCuentas = [
    { codigo: '1', nombre: 'ACTIVOS', tipo: 'activo', nivel: 1, esDetalle: false },
    { codigo: '1.1', nombre: 'ACTIVOS CORRIENTES', tipo: 'activo', nivel: 2, esDetalle: false, padre: '1' },
    { codigo: '1.1.1', nombre: 'Caja', tipo: 'activo', nivel: 3, esDetalle: true, padre: '1.1' },
    { codigo: '1.1.2', nombre: 'Bancos', tipo: 'activo', nivel: 3, esDetalle: true, padre: '1.1' },
    { codigo: '1.1.3', nombre: 'Cuentas por Cobrar', tipo: 'activo', nivel: 3, esDetalle: true, padre: '1.1' },
    { codigo: '1.2', nombre: 'ACTIVOS NO CORRIENTES', tipo: 'activo', nivel: 2, esDetalle: false, padre: '1' },
    { codigo: '2', nombre: 'PASIVOS', tipo: 'pasivo', nivel: 1, esDetalle: false },
    { codigo: '2.1', nombre: 'PASIVOS CORRIENTES', tipo: 'pasivo', nivel: 2, esDetalle: false, padre: '2' },
    { codigo: '2.1.1', nombre: 'Cuentas por Pagar', tipo: 'pasivo', nivel: 3, esDetalle: true, padre: '2.1' },
    { codigo: '3', nombre: 'PATRIMONIO', tipo: 'patrimonio', nivel: 1, esDetalle: false },
    { codigo: '4', nombre: 'INGRESOS', tipo: 'ingreso', nivel: 1, esDetalle: false },
    { codigo: '4.1', nombre: 'Ingresos por Servicios', tipo: 'ingreso', nivel: 2, esDetalle: true, padre: '4' },
    { codigo: '5', nombre: 'GASTOS', tipo: 'gasto', nivel: 1, esDetalle: false },
    { codigo: '5.1', nombre: 'Gastos Operacionales', tipo: 'gasto', nivel: 2, esDetalle: true, padre: '5' },
  ];

  const createdCategoriasCuentas = {};
  for (const catData of categoriasCuentas) {
    let categoria = await prisma.categoriaCuenta.findUnique({
      where: { codigo: catData.codigo },
    });

    if (!categoria) {
      const padreId = catData.padre ? createdCategoriasCuentas[catData.padre]?.id : null;
      categoria = await prisma.categoriaCuenta.create({
        data: {
          codigo: catData.codigo,
          nombre: catData.nombre,
          tipo: catData.tipo,
          nivel: catData.nivel,
          esDetalle: catData.esDetalle,
          padreId: padreId,
          activa: true,
        },
      });
      console.log(`✅ Categoría de cuenta "${catData.nombre}" creada.`);
    } else {
      console.log(`ℹ️ Categoría de cuenta "${catData.nombre}" ya existe.`);
    }
    createdCategoriasCuentas[catData.codigo] = categoria;
  }

  // Crear cuentas contables
  const cuentasContables = [
    { codigo: '001', nombre: 'Caja Principal', categoria: '1.1.1', tipo: 'Caja', saldoInicial: 10000, saldoActual: 10000 },
    { codigo: '002', nombre: 'Bancos', categoria: '1.1.2', tipo: 'Banco', saldoInicial: 50000, saldoActual: 50000 },
    { codigo: '003', nombre: 'Papelería', categoria: '1.1.1', tipo: 'Papeleria', saldoInicial: 25000, saldoActual: 25000 },
    { codigo: '1.1.1.001', nombre: 'Caja Principal Detalle', categoria: '1.1.1', tipo: 'Caja' },
    { codigo: '1.1.2.001', nombre: 'Banco Popular - Cuenta Corriente', categoria: '1.1.2', tipo: 'Banco' },
    { codigo: '1.1.2.002', nombre: 'Banco de Reservas - Cuenta Ahorros', categoria: '1.1.2', tipo: 'Banco' },
    { codigo: '1.1.3.001', nombre: 'Cuentas por Cobrar Clientes', categoria: '1.1.3', tipo: 'Cuenta por Cobrar' },
    { codigo: '2.1.1.001', nombre: 'Cuentas por Pagar Proveedores', categoria: '2.1.1', tipo: 'Cuenta por Pagar' },
    { codigo: '4.1.001', nombre: 'Ingresos por Servicios de Internet', categoria: '4.1', tipo: 'Ingreso' },
    { codigo: '4.1.002', nombre: 'Ingresos por Servicios de TV', categoria: '4.1', tipo: 'Ingreso' },
    { codigo: '5.1.001', nombre: 'Gastos de Personal', categoria: '5.1', tipo: 'Gasto' },
    { codigo: '5.1.002', nombre: 'Gastos de Equipos', categoria: '5.1', tipo: 'Gasto' },
  ];

  for (const cuentaData of cuentasContables) {
    let cuenta = await prisma.cuentaContable.findUnique({
      where: { codigo: cuentaData.codigo },
    });

    if (!cuenta) {
      const categoria = createdCategoriasCuentas[cuentaData.categoria];
      cuenta = await prisma.cuentaContable.create({
        data: {
          codigo: cuentaData.codigo,
          nombre: cuentaData.nombre,
          categoriaId: categoria.id,
          tipoCuenta: cuentaData.tipo,
          moneda: 'DOP',
          saldoInicial: cuentaData.saldoInicial || 0,
          saldoActual: cuentaData.saldoActual || 0,
          activa: true,
        },
      });
      console.log(`✅ Cuenta contable "${cuentaData.nombre}" creada.`);
    } else {
      console.log(`ℹ️ Cuenta contable "${cuentaData.nombre}" ya existe.`);
    }
  }

  // ============================================
  // 6. SISTEMA DE PAPELERÍA
  // ============================================
  console.log('\n📝 Configurando sistema de papelería...');

  // Crear categorías de papelería
  const categoriasPapeleria = [
    { nombre: 'Oficina', descripcion: 'Artículos de oficina', icono: 'office', color: '#3B82F6' },
    { nombre: 'Escritura', descripcion: 'Artículos de escritura', icono: 'pen', color: '#10B981' },
    { nombre: 'Papel', descripcion: 'Productos de papel', icono: 'paper', color: '#F59E0B' },
    { nombre: 'Tecnología', descripcion: 'Artículos tecnológicos', icono: 'tech', color: '#8B5CF6' },
  ];

  const createdCategoriasPapeleria = {};
  for (const catData of categoriasPapeleria) {
    let categoria = await prisma.categoriaPapeleria.findFirst({
      where: { nombre: catData.nombre },
    });

    if (!categoria) {
      categoria = await prisma.categoriaPapeleria.create({
        data: {
          nombre: catData.nombre,
          descripcion: catData.descripcion,
          icono: catData.icono,
          color: catData.color,
          activo: true,
        },
      });
      console.log(`✅ Categoría de papelería "${catData.nombre}" creada.`);
    } else {
      console.log(`ℹ️ Categoría de papelería "${catData.nombre}" ya existe.`);
    }
    createdCategoriasPapeleria[catData.nombre] = categoria;
  }

  // ============================================
  // 6.5. CAJAS DEL SISTEMA
  // ============================================
  console.log('\n💰 Configurando cajas del sistema...');

  // Crear cajas principales
  const cajasSistema = [
    {
      nombre: 'Caja Principal',
      descripcion: 'Caja principal del sistema',
      tipo: 'general', // Changed to match service expectation
      cuentaContable: '001', // Link to the correct cuenta
      responsable: 'admin',
      saldoInicial: 10000,
    },
    {
      nombre: 'Papelería',
      descripcion: 'Caja de papelería',
      tipo: 'papeleria',
      cuentaContable: '003', // Link to the correct cuenta
      responsable: 'cajero1',
      saldoInicial: 25000,
    },
  ];

  for (const cajaData of cajasSistema) {
    let caja = await prisma.caja.findFirst({
      where: { nombre: cajaData.nombre },
    });

    if (!caja) {
      const cuentaContable = await prisma.cuentaContable.findUnique({
        where: { codigo: cajaData.cuentaContable },
      });

      const responsable = await prisma.usuario.findUnique({
        where: { username: cajaData.responsable },
      });

      caja = await prisma.caja.create({
        data: {
          nombre: cajaData.nombre,
          descripcion: cajaData.descripcion,
          tipo: cajaData.tipo,
          cuentaContableId: cuentaContable?.id,
          responsableId: responsable?.id,
          saldoInicial: cajaData.saldoInicial,
          saldoActual: cajaData.saldoInicial,
          activa: true,
        },
      });
      console.log(`✅ Caja "${cajaData.nombre}" creada.`);
    } else {
      console.log(`ℹ️ Caja "${cajaData.nombre}" ya existe.`);
    }
  }

  // ============================================
  // 6.6. MOVIMIENTOS CONTABLES DE PRUEBA
  // ============================================
  console.log('\n💸 Creando movimientos contables de prueba... (omitido temporalmente)');

  // Get user IDs first
  // Omitido para evitar errores de validación en este entorno. Si deseas habilitar
  // datos de ejemplo de movimientos contables, podemos ajustar el modelo y crear
  // los registros con las relaciones requeridas explícitas.

  // ============================================
  // 7. CONFIGURACIONES DEL SISTEMA
  // ============================================
  console.log('\n⚙️ Configurando sistema...');

  const configuracionesSistema = [
    { clave: 'nombre_empresa', valor: 'Sistema ISP 2.0', descripcion: 'Nombre de la empresa', tipo: 'string', esPublica: true },
    { clave: 'moneda_principal', valor: 'DOP', descripcion: 'Moneda principal del sistema', tipo: 'string', esPublica: true },
    { clave: 'impuesto_por_defecto', valor: '18', descripcion: 'Porcentaje de impuesto por defecto', tipo: 'number', esPublica: false },
    { clave: 'dias_credito_default', valor: '30', descripcion: 'Días de crédito por defecto', tipo: 'number', esPublica: false },
    { clave: 'limite_usuarios', valor: '100', descripcion: 'Límite de usuarios del sistema', tipo: 'number', esPublica: false },
    { clave: 'backup_automatico', valor: 'true', descripcion: 'Backup automático habilitado', tipo: 'boolean', esPublica: false },
  ];

  for (const configData of configuracionesSistema) {
    let config = await prisma.configuracion.findUnique({
      where: { clave: configData.clave },
    });

    if (!config) {
      config = await prisma.configuracion.create({
        data: {
          clave: configData.clave,
          valor: configData.valor,
          descripcion: configData.descripcion,
          tipo: configData.tipo,
          esPublica: configData.esPublica,
          categoria: 'general',
        },
      });
      console.log(`✅ Configuración "${configData.clave}" creada.`);
    } else {
      console.log(`ℹ️ Configuración "${configData.clave}" ya existe.`);
    }
  }

  console.log('\n🎉 Proceso de seeding completo finalizado exitosamente!');
}

// Ejecutar la función principal y manejar errores
main()
  .catch((e) => {
    console.error('❌ Error durante el seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
