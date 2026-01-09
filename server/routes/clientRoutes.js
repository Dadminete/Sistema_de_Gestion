const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const { requirePermission } = require('../middleware/authorize');

// Helper function to validate UUID
const isValidUUID = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// Debug route - temporary route without authentication for testing
router.get('/debug', async (req, res) => {
  try {
    const { status = 'activo', limit = 10 } = req.query;
    console.log('🔍 DEBUG /clients/debug - Parámetros:', { status, limit });

    const where = {};
    if (status) {
      where.estado = status;
    }

    const clients = await prisma.cliente.findMany({
      where,
      select: {
        id: true,
        nombre: true,
        apellidos: true,
        estado: true,
        codigoCliente: true,
        telefono: true,
        email: true
      },
      take: parseInt(limit),
      orderBy: { nombre: 'asc' }
    });

    console.log('✅ DEBUG - Clientes encontrados:', clients.length);
    res.json({
      debug: true,
      count: clients.length,
      data: clients
    });
  } catch (error) {
    console.error('❌ DEBUG Error:', error);
    res.status(500).json({ debug: true, error: error.message });
  }
});

// Create test data endpoint - NO AUTH required for testing
router.get('/debug-create-test-data', async (req, res) => {
  try {
    console.log('🏗️ Creating test data...');
    
    // Check if data already exists
    const existingSuscripciones = await prisma.suscripcion.count();
    if (existingSuscripciones > 0) {
      return res.json({
        debug: true,
        message: 'Test data already exists',
        count: existingSuscripciones
      });
    }
    
    // Create test clients if they don't exist
    const existingClients = await prisma.cliente.count();
    let clientIds = [];
    
    if (existingClients === 0) {
      console.log('Creating test clients...');
      const testClients = await Promise.all([
        prisma.cliente.create({
          data: {
            nombre: 'Juan',
            apellidos: 'Pérez García',
            codigoCliente: 'CLI-2025-0001',
            telefono: '809-555-0001',
            email: 'juan.perez@example.com',
            estado: 'activo',
            categoria_cliente: 'NUEVO'
          }
        }),
        prisma.cliente.create({
          data: {
            nombre: 'María',
            apellidos: 'López Rodríguez',
            codigoCliente: 'CLI-2025-0002',
            telefono: '809-555-0002',
            email: 'maria.lopez@example.com',
            estado: 'activo',
            categoria_cliente: 'NUEVO'
          }
        }),
        prisma.cliente.create({
          data: {
            nombre: 'Carlos',
            apellidos: 'González Martínez',
            codigoCliente: 'CLI-2025-0003',
            telefono: '809-555-0003',
            email: 'carlos.gonzalez@example.com',
            estado: 'activo',
            categoria_cliente: 'VIP'
          }
        })
      ]);
      clientIds = testClients.map(c => c.id);
      console.log('✅ Created test clients:', testClients.length);
    } else {
      const existingClientsList = await prisma.cliente.findMany({
        take: 3,
        select: { id: true }
      });
      clientIds = existingClientsList.map(c => c.id);
    }
    
    // Create test servicios if they don't exist
    const existingServicios = await prisma.servicio.count();
    let servicioIds = [];
    
    if (existingServicios === 0) {
      console.log('Creating test servicios...');
      const testServicios = await Promise.all([
        prisma.servicio.create({
          data: {
            nombre: 'Internet Fibra Óptica 100MB',
            tipo: 'INTERNET',
            activo: true,
            precio: 1500.00
          }
        }),
        prisma.servicio.create({
          data: {
            nombre: 'Cable TV Premium HD',
            tipo: 'TELEVISION',
            activo: true,
            precio: 800.00
          }
        }),
        prisma.servicio.create({
          data: {
            nombre: 'Telefonía Residencial',
            tipo: 'TELEFONIA',
            activo: true,
            precio: 600.00
          }
        })
      ]);
      servicioIds = testServicios.map(s => s.id);
      console.log('✅ Created test servicios:', testServicios.length);
    } else {
      const existingServiciosList = await prisma.servicio.findMany({
        take: 3,
        select: { id: true }
      });
      servicioIds = existingServiciosList.map(s => s.id);
    }
    
    // Create test planes if they don't exist
    const existingPlanes = await prisma.plan.count();
    let planIds = [];
    
    if (existingPlanes === 0) {
      console.log('Creating test planes...');
      const testPlanes = await Promise.all([
        prisma.plan.create({
          data: {
            nombre: 'Plan Básico Residencial',
            descripcion: 'Plan básico para uso residencial',
            precio: 1200.00,
            activo: true
          }
        }),
        prisma.plan.create({
          data: {
            nombre: 'Plan Estándar Plus',
            descripcion: 'Plan estándar con beneficios adicionales',
            precio: 1800.00,
            activo: true
          }
        }),
        prisma.plan.create({
          data: {
            nombre: 'Plan Premium Empresarial',
            descripcion: 'Plan premium para empresas',
            precio: 2500.00,
            activo: true
          }
        })
      ]);
      planIds = testPlanes.map(p => p.id);
      console.log('✅ Created test planes:', testPlanes.length);
    } else {
      const existingPlanesList = await prisma.plan.findMany({
        take: 3,
        select: { id: true }
      });
      planIds = existingPlanesList.map(p => p.id);
    }
    
    // Create test suscripciones
    console.log('Creating test suscripciones...');
    const testSuscripciones = [];
    
    for (let i = 0; i < Math.min(clientIds.length, 3); i++) {
      const suscripcion = await prisma.suscripcion.create({
        data: {
          clienteId: clientIds[i],
          servicioId: servicioIds[i % servicioIds.length],
          planId: planIds[i % planIds.length],
          estado: 'activo',
          fechaInicio: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)), // Stagger dates
          monto: 1500.00 + (i * 300), // Different amounts
          diaFacturacion: 15,
          createdAt: new Date(Date.now() - (i * 60 * 60 * 1000)) // Recent creation times
        }
      });
      testSuscripciones.push(suscripcion);
    }
    
    console.log('✅ Created test suscripciones:', testSuscripciones.length);
    
    res.json({
      debug: true,
      message: 'Test data created successfully',
      created: {
        clients: clientIds.length,
        servicios: servicioIds.length,
        planes: planIds.length,
        suscripciones: testSuscripciones.length
      },
      suscripciones: testSuscripciones
    });
    
  } catch (error) {
    console.error('❌ Error creating test data:', error);
    res.status(500).json({
      debug: true,
      error: 'Failed to create test data',
      message: error.message
    });
  }
});

