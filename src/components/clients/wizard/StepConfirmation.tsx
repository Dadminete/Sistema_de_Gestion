import React from 'react';
import { CheckCircle, User, Phone, MapPin, Settings, Upload, X } from 'lucide-react';
import type { StepProps } from './types';
import { formatearMonto } from '../../../utils/montoUtils';

interface StepConfirmationProps extends StepProps {
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    removePhoto: () => void;
    photoPreview: string | null;
    uploadedPhoto: File | null;
    uploadingPhoto: boolean;
}

const StepConfirmation: React.FC<StepConfirmationProps> = ({
    formData,
    updateFormData,
    handleFileChange,
    removePhoto,
    photoPreview,
    uploadedPhoto,
    uploadingPhoto
}) => {
    return (
        <div className="step-content">
            <div className="step-header">
                <div className="step-icon">
                    <CheckCircle size={24} />
                </div>
                <div>
                    <h3>Confirmación</h3>
                    <p>Revise y confirme la información del cliente</p>
                </div>
            </div>

            <div className="form-section">
                <div className="confirmation-summary">
                    <div className="summary-section">
                        <div className="section-header">
                            <User size={20} />
                            <h4>Información Personal</h4>
                        </div>
                        <div className="summary-content">
                            <p><strong>Nombre:</strong> {formData.nombre} {formData.apellidos}</p>
                            {formData.cedula && <p><strong>Cédula:</strong> {formData.cedula}</p>}
                            {formData.fecha_ingreso && <p><strong>Fecha de Suscripción:</strong> {formData.fecha_ingreso}</p>}
                            {formData.sexo && <p><strong>Sexo:</strong> {formData.sexo}</p>}
                        </div>
                    </div>

                    <div className="summary-section">
                        <div className="section-header">
                            <Phone size={20} />
                            <h4>Contacto</h4>
                        </div>
                        <div className="summary-content">
                            {formData.telefono && <p><strong>Teléfono:</strong> {formData.telefono}</p>}
                            {formData.email && <p><strong>Email:</strong> {formData.email}</p>}
                            {formData.contacto && <p><strong>Contacto:</strong> {formData.contacto}</p>}
                        </div>
                    </div>

                    <div className="summary-section">
                        <div className="section-header">
                            <MapPin size={20} />
                            <h4>Dirección</h4>
                        </div>
                        <div className="summary-content">
                            {formData.direccion && <p><strong>Dirección:</strong> {formData.direccion}</p>}
                            {formData.ciudad && <p><strong>Ciudad:</strong> {formData.ciudad}</p>}
                            {formData.provincia && <p><strong>Provincia:</strong> {formData.provincia}</p>}
                        </div>
                    </div>

                    <div className="summary-section">
                        <div className="section-header">
                            <Settings size={20} />
                            <h4>Detalles del Cliente</h4>
                        </div>
                        <div className="summary-content">
                            <p><strong>Tipo:</strong> {formData.tipo_cliente}</p>
                            <p><strong>Categoría:</strong> {formData.categoria_cliente}</p>
                            <p><strong>Estado:</strong> {formData.estado}</p>
                            {formData.limite_crediticio > 0 && <p><strong>Límite Crédito:</strong> {formatearMonto(formData.limite_crediticio)}</p>}
                        </div>
                    </div>

                    {/* Photo Upload Section */}
                    <div className="form-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600 }}>
                            <User size={16} />
                            Foto del Cliente (opcional)
                        </label>

                        {/* File Upload Area */}
                        <div className="file-upload-area">
                            <input
                                id="photo-upload"
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                            />

                            {!photoPreview ? (
                                <div
                                    className="upload-zone"
                                    onClick={() => document.getElementById('photo-upload')?.click()}
                                    style={{
                                        border: '2px dashed #cbd5e0',
                                        borderRadius: '12px',
                                        padding: '2rem',
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        backgroundColor: '#f8fafb',
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    <Upload size={48} style={{ color: '#a0aec0', marginBottom: '1rem' }} />
                                    <p style={{ margin: '0 0 0.5rem 0', color: '#4a5568', fontWeight: 500 }}>
                                        Haz clic para subir una foto
                                    </p>
                                    <p style={{ margin: '0', fontSize: '0.9rem', color: '#718096' }}>
                                        PNG, JPG hasta 5MB
                                    </p>
                                </div>
                            ) : (
                                <div className="photo-preview" style={{ position: 'relative', textAlign: 'center' }}>
                                    <img
                                        src={photoPreview}
                                        alt="Preview"
                                        style={{
                                            maxWidth: '200px',
                                            maxHeight: '200px',
                                            borderRadius: '12px',
                                            border: '1px solid #e2e8f0',
                                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={removePhoto}
                                        style={{
                                            position: 'absolute',
                                            top: '-10px',
                                            right: 'calc(50% - 110px)',
                                            backgroundColor: '#ef4444',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '50%',
                                            width: '32px',
                                            height: '32px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                                        }}
                                        title="Eliminar foto"
                                    >
                                        <X size={16} />
                                    </button>
                                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#718096' }}>
                                        {uploadedPhoto?.name}
                                    </p>
                                </div>
                            )}

                            {uploadingPhoto && (
                                <div style={{
                                    marginTop: '1rem',
                                    padding: '1rem',
                                    backgroundColor: '#ebf8ff',
                                    borderRadius: '8px',
                                    textAlign: 'center',
                                    color: '#2b6cb0'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                        <span className="material-icons" style={{ animation: 'spin 1s linear infinite' }}>refresh</span>
                                        <span>Subiendo foto...</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Alternative URL input */}
                        <div style={{ marginTop: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#718096' }}>
                                O ingresa una URL de imagen:
                            </label>
                            <input
                                id="foto_url"
                                type="url"
                                value={formData.foto_url}
                                onChange={(e) => updateFormData('foto_url', e.target.value)}
                                className="form-input"
                                placeholder="https://ejemplo.com/foto.jpg"
                                style={{ fontSize: '0.9rem' }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StepConfirmation;
