import { useState, useEffect } from 'react';
import { X, Plus, Edit, Trash2 } from 'lucide-react';
import * as commissionService from '../../../services/commissionService';
import type { CommissionType } from '../../../services/commissionService';
import './CommissionModals.css';

interface CommissionTypeModalProps {
    onClose: () => void;
}

const CommissionTypeModal = ({ onClose }: CommissionTypeModalProps) => {
    const [types, setTypes] = useState<CommissionType[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<CommissionType | null>(null);
    const [formData, setFormData] = useState({
        nombreTipo: '',
        descripcion: '',
        porcentajeBase: '',
        montoFijo: '',
        tipoCalculo: 'porcentaje' as 'porcentaje' | 'fijo'
    });

    useEffect(() => {
        loadTypes();
    }, []);

    const loadTypes = async () => {
        try {
            setLoading(true);
            const data = await commissionService.getCommissionTypes(true);
            setTypes(data);
        } catch (error) {
            console.error('Error loading types:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const data: any = {
            nombreTipo: formData.nombreTipo,
            descripcion: formData.descripcion || null,
            porcentajeBase: formData.tipoCalculo === 'porcentaje' ? Number(formData.porcentajeBase) : null,
            montoFijo: formData.tipoCalculo === 'fijo' ? Number(formData.montoFijo) : null,
            activo: true
        };

        try {
            if (editing) {
                await commissionService.updateCommissionType(editing.id, data);
            } else {
                await commissionService.createCommissionType(data);
            }
            resetForm();
            loadTypes();
        } catch (error) {
            console.error('Error saving type:', error);
            alert('Error al guardar el tipo de comisión');
        }
    };

    const handleEdit = (type: CommissionType) => {
        setEditing(type);
        setFormData({
            nombreTipo: type.nombreTipo,
            descripcion: type.descripcion || '',
            porcentajeBase: type.porcentajeBase ? String(type.porcentajeBase) : '',
            montoFijo: type.montoFijo ? String(type.montoFijo) : '',
            tipoCalculo: type.porcentajeBase ? 'porcentaje' : 'fijo'
        });
    };

    const handleDelete = async (id: string | number) => {
        if (!confirm('¿Está seguro de desactivar este tipo de comisión?')) return;

        try {
            await commissionService.deleteCommissionType(id);
            loadTypes();
        } catch (error) {
            console.error('Error deleting type:', error);
            alert('Error al eliminar el tipo');
        }
    };

    const resetForm = () => {
        setEditing(null);
        setFormData({
            nombreTipo: '',
            descripcion: '',
            porcentajeBase: '',
            montoFijo: '',
            tipoCalculo: 'porcentaje'
        });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Tipos de Comisión</h2>
                    <button className="modal-close" onClick={onClose}>
                        <X />
                    </button>
                </div>

                <div className="modal-body">
                    {/* Form */}
                    <form onSubmit={handleSubmit} className="type-form">
                        <div className="form-row">
                            <div className="form-group">
                                <label>Nombre del Tipo *</label>
                                <input
                                    type="text"
                                    value={formData.nombreTipo}
                                    onChange={(e) => setFormData({ ...formData, nombreTipo: e.target.value })}
                                    required
                                    placeholder="Ej: Ventas Mensuales"
                                />
                            </div>

                            <div className="form-group">
                                <label>Tipo de Cálculo *</label>
                                <select
                                    value={formData.tipoCalculo}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        tipoCalculo: e.target.value as 'porcentaje' | 'fijo',
                                        porcentajeBase: '',
                                        montoFijo: ''
                                    })}
                                >
                                    <option value="porcentaje">Porcentaje</option>
                                    <option value="fijo">Monto Fijo</option>
                                </select>
                            </div>

                            {formData.tipoCalculo === 'porcentaje' ? (
                                <div className="form-group">
                                    <label>Porcentaje Base (%)*</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.porcentajeBase}
                                        onChange={(e) => setFormData({ ...formData, porcentajeBase: e.target.value })}
                                        required
                                        placeholder="Ej: 5.00"
                                    />
                                </div>
                            ) : (
                                <div className="form-group">
                                    <label>Monto Fijo *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.montoFijo}
                                        onChange={(e) => setFormData({ ...formData, montoFijo: e.target.value })}
                                        required
                                        placeholder="Ej: 5000.00"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="form-group">
                            <label>Descripción</label>
                            <textarea
                                value={formData.descripcion}
                                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                rows={2}
                                placeholder="Descripción del tipo de comisión..."
                            />
                        </div>

                        <div className="form-actions">
                            {editing && (
                                <button type="button" className="btn-secondary" onClick={resetForm}>
                                    Cancelar Edición
                                </button>
                            )}
                            <button type="submit" className="btn-primary">
                                <Plus className="w-4 h-4" />
                                {editing ? 'Actualizar Tipo' : 'Agregar Tipo'}
                            </button>
                        </div>
                    </form>

                    {/* Types List */}
                    <div className="types-list">
                        <h3>Tipos Existentes</h3>
                        {loading ? (
                            <p>Cargando...</p>
                        ) : types.length === 0 ? (
                            <p className="empty-message">No hay tipos de comisión registrados</p>
                        ) : (
                            <div className="types-grid">
                                {types.map((type) => (
                                    <div
                                        key={type.id}
                                        className={`type-card ${!type.activo ? 'inactive' : ''}`}
                                    >
                                        <div className="type-card-header">
                                            <h4>{type.nombreTipo}</h4>
                                            <div className="type-actions">
                                                <button
                                                    onClick={() => handleEdit(type)}
                                                    className="action-btn action-btn-primary"
                                                    title="Editar"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(type.id)}
                                                    className="action-btn action-btn-danger"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                        {type.descripcion && (
                                            <p className="type-description">{type.descripcion}</p>
                                        )}
                                        <div className="type-value">
                                            {type.porcentajeBase && (
                                                <span className="value-badge">
                                                    {Number(type.porcentajeBase).toFixed(2)}%
                                                </span>
                                            )}
                                            {type.montoFijo && (
                                                <span className="value-badge">
                                                    RD${Number(type.montoFijo).toFixed(2)}
                                                </span>
                                            )}
                                            {!type.activo && (
                                                <span className="inactive-badge">Inactivo</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn-secondary" onClick={onClose}>
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CommissionTypeModal;