// Debug route for recent subscribed clients - NO AUTH required for testing
router.get('/debug-recent-subscribed', async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    
    console.log('🔍 DEBUG - Fetching recent subscribed clients with limit:', limit);
    
    // First, check what we have in the database
    const totalSuscripciones = await prisma.suscripcion.count();
    console.log('📊 Total suscripciones in DB:', totalSuscripciones);
    
    if (totalSuscripciones === 0) {
      return res.json({
        debug: true,
        message: 'No suscripciones found in database',
        data: [],
        suggestions: 'Create some test suscripciones first'
      });
    }
    
    // Check different estado values
    const estadoGroups = await prisma.suscripcion.groupBy({
      by: ['estado'],
      _count: { id: true }
    });
    console.log('📊 Estados in suscripciones:', estadoGroups);
    
    // Get recent subscriptions with client information
    const recentSuscripciones = await prisma.suscripcion.findMany({
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      where: {
        OR: [
          { estado: 'activo' },
          { estado: 'Activo' },
          { estado: 'ACTIVO' },
          { estado: 'active' },
          { estado: 'Active' }
        ]
      },
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
            apellidos: true,
            email: true,
            fechaSuscripcion: true
          }
        },
        servicio: {
          select: {
            nombre: true
          }
        },
        plan: {
          select: {
            nombre: true
          }
        }
      }
    });

    console.log('📊 Found active suscripciones:', recentSuscripciones.length);

    // Also try without the estado filter to see all recent suscripciones
    const allRecentSuscripciones = await prisma.suscripcion.findMany({
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
            apellidos: true,
            email: true,
            fechaSuscripcion: true
          }
        },
        servicio: {
          select: {
            nombre: true
          }
        },
        plan: {
          select: {
            nombre: true
          }
        }
      }
    });

    console.log('📊 All recent suscripciones (any estado):', allRecentSuscripciones.length);

    const recentSubscribedClients = recentSuscripciones
      .filter(sub => sub.cliente)
      .map(sub => ({
        id: sub.cliente.id,
        name: `${sub.cliente.nombre} ${sub.cliente.apellidos || ''}`.trim(),
        email: sub.cliente.email || 'No disponible',
        fecha_suscripcion: sub.createdAt,
        servicio: sub.servicio?.nombre || 'Servicio no disponible',
        plan: sub.plan?.nombre || 'Plan no disponible',
        estado: sub.estado
      }));

    const allRecentClients = allRecentSuscripciones
      .filter(sub => sub.cliente)
      .map(sub => ({
        id: sub.cliente.id,
        name: `${sub.cliente.nombre} ${sub.cliente.apellidos || ''}`.trim(),
        email: sub.cliente.email || 'No disponible',
        fecha_suscripcion: sub.createdAt,
        servicio: sub.servicio?.nombre || 'Servicio no disponible',
        plan: sub.plan?.nombre || 'Plan no disponible',
        estado: sub.estado
      }));

    console.log('✅ Returning active clients:', recentSubscribedClients.length);
    
    res.json({
      debug: true,
      totalSuscripciones,
      estadoGroups,
      activeClients: recentSubscribedClients,
      allRecentClients,
      data: recentSubscribedClients // This is what the frontend expects
    });
  } catch (error) {
    console.error('❌ Error in debug recent subscribed clients:', error);
    res.status(500).json({
      debug: true,
      error: 'Failed to fetch recent subscribed clients',
      message: error.message
    });
  }
});

