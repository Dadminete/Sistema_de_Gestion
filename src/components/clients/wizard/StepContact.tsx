import React from 'react';
import { Phone, Mail, User, AlertCircle } from 'lucide-react';
import type { StepProps } from './types';

const StepContact: React.FC<StepProps> = ({
    formData,
    updateFormData,
    markTouched,
    touched,
    fieldError,
    firstErrorRef
}) => {
    return (
        <div className="step-content">
            <div className="step-header">
                <div className="step-icon">
                    <Phone size={24} />
                </div>
                <div>
                    <h3>Información de Contacto</h3>
                    <p>Datos de comunicación del cliente</p>
                </div>
            </div>

            <div className="form-section">
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="telefono">
                            <Phone size={16} />
                            Teléfono Principal
                        </label>
                        <input
                            id="telefono"
                            type="tel"
                            value={formData.telefono}
                            onChange={(e) => updateFormData('telefono', e.target.value)}
                            onBlur={() => markTouched('telefono')}
                            ref={el => { if (touched['telefono'] && fieldError('telefono') && !firstErrorRef.current) firstErrorRef.current = el; }}
                            className={`form-input ${touched['telefono'] && fieldError('telefono') ? 'input-error' : ''}`}
                            placeholder="(809) 123-4567"
                            aria-invalid={!!(touched['telefono'] && fieldError('telefono'))}
                            aria-describedby="error-telefono"
                        />
                        {touched['telefono'] && fieldError('telefono') && (
                            <span id="error-telefono" className="field-error">{fieldError('telefono')}</span>
                        )}
                    </div>
                    <div className="form-group">
                        <label htmlFor="telefono_secundario">
                            <Phone size={16} />
                            Teléfono Secundario
                        </label>
                        <input
                            id="telefono_secundario"
                            type="tel"
                            value={formData.telefono_secundario}
                            onChange={(e) => updateFormData('telefono_secundario', e.target.value)}
                            onBlur={() => markTouched('telefono_secundario')}
                            ref={el => { if (touched['telefono_secundario'] && fieldError('telefono_secundario') && !firstErrorRef.current) firstErrorRef.current = el; }}
                            className={`form-input ${touched['telefono_secundario'] && fieldError('telefono_secundario') ? 'input-error' : ''}`}
                            placeholder="(829) 123-4567"
                            aria-invalid={!!(touched['telefono_secundario'] && fieldError('telefono_secundario'))}
                            aria-describedby="error-telefono_secundario"
                        />
                        {touched['telefono_secundario'] && fieldError('telefono_secundario') && (
                            <span id="error-telefono_secundario" className="field-error">{fieldError('telefono_secundario')}</span>
                        )}
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="email">
                            <Mail size={16} />
                            Correo Electrónico
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => updateFormData('email', e.target.value)}
                            onBlur={() => markTouched('email')}
                            ref={el => { if (touched['email'] && fieldError('email') && !firstErrorRef.current) firstErrorRef.current = el; }}
                            className={`form-input ${touched['email'] && fieldError('email') ? 'input-error' : ''}`}
                            placeholder="cliente@ejemplo.com"
                            aria-invalid={!!(touched['email'] && fieldError('email'))}
                            aria-describedby="error-email"
                        />
                        {touched['email'] && fieldError('email') && (
                            <span id="error-email" className="field-error">{fieldError('email')}</span>
                        )}
                    </div>
                    <div className="form-group">
                        <label htmlFor="contacto">
                            <User size={16} />
                            Persona de Contacto
                        </label>
                        <input
                            id="contacto"
                            type="text"
                            value={formData.contacto}
                            onChange={(e) => updateFormData('contacto', e.target.value)}
                            className="form-input"
                            placeholder="Nombre del contacto principal"
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="contacto_emergencia">
                            <AlertCircle size={16} />
                            Contacto de Emergencia
                        </label>
                        <input
                            id="contacto_emergencia"
                            type="text"
                            value={formData.contacto_emergencia}
                            onChange={(e) => updateFormData('contacto_emergencia', e.target.value)}
                            className="form-input"
                            placeholder="Nombre del contacto de emergencia"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="telefono_emergencia">
                            <Phone size={16} />
                            Teléfono de Emergencia
                        </label>
                        <input
                            id="telefono_emergencia"
                            type="tel"
                            value={formData.telefono_emergencia}
                            onChange={(e) => updateFormData('telefono_emergencia', e.target.value)}
                            className="form-input"
                            placeholder="(849) 123-4567"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StepContact;
