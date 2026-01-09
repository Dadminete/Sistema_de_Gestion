import { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Filter,
    Edit,
    Trash2,
    User,
    Mail,
    Phone,
    Briefcase,
    Calendar,
    Building2
} from 'lucide-react';
import { hrService, type Employee } from '../../../services/hrService';
import EmployeeForm from './EmployeeForm';
import './EmployeesList.css';

const EmployeesList = () => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | undefined>(undefined);

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const data = await hrService.getEmployees();
            setEmployees(data);
        } catch (error) {
            console.error('Error fetching employees:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (employee: Employee) => {
        setSelectedEmployee(employee);
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('¿Está seguro de que desea eliminar este empleado?')) {
            try {
                await hrService.deleteEmployee(id);
                fetchEmployees();
            } catch (error) {
                console.error('Error deleting employee:', error);
                alert('Error al eliminar el empleado');
            }
        }
    };

    const handleFormClose = () => {
        setShowForm(false);
        setSelectedEmployee(undefined);
    };

    const handleFormSave = () => {
        handleFormClose();
        fetchEmployees();
    };

    const filteredEmployees = employees
        .filter(emp => emp.estado === 'ACTIVO')
        .filter(emp =>
            (emp.nombres || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (emp.apellidos || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (emp.codigoEmpleado || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (emp.cargo?.nombreCargo || '').toLowerCase().includes(searchTerm.toLowerCase())
        );

    return (
        <div className="emp-page">
            <header className="emp-header">
                <div>
                    <h1 className="emp-title">Gestión de Empleados</h1>
                    <p className="emp-subtitle">Administra el personal de tu empresa con estilo</p>
                </div>
                <div className="emp-actions">
                    <button
                        className="btn-glass primary"
                        onClick={() => setShowForm(true)}
                    >
                        <Plus className="w-4 h-4" />
                        <span>Nuevo Empleado</span>
                    </button>
                </div>
            </header>

            <div className="mb-8 flex gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, código o cargo..."
                        className="glass-input pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="btn-glass secondary">
                    <Filter className="w-4 h-4" />
                    <span>Filtros</span>
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64 text-gray-400">
                    Cargando empleados...
                </div>
            ) : filteredEmployees.length === 0 ? (
                <div className="flex justify-center items-center h-64 text-gray-400">
                    No se encontraron empleados.
                </div>
            ) : (
                <div className="emp-grid">
                    {filteredEmployees.map((employee) => (
                        <div key={employee.id} className="emp-card group">
                            <div className="emp-card-header">
                                {employee.usuario?.avatar ? (
                                    <img
                                        src={employee.usuario.avatar}
                                        alt={`${employee.nombres} ${employee.apellidos}`}
                                        className="emp-avatar-img"
                                    />
                                ) : (
                                    <div className="emp-avatar">
                                        {(employee.nombres || '').charAt(0)}{(employee.apellidos || '').charAt(0)}
                                    </div>
                                )}
                                <div className="emp-info">
                                    <h3>{employee.nombres} {employee.apellidos}</h3>
                                    <p className="emp-code">#{employee.codigoEmpleado}</p>
                                </div>
                                <span className={`emp-status status-${employee.estado.toLowerCase()}`}>
                                    {employee.estado}
                                </span>
                            </div>

                            <div className="emp-details">
                                <div className="emp-detail-item">
                                    <Briefcase className="w-4 h-4" />
                                    <div className="emp-detail-content">
                                        <span className="emp-detail-label">Cargo</span>
                                        <span className="emp-detail-value">{employee.cargo?.nombreCargo || 'Sin Cargo'}</span>
                                    </div>
                                </div>
                                <div className="emp-detail-item">
                                    <Building2 className="w-4 h-4" />
                                    <div className="emp-detail-content">
                                        <span className="emp-detail-label">Departamento</span>
                                        <span className="emp-detail-value">{employee.departamento?.nombre || 'Sin Departamento'}</span>
                                    </div>
                                </div>
                                <div className="emp-detail-item">
                                    <Mail className="w-4 h-4" />
                                    <div className="emp-detail-content">
                                        <span className="emp-detail-label">Email</span>
                                        <span className="emp-detail-value">{employee.email || 'No registrado'}</span>
                                    </div>
                                </div>
                                <div className="emp-detail-item">
                                    <Phone className="w-4 h-4" />
                                    <div className="emp-detail-content">
                                        <span className="emp-detail-label">Teléfono</span>
                                        <span className="emp-detail-value">{employee.telefono || 'No registrado'}</span>
                                    </div>
                                </div>
                                <div className="emp-detail-item">
                                    <Calendar className="w-4 h-4" />
                                    <div className="emp-detail-content">
                                        <span className="emp-detail-label">Fecha Ingreso</span>
                                        <span className="emp-detail-value">{new Date(employee.fechaIngreso).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                {employee.usuario && (
                                    <div className="emp-detail-item">
                                        <User className="w-4 h-4" />
                                        <div className="emp-detail-content">
                                            <span className="emp-detail-label">Usuario Sistema</span>
                                            <span className="emp-detail-value">@{employee.usuario.username}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="emp-card-actions">
                                <button
                                    className="action-btn edit"
                                    onClick={() => handleEdit(employee)}
                                    title="Editar"
                                >
                                    <Edit className="w-4 h-4" />
                                    <span>Editar</span>
                                </button>
                                <button
                                    className="action-btn delete"
                                    onClick={() => handleDelete(employee.id)}
                                    title="Eliminar"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showForm && (
                <EmployeeForm
                    employee={selectedEmployee}
                    onClose={handleFormClose}
                    onSave={handleFormSave}
                />
            )}
        </div>
    );
};

export default EmployeesList;