// Get all clients with pagination and filters
router.get('/', requirePermission('clientes.listado'), async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, category, diaFacturacion } = req.query;
    const skip = (page - 1) * limit;

    console.log('🔍 GET /clients - Filtros:', { page, limit, status, diaFacturacion });

    const where = {};

    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { apellidos: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { telefono: { contains: search } }
      ];
    }

    if (status) {
      const statuses = status.split(',');
      const caseInsensitiveStatuses = statuses.flatMap(s => [
        s.toUpperCase(),
        s.toLowerCase(),
        s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() // Title case
      ]);
      where.estado = { in: caseInsensitiveStatuses };
    }

    if (category) {
      where.categoria_cliente = category;
    }

    // Filtrar por día de facturación si se proporciona
    if (diaFacturacion) {
      where.suscripciones = {
        some: {
          diaFacturacion: parseInt(diaFacturacion),
          estado: { in: ['activo', 'Activo', 'ACTIVO'] }
        }
      };
    }

    // Optimizar consulta para búsquedas - incluir menos relaciones si es una búsqueda
    const isSearch = Boolean(search && search.trim().length > 0);
    const includeRelations = isSearch ? {
      // Para búsquedas, incluir solo lo esencial
      suscripciones: {
        where: {
          estado: { in: ['activo', 'Activo', 'ACTIVO'] }
        },
        select: {
          id: true,
          diaFacturacion: true,
          estado: true,
          servicio: {
            select: {
              nombre: true
            }
          }
        }
      }
    } : {
      // Para listados completos, incluir todo
      contratos: {
        include: {
          servicio: true
        }
      },
      suscripciones: {
        include: {
          servicio: true,
          plan: true
        }
      },
      facturas: {
        include: {
          detalles: true,
          pagos: true
        }
      },
      tickets: {
        include: {
          respuestas: true
        }
      }
    };

    const [clients, total] = await Promise.all([
      prisma.cliente.findMany({
        where,
        include: includeRelations,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.cliente.count({ where })
    ]);

    console.log('✅ Clientes encontrados:', total, '| Retornados:', clients.length);

    res.json({
      data: clients,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('❌ Error fetching clients:', error);
    res.status(500).json({ error: 'Failed to fetch clients', message: error.message });
  }
});

// Endpoint específico para búsquedas rápidas de clientes (optimizado)
router.get('/search', requirePermission('clientes.listado'), async (req, res) => {
  try {
    const { q, limit = 50, status = 'activo', diaFacturacion } = req.query;

    console.log('🔍 GET /clients/search - Búsqueda rápida:', { q, limit, status, diaFacturacion });

    if (!q || q.trim().length < 2) {
      return res.json({ data: [], message: 'Búsqueda debe tener al menos 2 caracteres' });
    }

    const searchTerm = q.trim();
    const where = {
      AND: [
        // Filtro de estado
        status ? { estado: { in: [status, status.toUpperCase(), status.toLowerCase(), status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()] } } : {},
        
        // Filtro de búsqueda
        {
          OR: [
            { nombre: { contains: searchTerm, mode: 'insensitive' } },
            { apellidos: { contains: searchTerm, mode: 'insensitive' } },
            { codigoCliente: { contains: searchTerm, mode: 'insensitive' } },
            { email: { contains: searchTerm, mode: 'insensitive' } },
            { telefono: { contains: searchTerm } },
            // Búsqueda combinada nombre + apellido
            {
              AND: [
                { nombre: { contains: searchTerm.split(' ')[0], mode: 'insensitive' } },
                ...(searchTerm.split(' ').length > 1 ? 
                  [{ apellidos: { contains: searchTerm.split(' ').slice(1).join(' '), mode: 'insensitive' } }] : []
                )
              ]
            }
          ]
        },

        // Filtro de día de facturación si se proporciona
        ...(diaFacturacion ? [{
          suscripciones: {
            some: {
              diaFacturacion: parseInt(diaFacturacion),
              estado: { in: ['activo', 'Activo', 'ACTIVO'] }
            }
          }
        }] : [])
      ]
    };

    // Consulta optimizada solo con datos esenciales
    const clients = await prisma.cliente.findMany({
      where,
      select: {
        id: true,
        nombre: true,
        apellidos: true,
        codigoCliente: true,
        telefono: true,
        email: true,
        estado: true,
        suscripciones: {
          where: {
            estado: { in: ['activo', 'Activo', 'ACTIVO'] }
          },
          select: {
            id: true,
            diaFacturacion: true,
            estado: true,
            servicio: {
              select: {
                nombre: true
              }
            }
          }
        }
      },
      take: parseInt(limit),
      orderBy: [
        { nombre: 'asc' },
        { apellidos: 'asc' }
      ]
    });

    console.log('✅ Búsqueda rápida - Clientes encontrados:', clients.length);

    res.json({
      data: clients,
      total: clients.length,
      search: searchTerm
    });
  } catch (error) {
    console.error('❌ Error en búsqueda rápida de clientes:', error);
    res.status(500).json({ error: 'Error en búsqueda de clientes', message: error.message });
  }
});

// Get recent subscribed clients (temporarily without auth for debugging)
router.get('/recent-subscribed', async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    
    console.log('🔍 Fetching recent subscribed clients with limit:', limit);
    
    // Set cache headers for better performance
    res.set({
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=60', // 5 minutes cache with stale-while-revalidate
      'ETag': `"recent-clients-${Date.now()}"`,
      'Vary': 'Accept-Encoding'
    });
    
    // Get recent subscriptions with client information
    // Try multiple active estados to be more flexible
    const recentSuscripciones = await prisma.suscripcion.findMany({
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      where: {
        OR: [
          { estado: 'activo' },
          { estado: 'Activo' },
          { estado: 'ACTIVO' },
          { estado: 'active' },
          { estado: 'Active' }
        ]
      },
      select: {
        id: true,
        estado: true,
        createdAt: true,
        cliente: {
          select: {
            id: true,
            nombre: true,
            apellidos: true,
            email: true,
            fechaSuscripcion: true
          }
        },
        servicio: {
          select: {
            nombre: true
          }
        },
        plan: {
          select: {
            nombre: true
          }
        }
      }
    });

    console.log('📊 Found suscripciones:', recentSuscripciones.length);

    const recentSubscribedClients = recentSuscripciones
      .filter(sub => sub.cliente) // Filter out subscriptions without client
      .map(sub => ({
        id: sub.cliente.id,
        name: `${sub.cliente.nombre} ${sub.cliente.apellidos || ''}`.trim(),
        email: sub.cliente.email || 'No disponible',
        fecha_suscripcion: sub.createdAt,
        servicio: sub.servicio?.nombre || 'Servicio no disponible',
        plan: sub.plan?.nombre || 'Plan no disponible',
        estado: sub.estado
      }));

    console.log('✅ Returning clients:', recentSubscribedClients.length);
    
    res.json({
      success: true,
      data: recentSubscribedClients,
      count: recentSubscribedClients.length,
      timestamp: new Date().toISOString(),
      cached: false
    });
  } catch (error) {
    console.error('❌ Error fetching recent subscribed clients:', error);
    res.status(500).json({
      error: 'Failed to fetch recent subscribed clients',
      message: error.message
    });
  }
});

