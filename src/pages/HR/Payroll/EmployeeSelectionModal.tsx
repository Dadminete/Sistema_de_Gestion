import { useState, useEffect } from 'react';
import { X, Search, Users, CheckSquare, Square } from 'lucide-react';
import { hrService, type Employee } from '../../../services/hrService';

interface EmployeeSelectionModalProps {
    periodId: string;
    onClose: () => void;
    onGenerate: (employees: Employee[]) => void;
}

const EmployeeSelectionModal = ({ periodId, onClose, onGenerate }: EmployeeSelectionModalProps) => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const data = await hrService.getEmployees();
            // Filter only active employees
            const activeEmployees = data.filter((emp: Employee) => emp.estado === 'ACTIVO');
            setEmployees(activeEmployees);
        } catch (error) {
            console.error('Error fetching employees:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleEmployee = (employeeId: string) => {
        const newSelected = new Set(selectedEmployees);
        if (newSelected.has(employeeId)) {
            newSelected.delete(employeeId);
        } else {
            newSelected.add(employeeId);
        }
        setSelectedEmployees(newSelected);
    };

    const filteredEmployees = employees.filter(emp =>
        (emp.nombres || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.apellidos || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.codigoEmpleado || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.cargo?.nombreCargo || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleAll = () => {
        if (selectedEmployees.size === filteredEmployees.length) {
            setSelectedEmployees(new Set());
        } else {
            setSelectedEmployees(new Set(filteredEmployees.map(emp => emp.id)));
        }
    };

    const handleGenerate = () => {
        if (selectedEmployees.size === 0) {
            alert('Debe seleccionar al menos un empleado');
            return;
        }
        const selectedObjs = employees.filter(emp => selectedEmployees.has(emp.id));
        onGenerate(selectedObjs);
    };

    return (
        <div className="glass-modal-overlay" onClick={onClose}>
            <div className="glass-modal employee-selection-modal" onClick={(e) => e.stopPropagation()}>
                <div className="glass-modal-header">
                    <h2 className="glass-modal-title">
                        Seleccionar Empleados para Nómina
                    </h2>
                    <button className="glass-modal-close" onClick={onClose}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="glass-modal-body">
                    {/* Search Bar */}
                    <div className="employee-search-bar">
                        <Search className="w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Buscar empleados..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="glass-input"
                        />
                    </div>

                    {/* Select All */}
                    <div className="select-all-row">
                        <button
                            className="select-all-btn"
                            onClick={toggleAll}
                        >
                            {selectedEmployees.size === filteredEmployees.length ? (
                                <CheckSquare className="w-5 h-5" />
                            ) : (
                                <Square className="w-5 h-5" />
                            )}
                            <span>
                                {selectedEmployees.size === filteredEmployees.length
                                    ? 'Deseleccionar Todos'
                                    : 'Seleccionar Todos'}
                            </span>
                        </button>
                        <span className="selected-count">
                            {selectedEmployees.size} de {filteredEmployees.length} seleccionados
                        </span>
                    </div>

                    {/* Employee List */}
                    <div className="employee-selection-list">
                        {loading ? (
                            <div className="text-center py-8 text-gray-400">Cargando empleados...</div>
                        ) : filteredEmployees.length === 0 ? (
                            <div className="empty-state">
                                <Users className="mx-auto" />
                                <h3>No hay empleados activos</h3>
                                <p>No se encontraron empleados para generar nómina</p>
                            </div>
                        ) : (
                            filteredEmployees.map((employee) => (
                                <div
                                    key={employee.id}
                                    className={`employee-selection-item ${selectedEmployees.has(employee.id) ? 'selected' : ''}`}
                                    onClick={() => toggleEmployee(employee.id)}
                                >
                                    <div className="employee-checkbox">
                                        {selectedEmployees.has(employee.id) ? (
                                            <CheckSquare className="w-5 h-5 text-primary" />
                                        ) : (
                                            <Square className="w-5 h-5" />
                                        )}
                                    </div>
                                    <div className="employee-avatar">
                                        {employee.nombres.charAt(0)}{employee.apellidos.charAt(0)}
                                    </div>
                                    <div className="employee-details">
                                        <div className="employee-name">
                                            {employee.nombres} {employee.apellidos}
                                        </div>
                                        <div className="employee-meta">
                                            <span className="employee-code">#{employee.codigoEmpleado}</span>
                                            <span className="employee-cargo">
                                                {employee.cargo?.nombreCargo || 'Sin cargo'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="employee-salary">
                                        {new Intl.NumberFormat('es-DO', {
                                            style: 'currency',
                                            currency: 'DOP'
                                        }).format(employee.salarioBase)}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="glass-modal-footer">
                    <button type="button" className="btn-glass secondary" onClick={onClose}>
                        Cancelar
                    </button>
                    <button
                        type="button"
                        className="btn-glass primary"
                        onClick={handleGenerate}
                        disabled={selectedEmployees.size === 0}
                    >
                        <Users className="w-4 h-4" />
                        Generar Nómina ({selectedEmployees.size})
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EmployeeSelectionModal;
