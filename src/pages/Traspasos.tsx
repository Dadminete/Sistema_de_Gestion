import React, { useState, useEffect, useMemo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import DataTable from '../components/feature/DataTable';
import Modal from '../components/feature/Modal';
import { useAuth } from '../context/AuthProvider';
import Swal from 'sweetalert2';
import './Traspasos.css';
import traspasoService, { type Traspaso, type CreateTraspasoData } from '../services/traspasoService';
import { formatearMontoConSigno } from '../utils/montoUtils';
import {
    ArrowRightLeft, Plus, Search, TrendingUp, Building2, Wallet, Edit, Trash2
} from 'lucide-react';

const Traspasos: React.FC = () => {
    const { } = useAuth();
    const [traspasos, setTraspasos] = useState<Traspaso[]>([]);
    const [filterText, setFilterText] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedTraspaso, setSelectedTraspaso] = useState<Traspaso | null>(null);

    // Form state
    const [tipoOrigen, setTipoOrigen] = useState<'caja' | 'banco'>('caja');
    const [tipoDestino, setTipoDestino] = useState<'caja' | 'banco'>('caja');
    const [cajaOrigenId, setCajaOrigenId] = useState('');
    const [bancoOrigenId, setBancoOrigenId] = useState('');
    const [cajaDestinoId, setCajaDestinoId] = useState('');
    const [bancoDestinoId, setBancoDestinoId] = useState('');
    const [monto, setMonto] = useState('');
    const [conceptoTraspaso, setConceptoTraspaso] = useState('');

    // Data state
    const [cajas, setCajas] = useState<any[]>([]);
    const [cuentasBancarias, setCuentasBancarias] = useState<any[]>([]);

    useEffect(() => {
        fetchTraspasos();
        fetchCajasYBancos();
    }, []);

    const fetchTraspasos = async () => {
        try {
            const result = await traspasoService.getAllTraspasos();
            setTraspasos(result.traspasos || []);
        } catch (error: any) {
            console.error('Error fetching traspasos:', error);
            Swal.fire('Error', error.message, 'error');
        }
    };

    // Normaliza los ids para evitar comparaciones fallidas (number vs string)
    const normalizeCajas = (lista: any[]) =>
        lista.map(item => ({ ...item, id: String(item.id) }));

    const normalizeBancos = (lista: any[]) =>
        lista.map(item => ({
            ...item,
            id: String(item.id),
            cuentaContable: item.cuentaContable
                ? {
                    ...item.cuentaContable,
                    saldoActual: Number(item.cuentaContable.saldoActual || 0),
                }
                : undefined,
        }));

    const formatSaldo = (valor: number | string | undefined) =>
        `RD$${parseFloat(valor as any || 0).toFixed(2)}`;

    const fetchCajasYBancos = async () => {
        try {
            const [cajasDataRaw, bancosDataRaw] = await Promise.all([
                traspasoService.getCajasActivas(),
                traspasoService.getCuentasBancariasActivas(),
            ]);

            const cajasData = normalizeCajas(cajasDataRaw);
            const bancosData = normalizeBancos(bancosDataRaw);

            setCajas(cajasData);
            setCuentasBancarias(bancosData);

            // Set default values con ids como string para mantener coincidencia
            if (cajasData.length > 0) {
                setCajaOrigenId(cajasData[0].id);
                setCajaDestinoId(cajasData.length > 1 ? cajasData[1].id : cajasData[0].id);
            }
            if (bancosData.length > 0) {
                setBancoOrigenId(bancosData[0].id);
                setBancoDestinoId(bancosData.length > 1 ? bancosData[1].id : bancosData[0].id);
            }
        } catch (error: any) {
            console.error('Error fetching cajas y bancos:', error);
            Swal.fire('Error', error.message, 'error');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const parsedMonto = parseFloat(monto);
        if (isNaN(parsedMonto) || parsedMonto <= 0) {
            Swal.fire('Error', 'El monto debe ser un número positivo.', 'error');
            return;
        }

        if (!conceptoTraspaso.trim()) {
            Swal.fire('Error', 'El concepto es requerido.', 'error');
            return;
        }

        // Validation: origin and destination can't be the same
        if (tipoOrigen === tipoDestino) {
            if (tipoOrigen === 'caja' && cajaOrigenId === cajaDestinoId) {
                Swal.fire('Error', 'La caja origen y destino no pueden ser la misma.', 'error');
                return;
            }
            if (tipoOrigen === 'banco' && bancoOrigenId === bancoDestinoId) {
                Swal.fire('Error', 'La cuenta bancaria origen y destino no pueden ser la misma.', 'error');
                return;
            }
        }

        setIsLoading(true);

        const traspasoData: CreateTraspasoData = {
            monto: parsedMonto,
            conceptoTraspaso: conceptoTraspaso.trim(),
            tipoOrigen,
            tipoDestino,
            cajaOrigenId: tipoOrigen === 'caja' ? cajaOrigenId : undefined,
            bancoOrigenId: tipoOrigen === 'banco' ? bancoOrigenId : undefined,
            cajaDestinoId: tipoDestino === 'caja' ? cajaDestinoId : undefined,
            bancoDestinoId: tipoDestino === 'banco' ? bancoDestinoId : undefined,
        };

        try {
            if (isEditMode && selectedTraspaso) {
                await traspasoService.updateTraspaso(selectedTraspaso.id, traspasoData);
                Swal.fire('Éxito', 'Traspaso actualizado exitosamente.', 'success');
            } else {
                await traspasoService.createTraspaso(traspasoData);
                Swal.fire('Éxito', 'Traspaso creado exitosamente.', 'success');
            }
            setIsModalOpen(false);
            resetForm();
            fetchTraspasos();
            fetchCajasYBancos(); // Refresh to update balances
        } catch (error: any) {
            console.error('Error saving traspaso:', error);
            Swal.fire('Error', error.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setMonto('');
        setConceptoTraspaso('');
        setTipoOrigen('caja');
        setTipoDestino('caja');
        setIsEditMode(false);
        setSelectedTraspaso(null);
        if (cajas.length > 0) {
            setCajaOrigenId(String(cajas[0].id));
            setCajaDestinoId(cajas.length > 1 ? String(cajas[1].id) : String(cajas[0].id));
        }
        if (cuentasBancarias.length > 0) {
            setBancoOrigenId(String(cuentasBancarias[0].id));
            setBancoDestinoId(
                cuentasBancarias.length > 1
                    ? String(cuentasBancarias[1].id)
                    : String(cuentasBancarias[0].id)
            );
        }
    };

    const handleDelete = async (id: string) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "Esta acción no se puede deshacer. Se revertirán los saldos de las cuentas afectadas.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                setIsLoading(true);
                await traspasoService.deleteTraspaso(id);
                Swal.fire(
                    'Eliminado!',
                    'El traspaso ha sido eliminado.',
                    'success'
                );
                fetchTraspasos();
                fetchCajasYBancos();
            } catch (error: any) {
                console.error('Error deleting traspaso:', error);
                Swal.fire('Error', error.message, 'error');
            } finally {
                setIsLoading(false);
            }
        }
    };

    const openEditModal = (traspaso: Traspaso) => {
        setSelectedTraspaso(traspaso);
        setIsEditMode(true);
        setMonto(traspaso.monto.toString());
        setConceptoTraspaso(traspaso.conceptoTraspaso);

        // Set origen
        if (traspaso.cajaOrigen) {
            setTipoOrigen('caja');
            setCajaOrigenId(String(traspaso.cajaOrigenId));
        } else if (traspaso.cuentaBancariaOrigen) {
            setTipoOrigen('banco');
            setBancoOrigenId(String(traspaso.bancoOrigenId));
        }

        // Set destino
        if (traspaso.cajaDestino) {
            setTipoDestino('caja');
            setCajaDestinoId(String(traspaso.cajaDestinoId));
        } else if (traspaso.cuentaBancariaDestino) {
            setTipoDestino('banco');
            setBancoDestinoId(String(traspaso.bancoDestinoId));
        }

        setIsModalOpen(true);
    };

    const getSaldoOrigen = () => {
        if (tipoOrigen === 'caja') {
            const caja = cajas.find(c => String(c.id) === String(cajaOrigenId));
            return caja?.saldoActual || 0;
        } else {
            const banco = cuentasBancarias.find(b => String(b.id) === String(bancoOrigenId));
            return banco?.cuentaContable?.saldoActual || 0;
        }
    };

    const getSaldoDestino = () => {
        if (tipoDestino === 'caja') {
            const caja = cajas.find(c => String(c.id) === String(cajaDestinoId));
            return caja?.saldoActual || 0;
        } else {
            const banco = cuentasBancarias.find(b => String(b.id) === String(bancoDestinoId));
            return banco?.cuentaContable?.saldoActual || 0;
        }
    };

    const filteredTraspasos = useMemo(() => {
        return traspasos.filter(traspaso => {
            const searchLower = filterText.toLowerCase();
            return (
                traspaso.numeroTraspaso.toLowerCase().includes(searchLower) ||
                traspaso.conceptoTraspaso.toLowerCase().includes(searchLower) ||
                traspaso.cajaOrigen?.nombre.toLowerCase().includes(searchLower) ||
                traspaso.cajaDestino?.nombre.toLowerCase().includes(searchLower) ||
                traspaso.cuentaBancariaOrigen?.bank?.nombre.toLowerCase().includes(searchLower) ||
                traspaso.cuentaBancariaDestino?.bank?.nombre.toLowerCase().includes(searchLower) ||
                traspaso.autorizadoPor?.nombre.toLowerCase().includes(searchLower) ||
                traspaso.autorizadoPor?.apellido.toLowerCase().includes(searchLower)
            );
        });
    }, [traspasos, filterText]);

    const columns: ColumnDef<Traspaso>[] = useMemo(() => [
        {
            accessorKey: 'fechaTraspaso',
            header: 'Fecha',
            cell: ({ row }) => {
                const date = new Date(row.original.fechaTraspaso);
                return date.toLocaleDateString('es-DO', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                });
            },
        },
        {
            accessorKey: 'numeroTraspaso',
            header: 'Número',
            cell: ({ row }) => (
                <span className="numero-traspaso">{row.original.numeroTraspaso}</span>
            ),
        },
        {
            id: 'origen',
            header: 'Origen',
            cell: ({ row }) => {
                if (row.original.cajaOrigen) {
                    return (
                        <div className="cuenta-cell">
                            <Wallet size={16} />
                            <span>{row.original.cajaOrigen.nombre}</span>
                        </div>
                    );
                } else if (row.original.cuentaBancariaOrigen) {
                    return (
                        <div className="cuenta-cell">
                            <Building2 size={16} />
                            <span>
                                {row.original.cuentaBancariaOrigen.bank.nombre} - {row.original.cuentaBancariaOrigen.numeroCuenta}
                            </span>
                        </div>
                    );
                }
                return 'N/A';
            },
        },
        {
            id: 'destino',
            header: 'Destino',
            cell: ({ row }) => {
                if (row.original.cajaDestino) {
                    return (
                        <div className="cuenta-cell">
                            <Wallet size={16} />
                            <span>{row.original.cajaDestino.nombre}</span>
                        </div>
                    );
                } else if (row.original.cuentaBancariaDestino) {
                    return (
                        <div className="cuenta-cell">
                            <Building2 size={16} />
                            <span>
                                {row.original.cuentaBancariaDestino.bank.nombre} - {row.original.cuentaBancariaDestino.numeroCuenta}
                            </span>
                        </div>
                    );
                }
                return 'N/A';
            },
        },
        {
            accessorKey: 'monto',
            header: 'Monto',
            cell: ({ row }) => (
                <span className="monto-cell">
                    {formatearMontoConSigno(row.original.monto, 'ingreso')}
                </span>
            ),
        },
        {
            accessorKey: 'conceptoTraspaso',
            header: 'Concepto',
            cell: ({ row }) => (
                <span className="concepto-cell">{row.original.conceptoTraspaso}</span>
            ),
        },
        {
            id: 'autorizadoPor',
            header: 'Autorizado Por',
            cell: ({ row }) => {
                const usuario = row.original.autorizadoPor;
                return usuario ? `${usuario.nombre} ${usuario.apellido}` : 'N/A';
            },
        },
        {
            accessorKey: 'estado',
            header: 'Estado',
            cell: ({ row }) => (
                <span className={`status-badge ${row.original.estado === 'completado' ? 'success' : 'warning'}`}>
                    {row.original.estado}
                </span>
            ),
        },
        {
            id: 'acciones',
            header: 'Acciones',
            cell: ({ row }) => (
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={() => openEditModal(row.original)}
                        className="btn-icon btn-edit"
                        title="Editar"
                    >
                        <Edit size={16} />
                    </button>
                    <button
                        onClick={() => handleDelete(row.original.id)}
                        className="btn-icon btn-delete"
                        title="Eliminar"
                        style={{ color: '#dc2626' }}
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            ),
        },
    ], []);

    return (
        <div className="traspasos-container">
            {/* Page Header */}
            <div className="page-header">
                <div className="header-content">
                    <h1>
                        <ArrowRightLeft className="icon" size={28} />
                        Traspasos
                    </h1>
                    <p>Transferencias entre cuentas y cajas</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="btn btn-primary btn-lg"
                >
                    <Plus size={18} />
                    Nuevo Traspaso
                </button>
            </div>

            {/* DataTable */}
            <div className="datatable-wrapper">
                <div className="search-container">
                    <Search className="search-icon" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar traspasos..."
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                        className="search-input"
                    />
                </div>

                <DataTable
                    columns={columns}
                    data={filteredTraspasos}
                    filterText={filterText}
                />
            </div>

            {/* Create Traspaso Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    resetForm();
                }}
                title={isEditMode ? 'Editar Traspaso' : 'Nuevo Traspaso'}
                size="lg"
            >
                <form onSubmit={handleSubmit} className="traspaso-form">
                    {/* Row for Origen and Destino */}
                    <div className="form-row-2col">
                        {/* Origen Section */}
                        <div className="form-section">
                            <h3 className="section-title">
                                <TrendingUp size={20} />
                                Cuenta Origen
                            </h3>

                            <div className="form-group">
                                <label htmlFor="tipoOrigen">Tipo de Cuenta</label>
                                <select
                                    id="tipoOrigen"
                                    value={tipoOrigen}
                                    onChange={(e) => setTipoOrigen(e.target.value as 'caja' | 'banco')}
                                    required
                                >
                                    <option value="caja">Caja</option>
                                    <option value="banco">Banco</option>
                                </select>
                            </div>

                            {tipoOrigen === 'caja' ? (
                                <div className="form-group">
                                    <label htmlFor="cajaOrigenId">Seleccionar Caja</label>
                                    <select
                                        id="cajaOrigenId"
                                        value={cajaOrigenId}
                                        onChange={(e) => setCajaOrigenId(e.target.value)}
                                        required
                                    >
                                        {cajas.map(caja => (
                                            <option key={caja.id} value={String(caja.id)}>
                                                {caja.nombre} - Saldo: RD${parseFloat(caja.saldoActual).toFixed(2)}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="saldo-display">
                                        Saldo Disponible: <strong>RD${parseFloat(getSaldoOrigen()).toFixed(2)}</strong>
                                    </div>
                                </div>
                            ) : (
                                <div className="form-group">
                                    <label htmlFor="bancoOrigenId">Seleccionar Cuenta Bancaria</label>
                                    <select
                                        id="bancoOrigenId"
                                        value={bancoOrigenId}
                                        onChange={(e) => setBancoOrigenId(e.target.value)}
                                        required
                                    >
                                        {cuentasBancarias.map(banco => (
                                            <option key={banco.id} value={String(banco.id)}>
                                                {banco.bank.nombre} - {banco.numeroCuenta} - Saldo: {formatSaldo(banco.cuentaContable?.saldoActual)}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="saldo-display">
                                        Saldo Disponible: <strong>RD${parseFloat(getSaldoOrigen()).toFixed(2)}</strong>
                                    </div>
                                </div>
                            )}

                            {/* Monto - Moved here under Origen */}
                            <div className="form-group">
                                <label htmlFor="monto">Monto del Traspaso</label>
                                <input
                                    type="number"
                                    id="monto"
                                    value={monto}
                                    onChange={(e) => setMonto(e.target.value)}
                                    min="0.01"
                                    step="0.01"
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                        </div>

                        {/* Destino Section */}
                        <div className="form-section">
                            <h3 className="section-title">
                                <ArrowRightLeft size={20} />
                                Cuenta Destino
                            </h3>

                            <div className="form-group">
                                <label htmlFor="tipoDestino">Tipo de Cuenta</label>
                                <select
                                    id="tipoDestino"
                                    value={tipoDestino}
                                    onChange={(e) => setTipoDestino(e.target.value as 'caja' | 'banco')}
                                    required
                                >
                                    <option value="caja">Caja</option>
                                    <option value="banco">Banco</option>
                                </select>
                            </div>

                            {tipoDestino === 'caja' ? (
                                <div className="form-group">
                                    <label htmlFor="cajaDestinoId">Seleccionar Caja</label>
                                    <select
                                        id="cajaDestinoId"
                                        value={cajaDestinoId}
                                        onChange={(e) => setCajaDestinoId(e.target.value)}
                                        required
                                    >
                                        {cajas.map(caja => (
                                            <option key={caja.id} value={String(caja.id)}>
                                                {caja.nombre} - Saldo: RD${parseFloat(caja.saldoActual).toFixed(2)}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="saldo-display">
                                        Saldo Actual: <strong>RD${parseFloat(getSaldoDestino()).toFixed(2)}</strong>
                                    </div>
                                </div>
                            ) : (
                                <div className="form-group">
                                    <label htmlFor="bancoDestinoId">Seleccionar Cuenta Bancaria</label>
                                    <select
                                        id="bancoDestinoId"
                                        value={bancoDestinoId}
                                        onChange={(e) => setBancoDestinoId(e.target.value)}
                                        required
                                    >
                                        {cuentasBancarias.map(banco => (
                                            <option key={banco.id} value={String(banco.id)}>
                                                {banco.bank.nombre} - {banco.numeroCuenta} - Saldo: {formatSaldo(banco.cuentaContable?.saldoActual)}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="saldo-display">
                                        Saldo Actual: <strong>RD${parseFloat(getSaldoDestino()).toFixed(2)}</strong>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Concepto - Full Width Below */}
                    <div className="form-group" style={{ order: 999 }}>
                        <label htmlFor="conceptoTraspaso">Concepto del Traspaso</label>
                        <textarea
                            id="conceptoTraspaso"
                            value={conceptoTraspaso}
                            onChange={(e) => setConceptoTraspaso(e.target.value)}
                            rows={3}
                            placeholder="Describe el motivo del traspaso..."
                            required
                        />
                    </div>

                    {/* Submit Buttons - Moved inside form */}
                    <div className="modal-actions">
                        <button
                            type="button"
                            onClick={() => {
                                setIsModalOpen(false);
                                resetForm();
                            }}
                            className="btn btn-secondary"
                            disabled={isLoading}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isLoading}
                        >
                            {isLoading ? (isEditMode ? 'Actualizando...' : 'Creando...') : (isEditMode ? 'Actualizar Traspaso' : 'Crear Traspaso')}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Traspasos;