// Get client by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const client = await prisma.cliente.findUnique({
      where: { id },
      include: {
        contratos: {
          include: {
            servicio: true,
            facturas: true,
            tickets: true,
            equipos: true
          }
        },
        facturas: {
          include: {
            detalles: true,
            pagos: true,
            cuentasPorCobrar: true
          }
        },
        pagos: true,
        tickets: {
          include: {
            respuestas: true,
            contrato: true,
            suscripcion: true
          }
        },
        cuentasPorCobrar: true,
        ventasPapeleria: {
          include: {
            detalles: true
          }
        },
        conversaciones: {
          include: {
            mensajes: {
              include: {
                usuario: true,
                archivo: true
              }
            },
            participantes: {
              include: {
                usuario: true
              }
            }
          }
        },
        archivos: true,
        referidos: true,
        referidoPor: true
      }
    });

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json(client);
  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({ error: 'Failed to fetch client', message: error.message });
  }
});

// Create new client
router.post('/', requirePermission('clientes.crear'), async (req, res) => {
  try {
    const { datosISP, datosPapeleria, datosFinancieros, ...clientData } = req.body;

    // Generate client code if not provided
    let codigoCliente;
    if (!clientData.codigoCliente) {
      const currentYear = new Date().getFullYear();
      const lastClient = await prisma.cliente.findFirst({
        where: {
          codigoCliente: {
            startsWith: `CLI-${currentYear}-`
          }
        },
        orderBy: {
          codigoCliente: 'desc'
        }
      });

      let nextNumber = 1;
      if (lastClient && lastClient.codigoCliente) {
        const lastNumber = parseInt(lastClient.codigoCliente.split('-')[2]);
        nextNumber = lastNumber + 1;
      }

      codigoCliente = `CLI-${currentYear}-${String(nextNumber).padStart(4, '0')}`;
      console.log('Generated codigoCliente:', codigoCliente);
    } else {
      codigoCliente = clientData.codigoCliente;
      console.log('Using provided codigoCliente:', codigoCliente);
    }

    // Prepare data according to Prisma schema
    const dataToCreate = {
      // Basic client fields - only include non-undefined values
      nombre: clientData.nombre,
      apellidos: clientData.apellidos,
      codigoCliente: codigoCliente, // Include the generated client code
      ...(clientData.telefono && { telefono: clientData.telefono }),
      ...(clientData.email && { email: clientData.email }),
      ...(clientData.direccion && { direccion: clientData.direccion }),
      ...(clientData.sector_barrio && { sector_barrio: clientData.sector_barrio }),
      ...(clientData.ciudad && { ciudad: clientData.ciudad }),
      ...(clientData.provincia && { provincia: clientData.provincia }),
      ...(clientData.codigoPostal && { codigoPostal: clientData.codigoPostal }),
      ...(clientData.coordenadasLat && { coordenadasLat: clientData.coordenadasLat }),
      ...(clientData.coordenadasLng && { coordenadasLng: clientData.coordenadasLng }),
      ...(clientData.referenciaDireccion && { referenciaDireccion: clientData.referenciaDireccion }),
      ...(clientData.sexo && { sexo: clientData.sexo }),
      categoria_cliente: clientData.categoria_cliente,
      estado: clientData.estado || 'activo',
      ...(clientData.limiteCrediticio !== undefined && { limiteCrediticio: clientData.limiteCrediticio }),
      creditoDisponible: clientData.limiteCrediticio || 0,
      ...(clientData.diasCredito !== undefined && { diasCredito: clientData.diasCredito }),
      ...(clientData.descuentoPorcentaje !== undefined && { descuentoPorcentaje: clientData.descuentoPorcentaje }),
      ...(clientData.cedula && { cedula: clientData.cedula }),
      ...(clientData.tipoCliente && { tipoCliente: clientData.tipoCliente }),
      ...(clientData.referidoPorId && { referidoPorId: clientData.referidoPorId }),
      ...(clientData.notas && { notas: clientData.notas }),
      ...(clientData.fotoUrl && { fotoUrl: clientData.fotoUrl }),
      // Set default values for required fields
      fecha_ingreso: clientData.fechaSuscripcion ? new Date(clientData.fechaSuscripcion) : new Date(),
      // Format date properly if provided
      ...(clientData.fechaSuscripcion && {
        fechaSuscripcion: new Date(clientData.fechaSuscripcion)
      })
    };

    // Validate referidoPorId - if it's not a valid UUID, set it to null
    if (clientData.referidoPorId) {
      dataToCreate.referidoPorId = isValidUUID(clientData.referidoPorId) ? clientData.referidoPorId : null;
    } else {
      dataToCreate.referidoPorId = null;
    }

    // Validate categoria_cliente according to enum
    if (clientData.categoria_cliente && !['NUEVO', 'VIEJO', 'VIP', 'INACTIVO'].includes(clientData.categoria_cliente)) {
      console.warn(`Invalid categoria_cliente value: ${clientData.categoria_cliente}. Setting to NUEVO.`);
      dataToCreate.categoria_cliente = 'NUEVO';
    }

    // Ensure codigoCliente is included in dataToCreate
    dataToCreate.codigoCliente = codigoCliente;

    // Debug: Log the final dataToCreate to see what's being sent
    console.log('=== DEBUG: Final dataToCreate ===');
    console.log('codigoCliente:', dataToCreate.codigoCliente);
    console.log('All fields:', Object.keys(dataToCreate));
    console.log('Full dataToCreate:', JSON.stringify(dataToCreate, null, 2));

    console.log('Creating client with dataToCreate:', JSON.stringify(dataToCreate, null, 2));
    console.log('codigoCliente value:', codigoCliente);
    console.log('codigoCliente in dataToCreate:', dataToCreate.codigoCliente);

    const newClient = await prisma.cliente.create({
      data: dataToCreate,
    });

    console.log('Client created successfully:', newClient.id);

    // Emit real-time event
    if (global.eventSystem) {
      global.eventSystem.emitEntityChange('cliente', 'create', newClient.id, {
        nombre: newClient.nombre,
        apellidos: newClient.apellidos,
        codigoCliente: newClient.codigoCliente
      });
    }

    res.status(201).json(newClient);
  } catch (error) {
    console.error('Error creating client:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    });

    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Client code already exists' });
    } else if (error.code === 'P2025') {
      res.status(404).json({ error: 'Related record not found' });
    } else {
      res.status(500).json({
        error: 'Failed to create client',
        message: error.message,
        details: error.code || 'Unknown error'
      });
    }
  }
});

