# 🔄 Guía para Integrar Real-Time Updates en Otros DataTables

Esta guía explica cómo replicar la implementación de real-time updates en otros DataTables de tu aplicación.

---

## 📋 Patrón General

### 1. Importar el Hook
```typescript
import { useRealTimeUpdates } from '../hooks/useRealTimeUpdates';
```

### 2. Crear una función de recarga
```typescript
const reloadData = async () => {
  try {
    const response = await serviceName.getAll();
    setDataState(response.data);
  } catch (error) {
    console.error('Error reloading data:', error);
  }
};
```

### 3. Usar el hook
```typescript
useRealTimeUpdates(
  (event) => {
    console.log('Real-time event received:', event);
    if (event.entityType === 'targetEntity') {
      reloadData();
    }
  },
  ['targetEntity']  // Filtrar solo eventos de este tipo
);
```

---

## 🎯 DataTables a Integrar

### 1. **Suscripciones** (`src/pages/Suscripciones.tsx` o similar)

```typescript
import React, { useState, useEffect } from 'react';
import { useRealTimeUpdates } from '../hooks/useRealTimeUpdates';
import { suscripcionService } from '../services/suscripcionService';

const SuscripcionesListado: React.FC = () => {
  const [suscripciones, setSuscripciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSuscripciones = async () => {
      try {
        setLoading(true);
        const response = await suscripcionService.getAll();
        setSuscripciones(response.data);
      } catch (error) {
        console.error('Error fetching suscripciones:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSuscripciones();
  }, []);

  const reloadSuscripciones = async () => {
    try {
      const response = await suscripcionService.getAll();
      setSuscripciones(response.data);
    } catch (error) {
      console.error('Error reloading suscripciones:', error);
    }
  };

  // ✨ Agregar aquí el hook de real-time
  useRealTimeUpdates(
    (event) => {
      console.log('Suscripción event received:', event);
      if (event.entityType === 'suscripcion') {
        reloadSuscripciones();
      }
    },
    ['suscripcion']
  );

  return (
    <div>
      {/* Tu DataTable aquí */}
      <DataTable data={suscripciones} columns={columns} />
    </div>
  );
};

export default SuscripcionesListado;
```

**Eventos que emitirá:**
- ✅ `suscripcion` + `create` - Cuando se agrega nueva suscripción
- ✅ `suscripcion` + `update` - Cuando se edita suscripción
- ✅ `suscripcion` + `delete` - Cuando se elimina suscripción

---

### 2. **Equipos de Clientes** (`src/pages/EquiposClientes.tsx` o similar)

```typescript
const EquiposClientesListado: React.FC = () => {
  const [equipos, setEquipos] = useState<any[]>([]);

  useEffect(() => {
    const fetchEquipos = async () => {
      try {
        const response = await equipoService.getAll();
        setEquipos(response.data);
      } catch (error) {
        console.error('Error fetching equipos:', error);
      }
    };

    fetchEquipos();
  }, []);

  const reloadEquipos = async () => {
    try {
      const response = await equipoService.getAll();
      setEquipos(response.data);
    } catch (error) {
      console.error('Error reloading equipos:', error);
    }
  };

  // ✨ Agregar hook de real-time
  useRealTimeUpdates(
    (event) => {
      if (event.entityType === 'equipo') {
        reloadEquipos();
      }
    },
    ['equipo']
  );

  return <DataTable data={equipos} columns={columns} />;
};
```

**Nota:** Primero necesitas asegurarte de que los endpoints de equipos emitan eventos. Ver sección "Agregar Emisión de Eventos" abajo.

---

### 3. **Servicios** (`src/pages/Servicios.tsx`)

```typescript
const ServiciosListado: React.FC = () => {
  const [servicios, setServicios] = useState<any[]>([]);

  const reloadServicios = async () => {
    try {
      const response = await servicioService.getAll();
      setServicios(response.data);
    } catch (error) {
      console.error('Error reloading servicios:', error);
    }
  };

  useEffect(() => {
    reloadServicios();
  }, []);

  // ✨ Agregar hook
  useRealTimeUpdates(
    (event) => {
      if (event.entityType === 'servicio') {
        reloadServicios();
      }
    },
    ['servicio']
  );

  return <DataTable data={servicios} columns={columns} />;
};
```

---

### 4. **Planes** (`src/pages/Planes.tsx`)

```typescript
const PlanesListado: React.FC = () => {
  const [planes, setPlanes] = useState<any[]>([]);

  const reloadPlanes = async () => {
    try {
      const response = await planService.getAll();
      setPlanes(response.data);
    } catch (error) {
      console.error('Error reloading planes:', error);
    }
  };

  useEffect(() => {
    reloadPlanes();
  }, []);

  // ✨ Agregar hook
  useRealTimeUpdates(
    (event) => {
      if (event.entityType === 'plan') {
        reloadPlanes();
      }
    },
    ['plan']
  );

  return <DataTable data={planes} columns={columns} />;
};
```

---

### 5. **Facturas** (`src/pages/Facturas.tsx` o similar)

