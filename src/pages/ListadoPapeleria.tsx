import React, { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getVentas, deleteVenta, type VentaPapeleria } from '@/services/papeleriaApi';
import DataTable from '@/components/ui/DataTable';
import VentaEditModal from '@/components/ui/VentaEditModal';
import toast from 'react-hot-toast';
import { FaPrint } from 'react-icons/fa'; // Import FaPrint icon
import Swal from 'sweetalert2'; // Import SweetAlert2 for potential print confirmations
import './ListadoPapeleria.css';
import { useAuth } from '@/context/AuthProvider'; // Needed for user info in ticket

// Utility function to format numbers as currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const ListadoPapeleria: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [editingVentaId, setEditingVentaId] = useState<string | null>(null);

  useEffect(() => {
    const ventaIdFromUrl = searchParams.get('edit');
    if (ventaIdFromUrl) {
      setEditingVentaId(ventaIdFromUrl);
      // Clean up the URL parameter after opening the modal
      searchParams.delete('edit');
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);

  const { data: ventas, isLoading, error } = useQuery<VentaPapeleria[]>({
    queryKey: ['ventasPapeleria'],
    queryFn: () => getVentas().then(res => res.data),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Log ventas data to console for debugging
  console.log("Ventas fetched for DataTable:", ventas);
  if (error) {
    console.error("Error fetching ventas:", error);
  }

  // Transform ventas data to show products sold
  const productosVendidos = useMemo(() => {
    if (!ventas) return [];

    const productosMap = new Map<string, {
      productoId: number;
      nombreProducto: string;
      cantidadTotal: number;
      ventasCount: number;
      precioUnitario: number;
      fechaUltimaVenta: string;
      ventaId: string;
      numeroVenta: string;
    }>();

    ventas.forEach(venta => {
      venta.detalles.forEach((detalle: {
        productoId: number;
        nombreProducto?: string;
        cantidad: number;
        precioUnitario: number;
      }) => {
        const key = `${detalle.productoId}-${detalle.nombreProducto || 'Producto sin nombre'}`;
        if (productosMap.has(key)) {
          productosMap.get(key)!.cantidadTotal += detalle.cantidad;
          productosMap.get(key)!.ventasCount += 1;
        } else {
          productosMap.set(key, {
            productoId: detalle.productoId,
            nombreProducto: detalle.nombreProducto || 'Producto sin nombre',
            cantidadTotal: detalle.cantidad,
            ventasCount: 1,
            precioUnitario: Number(detalle.precioUnitario),
            fechaUltimaVenta: venta.fechaVenta,
            ventaId: venta.id,
            numeroVenta: venta.numeroVenta,
          });
        }
      });
    });

    const productos = Array.from(productosMap.values());
    return productos.sort((a, b) => a.nombreProducto.localeCompare(b.nombreProducto, 'es'));
  }, [ventas]);

  console.log("Productos vendidos processed:", productosVendidos);

  const deleteMutation = useMutation({
    mutationFn: deleteVenta,
    onSuccess: () => {
      toast.success('Venta eliminada con éxito');
      queryClient.invalidateQueries({ queryKey: ['ventasPapeleria'] });
    },
    onError: (error) => {
      toast.error(`Error al eliminar la venta: ${error.message}`);
    },
  });

  const handleEdit = (ventaId: string) => {
    setEditingVentaId(ventaId);
  };

  const handleDelete = async (ventaId: string) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Estás seguro de que quieres eliminar esta venta? Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      deleteMutation.mutate(ventaId);
    }
  };

  const { user } = useAuth(); // Get user from auth context

  const printTicket = (venta: VentaPapeleria) => {
    if (!user) {
      Swal.fire('Error', 'No se pudo obtener la información del usuario para imprimir el ticket.', 'error');
      return;
    }

    console.log("Printing ticket for venta:", venta); // Log the venta object

    const ticketContent = `
      <div class="ticket">
          <h2>Papeleria Copias & Mas</h2>
          <p>Fecha: ${new Date(venta.fechaVenta).toLocaleString()}</p>
          <p>Usuario: ${user?.nombre || 'N/A'}</p>
          <p>Cliente: ${venta.clienteNombre}</p>
          <hr>
          <table>
              <thead>
                  <tr>
                      <th>Cant.</th>
                      <th>Producto</th>
                      <th>Precio</th>
                      <th>Total</th>
                  </tr>
              </thead>
              <tbody>
                  ${venta.detalles?.map(item => `
                      <tr>
                          <td>${item.cantidad}</td>
                          <td>${item.nombreProducto || 'N/A'}</td> <!-- Use nombreProducto -->
                          <td>$${Number(item.precioUnitario).toFixed(2)}</td>
                          <td>$${(item.cantidad * Number(item.precioUnitario)).toFixed(2)}</td>
                      </tr>
                  `).join('') || '<tr><td colspan="4">No hay productos en esta venta</td></tr>'}
              </tbody>
          </table>
          <hr>
          <p><strong>Subtotal:</strong> $${Number(venta.subtotal || 0).toFixed(2)}</p>
          <p><strong>Descuento:</strong> $${Number(venta.descuentos ?? 0).toFixed(2)}</p>
          <p><strong>Total:</strong> $${Number(venta.total || 0).toFixed(2)}</p>
          <div class="ticket-actions">
            <button onclick="window.print()" class="print-button">Imprimir</button>
            <button onclick="window.close()" class="close-button">Salir</button>
          </div>
      </div>
    `;

    const printWindow = window.open('', '', 'height=600,width=800');
    if (printWindow) {
        printWindow.document.write('<html><head><title>Ticket de Venta</title>');
        printWindow.document.write('<link rel="stylesheet" href="/src/pages/Ticket.css">'); // Link to the existing Ticket.css
        printWindow.document.write('<style>');
        printWindow.document.write(`
            body { font-family: 'Courier New', Courier, monospace; color: #000; background: #fff; margin: 0; padding: 0; }
            .ticket { width: 300px; margin: 10px auto; padding: 10px; border: 1px dashed #000; font-size: 12px; }
            .ticket h2 { text-align: center; margin-bottom: 10px; font-size: 16px; }
            .ticket p { margin: 2px 0; }
            .ticket hr { border: 0; border-top: 1px dashed #000; margin: 10px 0; }
            .ticket table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            .ticket th, .ticket td { padding: 5px 0; text-align: left; border-bottom: 1px dotted #ccc; }
            .ticket th:nth-child(1), .ticket td:nth-child(1) { width: 15%; } /* Cant. */
            .ticket th:nth-child(2), .ticket td:nth-child(2) { width: 50%; } /* Producto */
            .ticket th:nth-child(3), .ticket td:nth-child(3) { width: 15%; text-align: right; } /* Precio */
            .ticket th:nth-child(4), .ticket td:nth-child(4) { width: 20%; text-align: right; } /* Total */
            .ticket .summary-row { display: flex; justify-content: space-between; margin-top: 5px; }
            .ticket .total-amount { font-size: 14px; font-weight: bold; }
            .ticket-actions { display: flex; justify-content: space-around; margin-top: 20px; }
            .ticket-actions button { padding: 10px 15px; border: 1px solid #ccc; border-radius: 5px; cursor: pointer; }
            @media print {
                .ticket-actions { display: none; } /* Hide buttons when printing */
            }
        `);
        printWindow.document.write('</style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write(ticketContent);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        printWindow.onload = () => {
            // No automatic print here, let the user click the button
        };
    }
  };

  const columns = useMemo(() => [
    {
      accessorKey: 'nombreProducto',
      header: 'Producto',
      cell: (info: any) => info.getValue() || 'Producto sin nombre',
    },
    {
      accessorKey: 'cantidadTotal',
      header: 'Cantidad Vendida',
      cell: (info: any) => info.getValue(),
    },
    {
      accessorKey: 'precioUnitario',
      header: 'Precio Unitario',
      cell: (info: any) => formatCurrency(Number(info.getValue())),
    },
    {
      accessorKey: 'ventasCount',
      header: 'N° de Ventas',
      cell: (info: any) => info.getValue(),
    },
    {
      accessorKey: 'fechaUltimaVenta',
      header: 'Última Venta',
      cell: (info: any) => new Date(info.getValue() as string).toLocaleDateString(),
    },
    {
      id: 'totalVendido',
      header: 'Total Vendido',
      cell: ({ row }: any) => {
        const cantidad = row.original.cantidadTotal;
        const precio = row.original.precioUnitario;
        return formatCurrency(cantidad * precio);
      },
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }: any) => (
        <div className="table-actions">
          <button
            onClick={() => handleEdit(row.original.ventaId)}
            className="action-btn edit-btn"
            title="Ver Venta"
          >
            <span className="material-icons">visibility</span>
          </button>
          <button
            onClick={() => {
              const ventaCompleta = ventas?.find(v => v.id === row.original.ventaId);
              if (ventaCompleta) {
                printTicket(ventaCompleta);
              } else {
                toast.error('No se pudo encontrar la información completa de la venta');
              }
            }}
            className="action-btn print-btn"
            title="Imprimir Ticket"
          >
            <FaPrint />
          </button>
        </div>
      ),
    },
  ], [printTicket, ventas]);

  return (
    <div className="dashboard-layout">
      {editingVentaId && (
        <VentaEditModal 
          ventaId={editingVentaId} 
          onClose={() => setEditingVentaId(null)} 
        />
      )}

      <header className="dashboard-header">
        <div className="header-left">
          <h1>Listado de Ventas</h1>
          <p>Gestiona las ventas de tu papelería.</p>
        </div>
      </header>
      
      {isLoading ? (
        <div className="loading-message" style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Cargando productos vendidos...</p>
        </div>
      ) : error ? (
        <div className="error-message" style={{ textAlign: 'center', padding: '2rem', color: 'red' }}>
          <p>Error al cargar las ventas: {error.message}</p>
        </div>
      ) : productosVendidos.length === 0 ? (
        <div className="no-data-message" style={{ textAlign: 'center', padding: '2rem' }}>
          <p>No hay productos vendidos para mostrar.</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={productosVendidos}
        />
      )}
    </div>
  );
};

export default ListadoPapeleria;