// Update client
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const clientData = req.body;

    // Format date properly if provided
    const dataToUpdate = {
      ...clientData,
      ...(clientData.fechaSuscripcion && {
        fechaSuscripcion: new Date(clientData.fechaSuscripcion)
      }),
      // Validate referidoPorId - if it's not a valid UUID, set it to null
      ...(clientData.referidoPorId && {
        referidoPorId: isValidUUID(clientData.referidoPorId) ? clientData.referidoPorId : null
      }),
      // If referidoPorId is explicitly set to null or empty, make sure it's null
      ...(clientData.referidoPorId === null || clientData.referidoPorId === '' || clientData.referidoPorId === undefined) && {
        referidoPorId: null
      }
    };

    // Validate categoria_cliente according to enum
    if (dataToUpdate.categoria_cliente && !['NUEVO', 'VIEJO', 'VIP', 'INACTIVO'].includes(dataToUpdate.categoria_cliente)) {
      console.warn(`Invalid categoria_cliente value: ${dataToUpdate.categoria_cliente}. Setting to NUEVO.`);
      dataToUpdate.categoria_cliente = 'NUEVO';
    }

    // Remove the original referidoPorId from clientData to avoid conflicts
    delete dataToUpdate.referidoPorId;

    const updatedClient = await prisma.cliente.update({
      where: { id },
      data: dataToUpdate
    });

    // Emit update event
    if (global.eventSystem) {
      global.eventSystem.emitEntityChange('cliente', 'update', updatedClient.id, {
        nombre: updatedClient.nombre,
        apellidos: updatedClient.apellidos,
        codigoCliente: updatedClient.codigoCliente
      });
    }

    res.json(updatedClient);
  } catch (error) {
    console.error('Error updating client:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Client not found' });
    } else {
      res.status(500).json({ error: 'Failed to update client', message: error.message });
    }
  }
});

