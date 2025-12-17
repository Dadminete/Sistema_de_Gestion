import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ProductoPapeleria, ClientePapeleria, VentaPapeleria } from '@/services/papeleriaApi';
import { getProductos, getClientes, createVenta } from '@/services/papeleriaApi';
import Swal from 'sweetalert2';
import { Search, ShoppingCart, Trash2, User, Printer, Eraser } from 'lucide-react';
import './POS.css';
import { useAuth } from '@/context/AuthProvider';
import './Ticket.css';

interface CartItem {
    product: ProductoPapeleria;
    quantity: number;
}

const DEFAULT_CLIENT: ClientePapeleria = {
    id: 'generic-client-id', // A unique ID for the generic client
    nombre: 'Consumidor',
    apellido: 'Final',
    cedula: undefined,
    telefono: undefined,
    email: undefined,
};

const Papeleria: React.FC = () => {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const [productSearch, setProductSearch] = useState('');
    const [clientSearch, setClientSearch] = useState('');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [selectedClient, setSelectedClient] = useState<ClientePapeleria | null>(DEFAULT_CLIENT);
    const [discount, setDiscount] = useState(0); // New state for discount
    const [amountPaid, setAmountPaid] = useState(0); // New state for amount paid

    const { data: productos, isLoading: isLoadingProductos } = useQuery({
        queryKey: ['productosPapeleria'],
        queryFn: () => getProductos().then(res => res.data),
        staleTime: 1000 * 60 * 5, // 5 minutos
    });

    const { data: clientes, isLoading: isLoadingClientes } = useQuery({
        queryKey: ['clientesPapeleria'],
        queryFn: () => getClientes().then(res => res.data),
        staleTime: 1000 * 60 * 5,
    });

    const filteredProducts = useMemo(() => {
        if (!productos) return [];
        if (!productSearch) return [];
        return productos.filter(p =>
            p.nombre.toLowerCase().includes(productSearch.toLowerCase()) ||
            p.codigo.toLowerCase().includes(productSearch.toLowerCase())
        ).slice(0, 10);
    }, [productos, productSearch]);

    const filteredClients = useMemo(() => {
        if (!clientes) return [];
        if (!clientSearch) return [];
        return clientes.filter(c =>
            c.nombre.toLowerCase().includes(clientSearch.toLowerCase()) ||
            (c.cedula && c.cedula.includes(clientSearch))
        ).slice(0, 5);
    }, [clientes, clientSearch]);

    const handleQuantityChange = (productId: number, newQuantity: number) => {
        setCart(currentCart => {
            const itemInCart = currentCart.find(item => item.product.id === productId);
            if (newQuantity > (itemInCart?.product.stockActual ?? 0)) {
                Swal.fire('Error', 'No hay suficiente stock disponible.', 'error');
                return currentCart;
            }
            if (newQuantity <= 0) {
                return currentCart.filter(item => item.product.id !== productId);
            }
            return currentCart.map(item =>
                item.product.id === productId ? { ...item, quantity: newQuantity } : item
            );
        });
    };

    const addToCart = (product: ProductoPapeleria) => {
        setCart(currentCart => {
            const itemInCart = currentCart.find(item => item.product.id === product.id);
            if (itemInCart) {
                if (itemInCart.quantity + 1 > product.stockActual) {
                    Swal.fire('Error', 'No hay suficiente stock disponible.', 'error');
                    return currentCart;
                }
                return currentCart.map(item =>
                    item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            } else {
                if (1 > product.stockActual) {
                    Swal.fire('Error', 'No hay suficiente stock disponible.', 'error');
                    return currentCart;
                }
                return [...currentCart, { product, quantity: 1 }];
            }
        });
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: `${product.nombre} añadido al carrito.`,
            showConfirmButton: false,
            timer: 1500
        });
    };

    const removeFromCart = (productId: number) => {
        setCart(currentCart => currentCart.filter(item => item.product.id !== productId));
    };

    const cartSubtotal = useMemo(() => {
        return cart.reduce((total, item) => total + Number(item.product.precioVenta) * item.quantity, 0);
    }, [cart]);

    const cartTotal = useMemo(() => {
        return Math.max(0, cartSubtotal - discount); // Apply discount, ensure total doesn't go negative
    }, [cartSubtotal, discount]);

    const change = useMemo(() => {
        return amountPaid - cartTotal;
    }, [amountPaid, cartTotal]);

    const saleMutation = useMutation({
        mutationFn: createVenta,
        onSuccess: (response) => {
            Swal.fire('Éxito', 'Venta completada con éxito', 'success');
            setCart([]);
            setSelectedClient(DEFAULT_CLIENT); // Reset to generic client
            queryClient.invalidateQueries({ queryKey: ['productosPapeleria'] });
            return response;
        },
        onError: (error: { response?: { data?: { message?: string } }; message?: string }) => {
            console.error('Error al crear la venta:', error.response?.data || error.message); // Log full error response
            Swal.fire('Error', `Error al crear la venta: ${error.response?.data?.message || error.message}`, 'error');
        }
    });

    const handleCompleteSale = (andPrint = false) => {
        if (!user) {
            Swal.fire('Error', 'Debes iniciar sesión para realizar una venta.', 'error');
            return;
        }

        if (cart.length === 0) {
            Swal.fire('Error', 'El carrito está vacío.', 'error');
            return;
        }

        Swal.fire({
            title: '¿Confirmar Venta?',
            html: `
                <p><strong>Cliente:</strong> ${selectedClient?.nombre} ${selectedClient?.apellido || ''}</p>
                <hr>
                <h3>Detalles de la Venta:</h3>
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
                        ${cart.map(item => `
                            <tr>
                                <td>${item.quantity}</td>
                                <td>${item.product.nombre}</td>
                                <td>$${Number(item.product.precioVenta).toFixed(2)}</td>
                                <td>$${(item.quantity * Number(item.product.precioVenta)).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <hr>
                <p><strong>Subtotal:</strong> $${cartSubtotal.toFixed(2)}</p>
                <p><strong>Descuento:</strong> $${discount.toFixed(2)}</p>
                <p><strong>Total a Pagar:</strong> $${cartTotal.toFixed(2)}</p>
                <p><strong>Monto Pagado:</strong> $${amountPaid.toFixed(2)}</p>
                <p><strong>Cambio:</strong> $${change.toFixed(2)}</p>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, completar venta',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                // Derive client fields
                const clienteNombre =
                    selectedClient && selectedClient.id !== 'generic-client-id'
                        ? `${selectedClient.nombre} ${selectedClient.apellido}`
                        : 'Consumidor Final';

                const clienteCedula =
                    selectedClient && selectedClient.id !== 'generic-client-id'
                        ? selectedClient.cedula
                        : undefined;

                const ventaData = {
                    numeroVenta: `VENTA-${Date.now()}`, // Generate a unique sale number
                    usuarioId: user.id,
                    clienteNombre,
                    clienteCedula,
                    fechaVenta: new Date().toISOString(),
                    subtotal: Number(cartSubtotal.toFixed(2)), // Ensure proper decimal formatting
                    descuentos: Number(discount.toFixed(2)), // Ensure proper decimal formatting
                    total: Number(cartTotal.toFixed(2)), // Ensure proper decimal formatting
                    metodoPago: 'Efectivo', // TODO: Implement payment method selection
                    estado: 'completada', // Explicitly send estado, matching Prisma default
                    moneda: 'DOP', // Explicitly send moneda, matching Prisma default
                    detalles: cart.map(item => ({
                        productoId: item.product.id,
                        nombreProducto: item.product.nombre, // Include product name
                        cantidad: item.quantity,
                        precioUnitario: Number(Number(item.product.precioVenta || 0).toFixed(2)), // Convert back to number
                    })),
                };

                // Trigger the mutation to create the sale
                saleMutation.mutate(ventaData, {
                    onSuccess: (response) => {
                        if (andPrint) {
                            printTicket(response.data);
                        }
                    }
                });
            }
        });
    };

    const handleClearCart = () => {
        Swal.fire({
            title: '¿Estás seguro?',
            text: "Esta acción vaciará el carrito.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, vaciar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                setCart([]);
                Swal.fire('Vaciado', 'El carrito ha sido vaciado.', 'success');
            }
        })
    };

    const printTicket = (venta: VentaPapeleria) => {
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
                        ${cart.map(item => `
                            <tr>
                                <td>${item.quantity}</td>
                                <td>${item.product.nombre}</td>
                                <td>$${Number(item.product.precioVenta).toFixed(2)}</td>
                                <td>$${(item.quantity * Number(item.product.precioVenta)).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <hr>
                <p><strong>Subtotal:</strong> $${Number(venta.subtotal).toFixed(2)}</p>
                <p><strong>Descuento:</strong> $${Number(venta.descuentos ?? 0).toFixed(2)}</p>
                <p><strong>Total:</strong> $${Number(venta.total).toFixed(2)}</p>
            </div>
        `;

        const printWindow = window.open('', '', 'height=600,width=800');
        if (printWindow) {
            printWindow.document.write('<html><head><title>Ticket de Venta</title>');
            printWindow.document.write('<link rel="stylesheet" href="Ticket.css">');
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
            `);
            printWindow.document.write('</style>');
            printWindow.document.write('</head><body>');
            printWindow.document.write(ticketContent);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.focus(); // Focus the new window
            printWindow.onload = () => { // Ensure content is loaded before printing
                printWindow.print();
            };
        }
    };

    return (
        <div className="pos-layout">
            <div className="pos-products-panel">
                <header className="pos-header">
                    <h1>Ventas de Papelería</h1>
                    <p>Punto de venta y gestión de la papelería.</p>
                </header>
                <div className="pos-search-bar">
                    <Search className="search-icon" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar producto por nombre o código..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                    />
                </div>
                <div className="pos-product-list">
                    {isLoadingProductos && <p>Cargando productos...</p>}
                    {productSearch && filteredProducts.map(product => (
                        <div key={product.id} className="product-item" onClick={() => addToCart(product)}>
                            {/* Assuming product.imagen exists, otherwise use a placeholder */}
                            <img
                                src={product.imagen || '/src/assets/images/placeholder.jpg'}
                                alt={product.nombre}
                                className="product-item-image"
                            />
                            <div className="product-item-info">
                                <span className="product-item-name">{product.nombre}</span>
                                <span className="product-item-code">Cód: {product.codigo}</span>
                                <span className="product-item-stock">Stock: {product.stockActual}</span> {/* Display stock */}
                                <span className="product-item-price">${Number(product.precioVenta).toFixed(2)}</span>
                            </div>
                        </div>
                    ))}
                    {productSearch && filteredProducts.length === 0 && !isLoadingProductos && (
                        <p className="no-results">No se encontraron productos.</p>
                    )}
                </div>
            </div>
            <div className="pos-cart-panel">
                <div className="cart-header">
                    <h2><ShoppingCart size={20} /> Carrito</h2>
                </div>
                <div className='client-section'>
                    <div className="pos-search-bar client-search-bar">
                        <User className="search-icon" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar cliente..."
                            value={clientSearch}
                            onChange={(e) => setClientSearch(e.target.value)}
                        />
                    </div>
                    {clientSearch && (
                        <div className="client-results">
                            {isLoadingClientes && <p>Buscando...</p>}
                            {filteredClients.map(client => (
                                <div key={client.id} className="client-item" onClick={() => { setSelectedClient(client); setClientSearch(''); }}>
                                    {client.nombre} {client.apellido}
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="selected-client-info">
                        {selectedClient && selectedClient.id !== 'generic-client-id' ? (
                            <>
                                <span>{selectedClient.nombre} {selectedClient.apellido}</span>
                                <button onClick={() => setSelectedClient(DEFAULT_CLIENT)}>Cambiar</button>
                            </>
                        ) : <span>Consumidor Final</span>}
                    </div>
                </div>
                <div className="cart-items">
                    {cart.length === 0 ? (
                        <p className="empty-cart">El carrito está vacío.</p>
                    ) : (
                        cart.map(item => (
                            <div key={item.product.id} className="cart-item">
                                <div className="cart-item-info">
                                    <span className="item-name">{item.product.nombre}</span>
                                    <span className="item-price">${Number(item.product.precioVenta || 0).toFixed(2)}</span>
                                </div>
                                <div className="cart-item-controls">
                                    <input
                                        type="number"
                                        className="item-quantity"
                                        value={item.quantity}
                                        onChange={(e) => handleQuantityChange(item.product.id, parseInt(e.target.value, 10))}
                                        min="1"
                                        max={item.product.stockActual}
                                    />
                                    <button onClick={() => removeFromCart(item.product.id)} className="btn-remove-item">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <div className="cart-summary">
                    <div className="summary-row">
                        <span>Subtotal:</span>
                        <span>${cartSubtotal.toFixed(2)}</span>
                    </div>
                    <div className="summary-row">
                        <span>Descuento:</span>
                        <input
                            type="number"
                            value={discount}
                            onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                            min="0"
                            className="discount-input"
                        />
                    </div>
                    <div className="summary-row">
                        <span>Total:</span>
                        <span className="total-amount">${cartTotal.toFixed(2)}</span>
                    </div>
                    <div className="summary-row">
                        <span>Monto Pagado:</span>
                        <input
                            type="number"
                            value={amountPaid}
                            onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                            min="0"
                            className="amount-paid-input"
                        />
                    </div>
                    <div className="summary-row">
                        <span>Cambio:</span>
                        <span>${change.toFixed(2)}</span>
                    </div>
                </div>
                <div className="cart-actions">
                    <button className="btn-clear-cart" onClick={handleClearCart} disabled={cart.length === 0}>
                        <Eraser size={16} /> Limpiar Carrito
                    </button>
                    <button className="btn-print-sale" onClick={() => handleCompleteSale(true)} disabled={cart.length === 0 || saleMutation.isPending}>
                        <Printer size={16} /> Imprimir
                    </button>
                    <button className="btn-complete-sale" onClick={() => handleCompleteSale(false)} disabled={cart.length === 0 || saleMutation.isPending}>
                        {saleMutation.isPending ? 'Procesando...' : 'Procesar Venta'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Papeleria;
