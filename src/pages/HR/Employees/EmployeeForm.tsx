import React, { useState, useEffect } from 'react';
import {
    X, Save, User, Mail, Phone, MapPin, Briefcase,
    DollarSign, Calendar, Hash, Building2, BadgeCheck,
    CreditCard, Lock, Plus
} from 'lucide-react';
import { hrService } from '../../../services/hrService';
import '../../../styles/EmployeesList.css';

interface EmployeeFormProps {
    employee?: any;
    onClose: () => void;
    onSave: () => void;
}

const EmployeeForm: React.FC<EmployeeFormProps> = ({ employee, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        nombres: '',
        apellidos: '',
        cedula: '',
        email: '',
        telefono: '',
        direccion: '',
        cargoId: '',
        departamentoId: '',
        fechaIngreso: new Date().toISOString().split('T')[0],
        salarioBase: '',
        estado: 'ACTIVO',
        codigoEmpleado: `EMP-${Math.floor(1000 + Math.random() * 9000)}`, // Auto-generate default
        usuarioId: '',
        montoAfp: '',
        montoSfs: '',
        montoIsr: '',
        otrosDescuentos: '',
        tipoSalario: 'MENSUAL'
    });

    const [departments, setDepartments] = useState<any[]>([]);
    const [cargos, setCargos] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [depsRes, cargosRes, usersRes] = await Promise.all([
                    hrService.getDepartments(),
                    hrService.getCargos(),
                    hrService.getUsers()
                ]);
                setDepartments(depsRes.data || depsRes);
                setCargos(cargosRes.data || cargosRes);
                setUsers(usersRes.data || usersRes);
            } catch (error) {
                console.error('Error loading form data:', error);
            }
        };
        loadData();

        if (employee) {
            setFormData({
                nombres: employee.nombres || '',
                apellidos: employee.apellidos || '',
                cedula: employee.cedula || '',
                email: employee.email || '',
                telefono: employee.telefono || '',
                direccion: employee.direccion || '',
                cargoId: employee.cargoId ? employee.cargoId.toString() : '',
                departamentoId: employee.departamentoId ? employee.departamentoId.toString() : '',
                fechaIngreso: employee.fechaIngreso ? new Date(employee.fechaIngreso).toISOString().split('T')[0] : '',
                salarioBase: employee.salarioBase || '',
                estado: employee.estado || 'ACTIVO',
                codigoEmpleado: employee.codigoEmpleado || '',
                usuarioId: employee.usuarioId || '',
                montoAfp: employee.montoAfp || '',
                montoSfs: employee.montoSfs || '',
                montoIsr: employee.montoIsr || '',
                otrosDescuentos: employee.otrosDescuentos || '',
                tipoSalario: employee.tipoSalario || 'MENSUAL'
            });
        }
    }, [employee]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (employee) {
                await hrService.updateEmployee(employee.id, formData);
            } else {
                await hrService.createEmployee(formData);
            }
            onSave();
        } catch (error) {
            console.error('Error saving employee:', error);
            alert('Error al guardar el empleado');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass-modal-overlay" onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
        }}>
            <div className="glass-modal">
                <div className="glass-modal-header">
                    <div>
                        <h2 className="glass-modal-title">
                            {employee ? 'Editar Empleado' : 'Nuevo Empleado'}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {employee ? 'Actualiza la información del empleado' : 'Ingresa los datos para registrar un nuevo empleado'}
                        </p>
                    </div>
                    <button onClick={onClose} className="glass-modal-close">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
                    <div className="glass-modal-body">
                        {/* Personal Information */}
                        <div className="form-section">
                            <h3 className="form-section-title">
                                <User className="w-5 h-5" /> Información Personal
                            </h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="glass-label">Nombres</label>
                                    <div className="input-wrapper">
                                        <User className="input-icon" />
                                        <input
                                            type="text"
                                            className="glass-input"
                                            placeholder="Ej. Juan Carlos"
                                            value={formData.nombres}
                                            onChange={e => setFormData({ ...formData, nombres: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="glass-label">Apellidos</label>
                                    <div className="input-wrapper">
                                        <User className="input-icon" />
                                        <input
                                            type="text"
                                            className="glass-input"
                                            placeholder="Ej. Pérez López"
                                            value={formData.apellidos}
                                            onChange={e => setFormData({ ...formData, apellidos: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="glass-label">Cédula</label>
                                    <div className="input-wrapper">
                                        <CreditCard className="input-icon" />
                                        <input
                                            type="text"
                                            className="glass-input"
                                            placeholder="000-0000000-0"
                                            value={formData.cedula}
                                            onChange={e => setFormData({ ...formData, cedula: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="glass-label">Código Empleado</label>
                                    <div className="input-wrapper">
                                        <Hash className="input-icon" />
                                        <input
                                            type="text"
                                            className="glass-input"
                                            placeholder="EMP-001"
                                            value={formData.codigoEmpleado}
                                            onChange={e => setFormData({ ...formData, codigoEmpleado: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contact Information */}
                        <div className="form-section">
                            <h3 className="form-section-title">
                                <Mail className="w-5 h-5" /> Contacto
                            </h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="glass-label">Email</label>
                                    <div className="input-wrapper">
                                        <Mail className="input-icon" />
                                        <input
                                            type="email"
                                            className="glass-input"
                                            placeholder="juan.perez@empresa.com"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="glass-label">Teléfono</label>
                                    <div className="input-wrapper">
                                        <Phone className="input-icon" />
                                        <input
                                            type="tel"
                                            className="glass-input"
                                            placeholder="(809) 000-0000"
                                            value={formData.telefono}
                                            onChange={e => setFormData({ ...formData, telefono: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="form-group md:col-span-2">
                                    <label className="glass-label">Dirección</label>
                                    <div className="input-wrapper">
                                        <MapPin className="input-icon" />
                                        <input
                                            type="text"
                                            className="glass-input"
                                            placeholder="Calle Principal #123, Sector..."
                                            value={formData.direccion}
                                            onChange={e => setFormData({ ...formData, direccion: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="form-group md:col-span-2">
                                    <label className="glass-label">Usuario de Sistema (Opcional)</label>
                                    <div className="input-wrapper">
                                        <Lock className="input-icon" />
                                        <select
                                            className="glass-input glass-select"
                                            value={formData.usuarioId}
                                            onChange={e => {
                                                const selectedUserId = e.target.value;
                                                const selectedUser = users.find(u => u.id === selectedUserId);

                                                if (selectedUser) {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        usuarioId: selectedUserId,
                                                        nombres: selectedUser.nombre || prev.nombres,
                                                        apellidos: selectedUser.apellido || prev.apellidos,
                                                        telefono: selectedUser.telefono || prev.telefono,
                                                        cedula: selectedUser.cedula || prev.cedula,
                                                        // User model might not have email or address directly, but we fill what we can
                                                    }));
                                                } else {
                                                    setFormData(prev => ({ ...prev, usuarioId: selectedUserId }));
                                                }
                                            }}
                                        >
                                            <option value="">Sin usuario asignado</option>
                                            {users.map(u => (
                                                <option key={u.id} value={u.id}>
                                                    {u.username} - {u.nombre} {u.apellido}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1 ml-1">
                                        Vincular este empleado a una cuenta de usuario existente para acceso al sistema.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Job Information */}
                        <div className="form-section">
                            <h3 className="form-section-title">
                                <Briefcase className="w-5 h-5" /> Información Laboral
                            </h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="glass-label">Departamento</label>
                                    <div className="flex gap-2">
                                        <div className="input-wrapper flex-1">
                                            <Building2 className="input-icon" />
                                            <select
                                                className="glass-input glass-select"
                                                value={formData.departamentoId}
                                                onChange={e => setFormData({ ...formData, departamentoId: e.target.value })}
                                                required
                                            >
                                                <option value="">Seleccionar...</option>
                                                {departments.map(d => (
                                                    <option key={d.id} value={d.id}>{d.nombre}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <button
                                            type="button"
                                            className="btn-glass secondary p-2"
                                            onClick={async () => {
                                                const nombre = prompt('Ingrese el nombre del nuevo departamento:');
                                                if (nombre) {
                                                    try {
                                                        const res = await hrService.createDepartment({ nombre });
                                                        const newDept = res.data || res;
                                                        setDepartments([...departments, newDept]);
                                                        setFormData({ ...formData, departamentoId: newDept.id.toString() });
                                                    } catch (error) {
                                                        console.error('Error creating department:', error);
                                                        alert('Error al crear el departamento');
                                                    }
                                                }
                                            }}
                                            title="Crear nuevo departamento"
                                        >
                                            <Plus className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="glass-label">Cargo</label>
                                    <div className="flex gap-2">
                                        <div className="input-wrapper flex-1">
                                            <BadgeCheck className="input-icon" />
                                            <select
                                                className="glass-input glass-select"
                                                value={formData.cargoId}
                                                onChange={e => setFormData({ ...formData, cargoId: e.target.value })}
                                                required
                                            >
                                                <option value="">Seleccionar...</option>
                                                {cargos.map(c => (
                                                    <option key={c.id} value={c.id}>{c.nombreCargo}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <button
                                            type="button"
                                            className="btn-glass secondary p-2"
                                            onClick={async () => {
                                                const nombreCargo = prompt('Ingrese el nombre del nuevo cargo:');
                                                if (nombreCargo) {
                                                    try {
                                                        const res = await hrService.createCargo({ nombreCargo });
                                                        const newCargo = res.data || res;
                                                        setCargos([...cargos, newCargo]);
                                                        setFormData({ ...formData, cargoId: newCargo.id.toString() });
                                                    } catch (error) {
                                                        console.error('Error creating cargo:', error);
                                                        alert('Error al crear el cargo');
                                                    }
                                                }
                                            }}
                                            title="Crear nuevo cargo"
                                        >
                                            <Plus className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="glass-label">Fecha Ingreso</label>
                                    <div className="input-wrapper">
                                        <Calendar className="input-icon" />
                                        <input
                                            type="date"
                                            className="glass-input"
                                            value={formData.fechaIngreso}
                                            onChange={e => setFormData({ ...formData, fechaIngreso: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="glass-label">Salario Base</label>
                                    <div className="input-wrapper">
                                        <DollarSign className="input-icon" />
                                        <input
                                            type="number"
                                            className="glass-input"
                                            placeholder="0.00"
                                            value={formData.salarioBase}
                                            onChange={e => setFormData({ ...formData, salarioBase: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="glass-label">Tipo de Salario</label>
                                    <div className="input-wrapper">
                                        <DollarSign className="input-icon" />
                                        <select
                                            className="glass-input glass-select"
                                            value={formData.tipoSalario}
                                            onChange={e => setFormData({ ...formData, tipoSalario: e.target.value })}
                                        >
                                            <option value="MENSUAL">MENSUAL</option>
                                            <option value="POR_HORA">POR HORA</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Payroll Configuration */}
                        <div className="form-section">
                            <h3 className="form-section-title">
                                <DollarSign className="w-5 h-5" /> Configuración de Nómina (Recurrente)
                            </h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="glass-label">Monto Fijo AFP (Opcional)</label>
                                    <div className="input-wrapper">
                                        <DollarSign className="input-icon" />
                                        <input
                                            type="number"
                                            className="glass-input"
                                            placeholder="0.00"
                                            value={formData.montoAfp}
                                            onChange={e => setFormData({ ...formData, montoAfp: e.target.value })}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Dejar en 0 para no descontar</p>
                                </div>

                                <div className="form-group">
                                    <label className="glass-label">Monto Fijo SFS (Opcional)</label>
                                    <div className="input-wrapper">
                                        <DollarSign className="input-icon" />
                                        <input
                                            type="number"
                                            className="glass-input"
                                            placeholder="0.00"
                                            value={formData.montoSfs}
                                            onChange={e => setFormData({ ...formData, montoSfs: e.target.value })}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Dejar en 0 para no descontar</p>
                                </div>

                                <div className="form-group">
                                    <label className="glass-label">Monto Fijo ISR (Opcional)</label>
                                    <div className="input-wrapper">
                                        <DollarSign className="input-icon" />
                                        <input
                                            type="number"
                                            className="glass-input"
                                            placeholder="0.00"
                                            value={formData.montoIsr}
                                            onChange={e => setFormData({ ...formData, montoIsr: e.target.value })}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Dejar en 0 para no descontar</p>
                                </div>

                                <div className="form-group">
                                    <label className="glass-label">Otros Descuentos Fijos</label>
                                    <div className="input-wrapper">
                                        <DollarSign className="input-icon" />
                                        <input
                                            type="number"
                                            className="glass-input"
                                            placeholder="0.00"
                                            value={formData.otrosDescuentos}
                                            onChange={e => setFormData({ ...formData, otrosDescuentos: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="glass-label">Estado</label>
                                    <div className="input-wrapper">
                                        <BadgeCheck className="input-icon" />
                                        <select
                                            className="glass-input glass-select"
                                            value={formData.estado}
                                            onChange={e => setFormData({ ...formData, estado: e.target.value })}
                                        >
                                            <option value="ACTIVO">ACTIVO</option>
                                            <option value="INACTIVO">INACTIVO</option>
                                            <option value="VACACIONES">VACACIONES</option>
                                            <option value="LICENCIA">LICENCIA</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="glass-modal-footer">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-xl text-gray-400 hover:bg-slate-800 hover:text-white transition-colors font-medium"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-glass primary"
                        >
                            {loading ? 'Guardando...' : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Guardar Empleado
                                </>
                            )}
                        </button>
                    </div>
                </form >
            </div >
        </div >
    );
};

export default EmployeeForm;