// Delete client (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.cliente.update({
      where: { id },
      data: { estado: 'inactivo' }
    });

    // Emit delete event
    if (global.eventSystem) {
      global.eventSystem.emitEntityChange('cliente', 'delete', id);
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting client:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Client not found' });
    } else {
      res.status(500).json({ error: 'Failed to delete client', message: error.message });
    }
  }
});

// Get client subscriptions for invoice creation
router.get('/:clienteId/subscriptions', async (req, res) => {
  try {
    const { clienteId } = req.params;

    const suscripciones = await prisma.suscripcion.findMany({
      where: {
        clienteId,
        estado: 'activo'
      },
      include: {
        servicio: true,
        plan: true
      },
      orderBy: { fechaInicio: 'desc' }
    });

    res.json(suscripciones);
  } catch (error) {
    console.error('Error fetching client subscriptions:', error);
    res.status(500).json({ error: 'Failed to fetch subscriptions', message: error.message });
  }
});

// Get client invoice information
router.get('/:clienteId/facturas-info', async (req, res) => {
  try {
    const { clienteId } = req.params;

    console.log('Fetching invoice info for client:', clienteId);

    // Verificar que el cliente existe
    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId }
    });

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    // Obtener todas las facturas del cliente
    const todasFacturas = await prisma.facturaCliente.findMany({
      where: { clienteId },
      include: {
        pagos: {
          where: { estado: 'confirmado' }
        }
      },
      orderBy: { fechaFactura: 'desc' }
    });

    console.log(`Found ${todasFacturas.length} facturas for client ${clienteId}`);

    // Última factura
    const ultimaFactura = todasFacturas.length > 0 ? todasFacturas[0] : null;

    // Función para calcular si una factura está vencida
    const estaVencida = (factura) => {
      if (!factura.fechaVencimiento) return false;
      const hoy = new Date();
      const vencimiento = new Date(factura.fechaVencimiento);
      return vencimiento < hoy;
    };

    // Función para determinar el estado real de la factura
    const determinarEstadoReal = (factura) => {
      // Si la factura está anulada, ese es su estado real
      if (factura.estado === 'anulada') {
        return 'anulada';
      }

      const montoPagado = factura.pagos.reduce((sum, pago) => sum + Number(pago.monto), 0);
      const total = Number(factura.total);

      if (montoPagado >= total) {
        return 'pagada';
      } else if (montoPagado > 0) {
        return estaVencida(factura) ? 'vencida_parcial' : 'pendiente_parcial';
      } else {
        return estaVencida(factura) ? 'vencida' : 'pendiente';
      }
    };

    // Procesar facturas y determinar cuáles están pendientes o vencidas
    const facturasConEstado = todasFacturas.map(factura => {
      const montoPagado = factura.pagos.reduce((sum, pago) => sum + Number(pago.monto), 0);
      const total = Number(factura.total);
      const montoPendiente = Math.max(0, total - montoPagado);
      const estadoReal = determinarEstadoReal(factura);

      return {
        ...factura,
        montoPagado,
        montoPendiente,
        estadoReal
      };
    });

    // Filtrar facturas pendientes (incluyendo vencidas y parcialmente pagadas)
    const facturasPendientes = facturasConEstado.filter(factura =>
      factura.montoPendiente > 0 &&
      !['pagada', 'cancelada', 'anulada'].includes(factura.estadoReal)
    ).sort((a, b) => {
      // Ordenar por fecha de vencimiento, las vencidas primero
      if (!a.fechaVencimiento && !b.fechaVencimiento) return 0;
      if (!a.fechaVencimiento) return 1;
      if (!b.fechaVencimiento) return -1;
      return new Date(a.fechaVencimiento) - new Date(b.fechaVencimiento);
    });

    // Calcular totales
    const totalPendiente = facturasPendientes.reduce((sum, factura) => sum + factura.montoPendiente, 0);
    const facturasVencidas = facturasPendientes.filter(f => estaVencida(f));
    const totalVencido = facturasVencidas.reduce((sum, factura) => sum + factura.montoPendiente, 0);

    console.log(`Client ${clienteId} - Total facturas: ${todasFacturas.length}, Pendientes: ${facturasPendientes.length}, Vencidas: ${facturasVencidas.length}`);

    const response = {
      ultimaFactura: ultimaFactura ? {
        id: ultimaFactura.id,
        numeroFactura: ultimaFactura.numeroFactura,
        fechaFactura: ultimaFactura.fechaFactura,
        fechaVencimiento: ultimaFactura.fechaVencimiento,
        total: Number(ultimaFactura.total),
        estado: ultimaFactura.estado,
        estadoReal: facturasConEstado[0]?.estadoReal || ultimaFactura.estado,
        montoPagado: facturasConEstado[0]?.montoPagado || 0,
        montoPendiente: facturasConEstado[0]?.montoPendiente || Number(ultimaFactura.total)
      } : null,
      facturasPendientes: facturasPendientes.slice(0, 10).map(factura => ({
        id: factura.id,
        numeroFactura: factura.numeroFactura,
        fechaFactura: factura.fechaFactura,
        fechaVencimiento: factura.fechaVencimiento,
        total: Number(factura.total),
        estado: factura.estado,
        estadoReal: factura.estadoReal,
        montoPagado: factura.montoPagado,
        montoPendiente: factura.montoPendiente,
        diasVencida: factura.fechaVencimiento ? Math.max(0, Math.floor((new Date() - new Date(factura.fechaVencimiento)) / (1000 * 60 * 60 * 24))) : 0
      })),
      resumen: {
        totalFacturas: todasFacturas.length,
        totalFacturasPendientes: facturasPendientes.length,
        totalMontoPendiente: totalPendiente,
        facturasVencidas: facturasVencidas.length,
        totalMontoVencido: totalVencido
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching client invoice info:', error);
    res.status(500).json({ error: 'Failed to fetch invoice info', message: error.message });
  }
});

