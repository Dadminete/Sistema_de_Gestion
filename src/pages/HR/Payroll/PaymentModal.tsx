import React, { useState, useEffect } from 'react';
import { X, DollarSign, Building2, Wallet, AlertCircle } from 'lucide-react';
import { getBanks, type CuentaBancaria } from '../../../services/bankService';

interface PaymentModalProps {
    payroll: any;
    onClose: () => void;
    onConfirm: (paymentData: any) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ payroll, onClose, onConfirm }) => {
    const [paymentMethod, setPaymentMethod] = useState<'BANCO' | 'CAJA' | 'MIXTO'>('BANCO');
    const [montoBanco, setMontoBanco] = useState('');
    const [montoCaja, setMontoCaja] = useState('');
    const [numeroTransaccion, setNumeroTransaccion] = useState('');
    const [cuentaBancariaId, setCuentaBancariaId] = useState('');
    const [cuentasBancarias, setCuentasBancarias] = useState<CuentaBancaria[]>([]);
    const [loadingAccounts, setLoadingAccounts] = useState(true);

    const salarioNeto = parseFloat(payroll.salarioNeto);

    // Fetch bank accounts
    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                const banks = await getBanks();
                const allAccounts: CuentaBancaria[] = [];
                banks.forEach(bank => {
                    if (bank.cuentas) {
                        bank.cuentas.forEach(cuenta => {
                            allAccounts.push({
                                ...cuenta,
                                bank: bank
                            });
                        });
                    }
                });
                setCuentasBancarias(allAccounts.filter(c => c.activo));
                if (allAccounts.length > 0) {
                    setCuentaBancariaId(allAccounts[0].id);
                }
            } catch (error) {
                console.error('Error fetching bank accounts:', error);
            } finally {
                setLoadingAccounts(false);
            }
        };
        fetchAccounts();
    }, []);

    useEffect(() => {
        // Auto-fill amounts based on payment method
        if (paymentMethod === 'BANCO') {
            setMontoBanco(salarioNeto.toFixed(2));
            setMontoCaja('0');
        } else if (paymentMethod === 'CAJA') {
            setMontoBanco('0');
            setMontoCaja(salarioNeto.toFixed(2));
        } else {
            // MIXTO - keep manual values or split 50/50 if empty
            if (!montoBanco && !montoCaja) {
                const half = (salarioNeto / 2).toFixed(2);
                setMontoBanco(half);
                setMontoCaja(half);
            }
        }
    }, [paymentMethod, salarioNeto]);

    const handleBancoChange = (value: string) => {
        setMontoBanco(value);
        if (paymentMethod === 'MIXTO') {
            const banco = parseFloat(value) || 0;
            const remaining = salarioNeto - banco;
            setMontoCaja(remaining > 0 ? remaining.toFixed(2) : '0');
        }
    };

    const handleCajaChange = (value: string) => {
        setMontoCaja(value);
        if (paymentMethod === 'MIXTO') {
            const caja = parseFloat(value) || 0;
            const remaining = salarioNeto - caja;
            setMontoBanco(remaining > 0 ? remaining.toFixed(2) : '0');
        }
    };

    const total = (parseFloat(montoBanco) || 0) + (parseFloat(montoCaja) || 0);
    const isValid = Math.abs(total - salarioNeto) < 0.01;
    const needsBankAccount = (paymentMethod === 'BANCO' || paymentMethod === 'MIXTO') && parseFloat(montoBanco) > 0;

    const handleSubmit = () => {
        if (!isValid) {
            alert('El total de los pagos debe ser igual al salario neto');
            return;
        }

        if (needsBankAccount && !cuentaBancariaId) {
            alert('Debe seleccionar una cuenta bancaria');
            return;
        }

        onConfirm({
            formaPago: paymentMethod,
            montoBanco: parseFloat(montoBanco) || 0,
            montoCaja: parseFloat(montoCaja) || 0,
            cuentaBancariaId: needsBankAccount ? cuentaBancariaId : null,
            numeroTransaccion: numeroTransaccion || null,
            fechaPago: new Date().toISOString().split('T')[0]
        });
    };

    return (
        <div className="glass-modal-overlay" onClick={onClose}>
            <div className="glass-modal" onClick={(e) => e.stopPropagation()}>
                <div className="glass-modal-header">
                    <div>
                        <h2 className="glass-modal-title">Registrar Pago de Nómina</h2>
                        <p className="text-sm text-gray-400 mt-1">
                            {payroll.empleado.nombres} {payroll.empleado.apellidos} - {new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(salarioNeto)}
                        </p>
                    </div>
                    <button onClick={onClose} className="glass-modal-close">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="glass-modal-body">
                    {/* Payment Method Selection */}
                    <div className="mb-6">
                        <label className="glass-label mb-3 block">Método de Pago</label>
                        <div className="grid grid-cols-3 gap-3">
                            <button
                                type="button"
                                className={`p-4 rounded-xl border-2 transition-all ${paymentMethod === 'BANCO'
                                    ? 'border-blue-500 bg-blue-500/10'
                                    : 'border-gray-300 hover:border-blue-400 bg-white hover:bg-blue-50'
                                    }`}
                                style={{
                                    borderColor: paymentMethod === 'BANCO' ? '#3b82f6' : '#d1d5db',
                                    backgroundColor: paymentMethod === 'BANCO' ? 'rgba(59, 130, 246, 0.1)' : '#ffffff',
                                    color: paymentMethod === 'BANCO' ? '#1e40af' : '#374151'
                                }}
                                onClick={() => setPaymentMethod('BANCO')}
                            >
                                <Building2 className={`w-6 h-6 mx-auto mb-2 ${paymentMethod === 'BANCO' ? 'text-blue-400' : 'text-gray-600'}`} />
                                <div className="text-sm font-medium" style={{ color: paymentMethod === 'BANCO' ? '#1e40af' : '#374151' }}>Banco</div>
                            </button>
                            <button
                                type="button"
                                className={`p-4 rounded-xl border-2 transition-all ${paymentMethod === 'CAJA'
                                    ? 'border-green-500 bg-green-500/10'
                                    : 'border-gray-300 hover:border-green-400 bg-white hover:bg-green-50'
                                    }`}
                                style={{
                                    borderColor: paymentMethod === 'CAJA' ? '#22c55e' : '#d1d5db',
                                    backgroundColor: paymentMethod === 'CAJA' ? 'rgba(34, 197, 94, 0.1)' : '#ffffff',
                                    color: paymentMethod === 'CAJA' ? '#15803d' : '#374151'
                                }}
                                onClick={() => setPaymentMethod('CAJA')}
                            >
                                <Wallet className={`w-6 h-6 mx-auto mb-2 ${paymentMethod === 'CAJA' ? 'text-green-400' : 'text-gray-600'}`} />
                                <div className="text-sm font-medium" style={{ color: paymentMethod === 'CAJA' ? '#15803d' : '#374151' }}>Caja</div>
                            </button>
                            <button
                                type="button"
                                className={`p-4 rounded-xl border-2 transition-all ${paymentMethod === 'MIXTO'
                                    ? 'border-purple-500 bg-purple-500/10'
                                    : 'border-gray-300 hover:border-purple-400 bg-white hover:bg-purple-50'
                                    }`}
                                style={{
                                    borderColor: paymentMethod === 'MIXTO' ? '#a855f7' : '#d1d5db',
                                    backgroundColor: paymentMethod === 'MIXTO' ? 'rgba(168, 85, 247, 0.1)' : '#ffffff',
                                    color: paymentMethod === 'MIXTO' ? '#7c3aed' : '#374151'
                                }}
                                onClick={() => setPaymentMethod('MIXTO')}
                            >
                                <div className="flex gap-1 justify-center mb-2">
                                    <Building2 className={`w-5 h-5 ${paymentMethod === 'MIXTO' ? 'text-purple-400' : 'text-gray-600'}`} />
                                    <Wallet className={`w-5 h-5 ${paymentMethod === 'MIXTO' ? 'text-purple-400' : 'text-gray-600'}`} />
                                </div>
                                <div className="text-sm font-medium" style={{ color: paymentMethod === 'MIXTO' ? '#7c3aed' : '#374151' }}>Mixto</div>
                            </button>
                        </div>
                    </div>

                    {/* Amount Inputs */}
                    <div className="space-y-4">
                        {/* Bank Account Selection */}
                        {needsBankAccount && (
                            <div className="form-group">
                                <label className="glass-label">Cuenta Bancaria *</label>
                                {loadingAccounts ? (
                                    <div className="glass-input text-gray-400">Cargando cuentas...</div>
                                ) : cuentasBancarias.length === 0 ? (
                                    <div className="glass-input text-red-400">No hay cuentas bancarias disponibles</div>
                                ) : (
                                    <select
                                        className="glass-input glass-select"
                                        value={cuentaBancariaId}
                                        onChange={(e) => setCuentaBancariaId(e.target.value)}
                                        required
                                    >
                                        {cuentasBancarias.map(cuenta => (
                                            <option key={cuenta.id} value={cuenta.id}>
                                                {cuenta.bank?.nombre} - {cuenta.numeroCuenta}
                                                {cuenta.nombreOficialCuenta ? ` (${cuenta.nombreOficialCuenta})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        )}

                        <div className="form-group">
                            <label className="glass-label">Monto Banco</label>
                            <div className="input-wrapper">
                                <DollarSign className="input-icon" />
                                <input
                                    type="number"
                                    className="glass-input"
                                    placeholder="0.00"
                                    value={montoBanco}
                                    onChange={(e) => handleBancoChange(e.target.value)}
                                    disabled={paymentMethod === 'CAJA'}
                                    step="0.01"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="glass-label">Monto Caja</label>
                            <div className="input-wrapper">
                                <DollarSign className="input-icon" />
                                <input
                                    type="number"
                                    className="glass-input"
                                    placeholder="0.00"
                                    value={montoCaja}
                                    onChange={(e) => handleCajaChange(e.target.value)}
                                    disabled={paymentMethod === 'BANCO'}
                                    step="0.01"
                                />
                            </div>
                        </div>

                        {needsBankAccount && (
                            <div className="form-group">
                                <label className="glass-label">Número de Transacción (Opcional)</label>
                                <input
                                    type="text"
                                    className="glass-input"
                                    placeholder="Ej: TRX123456"
                                    value={numeroTransaccion}
                                    onChange={(e) => setNumeroTransaccion(e.target.value)}
                                />
                            </div>
                        )}
                    </div>

                    {/* Validation Message */}
                    <div className={`mt-4 p-4 rounded-xl border ${isValid
                        ? 'bg-green-500/10 border-green-500/20'
                        : 'bg-red-500/10 border-red-500/20'
                        }`}>
                        <div className="flex items-start gap-3">
                            <AlertCircle className={`w-5 h-5 shrink-0 mt-0.5 ${isValid ? 'text-green-400' : 'text-red-400'}`} />
                            <div className="text-sm">
                                <p className={`font-medium ${isValid ? 'text-green-200' : 'text-red-200'}`}>
                                    Total: {new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(total)}
                                </p>
                                <p className="text-gray-400 mt-1">
                                    {isValid
                                        ? '✓ El total coincide con el salario neto'
                                        : `✗ Debe ser igual a ${new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(salarioNeto)}`
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="glass-modal-footer">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl font-medium transition-colors border-2"
                        style={{
                            backgroundColor: '#ffffff',
                            color: '#374151',
                            borderColor: '#d1d5db'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f3f4f6';
                            e.currentTarget.style.borderColor = '#9ca3af';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#ffffff';
                            e.currentTarget.style.borderColor = '#d1d5db';
                        }}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!isValid || (needsBankAccount && !cuentaBancariaId)}
                        className="btn-glass primary"
                    >
                        Confirmar Pago
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;