```typescript
const FacturasListado: React.FC = () => {
  const [facturas, setFacturas] = useState<any[]>([]);

  const reloadFacturas = async () => {
    try {
      const response = await facturaService.getAll();
      setFacturas(response.data);
    } catch (error) {
      console.error('Error reloading facturas:', error);
    }
  };

  useEffect(() => {
    reloadFacturas();
  }, []);

  // ✨ Agregar hook
  useRealTimeUpdates(
    (event) => {
      if (event.entityType === 'factura') {
        reloadFacturas();
      }
    },
    ['factura']
  );

  return <DataTable data={facturas} columns={columns} />;
};
```

---

### 6. **Tickets** (`src/pages/Tickets.tsx` o similar)

```typescript
const TicketsListado: React.FC = () => {
  const [tickets, setTickets] = useState<any[]>([]);

  const reloadTickets = async () => {
    try {
      const response = await ticketService.getAll();
      setTickets(response.data);
    } catch (error) {
      console.error('Error reloading tickets:', error);
    }
  };

  useEffect(() => {
    reloadTickets();
  }, []);

  // ✨ Agregar hook
  useRealTimeUpdates(
    (event) => {
      if (event.entityType === 'ticket') {
        reloadTickets();
      }
    },
    ['ticket']
  );

  return <DataTable data={tickets} columns={columns} />;
};
```

---

## 🔧 Agregar Emisión de Eventos en Backend

Para que los DataTables reciban actualizaciones, primero debes agregar la emisión de eventos en los endpoints.

### Estructura General en `server/index.js`:

```javascript
// CREAR
app.post('/api/entidades', async (req, res) => {
  try {
    const newEntity = await prisma.entidad.create({ data: req.body });
    
    // ✨ AGREGAR AQUÍ
    if (global.eventSystem) {
      global.eventSystem.emitEntityChange('entidad', 'create', newEntity.id, {
        // Datos adicionales que quieras enviar
      });
    }
    
    res.status(201).json(newEntity);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ACTUALIZAR
app.put('/api/entidades/:id', async (req, res) => {
  try {
    const updatedEntity = await prisma.entidad.update({
      where: { id: req.params.id },
      data: req.body
    });
    
    // ✨ AGREGAR AQUÍ
    if (global.eventSystem) {
      global.eventSystem.emitEntityChange('entidad', 'update', updatedEntity.id, {
        // Datos adicionales
      });
    }
    
    res.json(updatedEntity);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ELIMINAR
app.delete('/api/entidades/:id', async (req, res) => {
  try {
    await prisma.entidad.delete({ where: { id: req.params.id } });
    
    // ✨ AGREGAR AQUÍ
    if (global.eventSystem) {
      global.eventSystem.emitEntityChange('entidad', 'delete', req.params.id);
    }
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## 📝 Checklist de Integración

Para cada DataTable que quieras integrar:

- [ ] 1. Importar hook: `import { useRealTimeUpdates } from '../hooks/useRealTimeUpdates';`
- [ ] 2. Crear función `reloadData()` que recarga desde la API
- [ ] 3. Usar el hook en `useEffect` después de cargar datos
- [ ] 4. Pasar el tipo de entidad correcto en el array de filtrado
- [ ] 5. Verificar que el backend emite eventos para esa entidad
- [ ] 6. Testear: crear/editar/eliminar y verificar que DataTable se actualiza

---

## 🧪 Template Rápido Copiar-Pegar

```typescript
import React, { useState, useEffect } from 'react';
import { useRealTimeUpdates } from '../hooks/useRealTimeUpdates';
import DataTable from '../components/ui/DataTable';

const EntityListado: React.FC = () => {
  const [entities, setEntities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const reloadEntities = async () => {
    try {
      setLoading(true);
      // TODO: Cambiar 'entityService' por el servicio correcto
      const response = await entityService.getAll();
      setEntities(response.data);
    } catch (error) {
      console.error('Error reloading entities:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reloadEntities();
  }, []);

  // ✨ Real-time updates
  useRealTimeUpdates(
    (event) => {
      if (event.entityType === 'entity') {
        reloadEntities();
      }
    },
    ['entity']  // TODO: Cambiar por tipo de entidad correcto
  );

  return (
    <div>
      <h1>Entidades</h1>
      <DataTable data={entities} columns={columns} loading={loading} />
    </div>
  );
};

export default EntityListado;
```

---

## 📊 Estado de Integración

### ✅ Ya Implementado
- Clientes (`ClientesListado.tsx`)
- Suscripciones (emisión en server)

### 🟡 Pendiente - Solo Frontend
- Servicios
- Planes
- Equipos de Clientes
- Facturas
- Tickets

### 🔴 Pendiente - Tanto Backend como Frontend
- Movimientos Contables
- Cajas
- Categorías
- Otros módulos

---

## 🚀 Próximo Paso Rápido

Para integrar cualquier DataTable, sigue estos 3 pasos:

1. **Agregar hook al componente:**
```typescript
useRealTimeUpdates(
  (event) => { if (event.entityType === 'your_entity') reloadData(); },
  ['your_entity']
);
```

2. **Agregar emisión en backend:**
```javascript
if (global.eventSystem) {
  global.eventSystem.emitEntityChange('your_entity', 'create', entity.id, {});
}
```

3. **Testear:**
- Abrir DataTable
- Crear/editar/eliminar desde otra pestaña o aplicación
- Verificar que se actualiza automáticamente

¡Listo! 🎉