// Get client statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await prisma.cliente.groupBy({
      by: ['categoria_cliente', 'estado'],
      _count: {
        id: true
      }
    });

    const totalClients = await prisma.cliente.count();
    const activeClients = await prisma.cliente.count({ where: { estado: 'activo' } });

    res.json({
      total: totalClients,
      active: activeClients,
      inactive: totalClients - activeClients,
      byCategory: stats
    });
  } catch (error) {
    console.error('Error fetching client stats:', error);
    res.status(500).json({ error: 'Failed to fetch client stats', message: error.message });
  }
});

// Get dashboard data for clients
router.get('/dashboard/overview', requirePermission('clientes.dashboard'), async (req, res) => {
  try {
    console.log('=== DASHBOARD OVERVIEW ENDPOINT ===');

    // 1. Total clients
    const totalClientes = await prisma.cliente.count();

    // 2. Active clients (case-insensitive)
    const clientesActivos = await prisma.cliente.count({
      where: { 
        estado: {
          in: ['activo', 'Activo', 'ACTIVO']
        }
      }
    });

    // 2b. Inactive/Cancelled clients
    const clientesInactivos = await prisma.cliente.count({
      where: { 
        estado: {
          in: ['inactivo', 'Inactivo', 'INACTIVO', 'cancelado', 'Cancelado', 'CANCELADO']
        }
      }
    });

    // 2c. Total amount for clients with billing day 15
    const montoDia15 = await prisma.suscripcion.aggregate({
      where: {
        diaFacturacion: 15,
        estado: {
          in: ['activo', 'Activo', 'ACTIVO']
        }
      },
      _sum: {
        precioMensual: true
      }
    });

    const totalMontoDia15 = montoDia15._sum.precioMensual || 0;
    console.log('💰 Dashboard - Monto Día 15:', totalMontoDia15);

    // 2d. Total amount for clients with billing day 30, 20, 10
    const montoOtrosDias = await prisma.suscripcion.aggregate({
      where: {
        diaFacturacion: {
          in: [30, 20, 10]
        },
        estado: {
          in: ['activo', 'Activo', 'ACTIVO']
        }
      },
      _sum: {
        precioMensual: true
      }
    });

    const totalMontoOtrosDias = montoOtrosDias._sum.precioMensual || 0;
    console.log('💰 Dashboard - Monto Otros Días:', totalMontoOtrosDias);

    // 3. Active subscriptions
    const suscripcionesActivas = await prisma.suscripcion.count({
      where: { estado: 'activo' }
    });

    // 3b. Total amount of unpaid invoices
    const facturasPendientes = await prisma.facturaCliente.aggregate({
      where: {
        estado: {
          in: ['pendiente', 'Pendiente', 'PENDIENTE', 'parcial', 'Parcial', 'PARCIAL']
        }
      },
      _sum: {
        total: true
      }
    });

    const montoFacturasPorPagar = facturasPendientes._sum.total || 0;

    // 4. Current month revenue (from invoices)
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const revenueResult = await prisma.facturaCliente.aggregate({
      where: {
        fechaFactura: {
          gte: firstDayOfMonth,
          lte: lastDayOfMonth
        }
      },
      _sum: {
        total: true
      }
    });

    const ingresoMesActual = revenueResult._sum.total || 0;

    // 5. Open tickets
    const ticketsAbiertos = await prisma.ticket.count({
      where: { estado: 'abierto' }
    });

    // 6. Client Growth (Last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1); // Start of that month

    const newClients = await prisma.cliente.groupBy({
      by: ['fecha_ingreso'],
      where: {
        fecha_ingreso: {
          gte: sixMonthsAgo
        }
      },
      _count: {
        id: true
      }
    });

    // Process growth data to group by month
    const growthMap = new Map();
    // Initialize last 6 months
    for (let i = 0; i < 6; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const monthName = d.toLocaleString('es-ES', { month: 'short' });
      growthMap.set(key, { month: monthName, nuevos: 0, total: 0 }); // Total will be calculated later if needed
    }

    newClients.forEach(item => {
      const d = new Date(item.fecha_ingreso);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (growthMap.has(key)) {
        const entry = growthMap.get(key);
        entry.nuevos += item._count.id;
      }
    });

    const clientGrowth = Array.from(growthMap.values()).reverse();


    // 7. Revenue Distribution (by Service Type via Invoices)
    // This is complex, so we'll approximate by checking active subscriptions' service types
    // A more accurate way would be joining Invoice -> InvoiceDetail -> Service, but Prisma grouping is limited.
    // Let's use Active Subscriptions count by Service Type as a proxy for "Revenue Source" interest
    const subscriptionsByService = await prisma.suscripcion.findMany({
      where: { estado: 'activo' },
      include: {
        servicio: {
          select: { tipo: true }
        }
      }
    });

    const revenueDistMap = new Map();
    subscriptionsByService.forEach(sub => {
      const type = sub.servicio?.tipo || 'Otros';
      revenueDistMap.set(type, (revenueDistMap.get(type) || 0) + 1);
    });

    const revenueData = Array.from(revenueDistMap.entries()).map(([name, value]) => ({
      name,
      value,
      color: '#' + Math.floor(Math.random() * 16777215).toString(16) // Random color for now, frontend can map it
    }));


    // 8. Top Clients (by Total Revenue)
    // We need to aggregate invoices by client
    const topPayingClients = await prisma.facturaCliente.groupBy({
      by: ['clienteId'],
      _sum: {
        total: true
      },
      orderBy: {
        _sum: {
          total: 'desc'
        }
      },
      take: 5
    });

    // Fetch client details for these top payers
    const topClients = await Promise.all(topPayingClients.map(async (item) => {
      const client = await prisma.cliente.findUnique({
        where: { id: item.clienteId },
        select: { nombre: true, apellidos: true, categoria_cliente: true, estado: true, fotoUrl: true }
      });
      return {
        id: item.clienteId,
        name: client ? `${client.nombre} ${client.apellidos}` : 'Desconocido',
        category: client?.categoria_cliente || 'N/A',
        revenue: item._sum.total,
        status: client?.estado || 'N/A',
        avatar: client?.fotoUrl || null
      };
    }));


    // 9. Recent Transactions (Last 5 Payments)
    const recentPayments = await prisma.pagoCliente.findMany({
      take: 5,
      orderBy: { fechaPago: 'desc' },
      include: {
        cliente: {
          select: { nombre: true, apellidos: true }
        }
      }
    });

    const recentTransactions = recentPayments.map(p => ({
      id: p.id,
      client: p.cliente ? `${p.cliente.nombre} ${p.cliente.apellidos}` : 'Desconocido',
      type: p.metodoPago,
      amount: p.monto,
      date: p.fechaPago,
      status: 'Completado' // Payments in table are usually completed
    }));

    // 10. Recent clients (Last 5 registered clients)
    const recentClients = await prisma.cliente.findMany({
      take: 5,
      orderBy: { fecha_ingreso: 'desc' },
      select: {
        id: true,
        nombre: true,
        apellidos: true,
        email: true,
        telefono: true,
        estado: true,
        categoria_cliente: true,
        fecha_ingreso: true,
        fotoUrl: true
      }
    });

    // Format recent clients for frontend
    const allClients = recentClients.map(client => ({
      id: client.id,
      name: client.nombre,
      nombre: client.nombre,
      apellidos: client.apellidos,
      email: client.email,
      telefono: client.telefono,
      phone: client.telefono,
      status: client.estado,
      estado: client.estado,
      category: client.categoria_cliente,
      categoria: client.categoria_cliente,
      avatar: client.fotoUrl,
      fecha_ingreso: client.fecha_ingreso
    }));

    // 11. Notifications (Mock for now, or fetch recent system events)
    const notifications = [
      { id: 1, message: 'Sistema actualizado correctamente', time: 'Hace 1 hora' }
    ];


    const response = {
      stats: [
        { title: 'Clientes Activos', value: clientesActivos.toString(), change: '+0%', icon: 'Users', color: 'blue', trend: 'up', bgColor: 'from-blue-50 to-blue-100' },
        { title: 'Monto Día 15', value: `$${Number(totalMontoDia15).toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, change: '0%', icon: 'DollarSign', color: 'red', trend: 'neutral', bgColor: 'from-red-50 to-red-100' },
        { title: 'Días 30, 20, 10', value: `$${Number(totalMontoOtrosDias).toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, change: '+0%', icon: 'DollarSign', color: 'green', trend: 'up', bgColor: 'from-green-50 to-green-100' },
        { title: 'Facturas por Pagar', value: `$${Number(montoFacturasPorPagar).toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, change: '+0%', icon: 'FileText', color: 'purple', trend: 'up', bgColor: 'from-purple-50 to-purple-100' },
      ],
      clientGrowth,
      revenueData,
      topClients,
      recentTransactions,
      notifications,
      allClients
    };

    console.log('Dashboard response prepared successfully');
    res.json(response);
  } catch (error) {
    console.error('Error fetching dashboard overview:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard data',
      message: error.message
    });
  }
});

module.exports = router;
