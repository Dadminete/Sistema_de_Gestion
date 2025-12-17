import React from 'react';
import { User, Hash, Calendar, UserCheck } from 'lucide-react';
import type { StepProps } from './types';

const StepPersonal: React.FC<StepProps> = ({
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
                    <User size={24} />
                </div>
                <div>
                    <h3>Información Personal</h3>
                    <p>Datos básicos del cliente</p>
                </div>
            </div>

            <div className="form-section">
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="nombre">
                            <User size={16} />
                            Nombre *
                        </label>
                        <input
                            id="nombre"
                            type="text"
                            value={formData.nombre}
                            onChange={(e) => updateFormData('nombre', e.target.value)}
                            onBlur={() => markTouched('nombre')}
                            ref={el => { if (touched['nombre'] && fieldError('nombre') && !firstErrorRef.current) firstErrorRef.current = el; }}
                            className={`form-input ${touched['nombre'] && fieldError('nombre') ? 'input-error' : ''}`}
                            placeholder="Ingrese el nombre"
                            required
                            aria-invalid={!!(touched['nombre'] && fieldError('nombre'))}
                            aria-describedby="error-nombre"
                        />
                        {touched['nombre'] && fieldError('nombre') && (
                            <span id="error-nombre" className="field-error">{fieldError('nombre')}</span>
                        )}
                    </div>
                    <div className="form-group">
                        <label htmlFor="apellidos">
                            <User size={16} />
                            Apellidos *
                        </label>
                        <input
                            id="apellidos"
                            type="text"
                            value={formData.apellidos}
                            onChange={(e) => updateFormData('apellidos', e.target.value)}
                            onBlur={() => markTouched('apellidos')}
                            ref={el => { if (touched['apellidos'] && fieldError('apellidos') && !firstErrorRef.current) firstErrorRef.current = el; }}
                            className={`form-input ${touched['apellidos'] && fieldError('apellidos') ? 'input-error' : ''}`}
                            placeholder="Ingrese los apellidos"
                            required
                            aria-invalid={!!(touched['apellidos'] && fieldError('apellidos'))}
                            aria-describedby="error-apellidos"
                        />
                        {touched['apellidos'] && fieldError('apellidos') && (
                            <span id="error-apellidos" className="field-error">{fieldError('apellidos')}</span>
                        )}
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="cedula">
                            <Hash size={16} />
                            Cédula
                        </label>
                        <input
                            id="cedula"
                            type="text"
                            value={formData.cedula}
                            onChange={(e) => updateFormData('cedula', e.target.value)}
                            onBlur={() => markTouched('cedula')}
                            ref={el => { if (touched['cedula'] && fieldError('cedula') && !firstErrorRef.current) firstErrorRef.current = el; }}
                            className={`form-input ${touched['cedula'] && fieldError('cedula') ? 'input-error' : ''}`}
                            placeholder="000-0000000-0"
                            aria-invalid={!!(touched['cedula'] && fieldError('cedula'))}
                            aria-describedby="error-cedula"
                        />
                        {touched['cedula'] && fieldError('cedula') && (
                            <span id="error-cedula" className="field-error">{fieldError('cedula')}</span>
                        )}
                    </div>
                    <div className="form-group">
                        <label htmlFor="fecha_ingreso">
                            <Calendar size={16} />
                            Fecha Suscripción (DD/MM/YYYY)
                        </label>
                        <input
                            id="fecha_ingreso"
                            type="text"
                            value={formData.fecha_ingreso}
                            onChange={(e) => updateFormData('fecha_ingreso', e.target.value)}
                            onBlur={() => markTouched('fecha_ingreso')}
                            ref={el => { if (touched['fecha_ingreso'] && fieldError('fecha_ingreso') && !firstErrorRef.current) firstErrorRef.current = el; }}
                            className={`form-input ${touched['fecha_ingreso'] && fieldError('fecha_ingreso') ? 'input-error' : ''}`}
                            placeholder="DD/MM/YYYY"
                            aria-invalid={!!(touched['fecha_ingreso'] && fieldError('fecha_ingreso'))}
                            aria-describedby="error-fecha_ingreso"
                        />
                        {touched['fecha_ingreso'] && fieldError('fecha_ingreso') && (
                            <span id="error-fecha_ingreso" className="field-error">{fieldError('fecha_ingreso')}</span>
                        )}
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="sexo">
                            <UserCheck size={16} />
                            Sexo
                        </label>
                        <select
                            id="sexo"
                            value={formData.sexo}
                            onChange={(e) => updateFormData('sexo', e.target.value)}
                            className="form-input"
                        >
                            <option value="">Seleccionar...</option>
                            <option value="MASCULINO">Masculino</option>
                            <option value="FEMENINO">Femenino</option>
                            <option value="OTRO">Otro</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StepPersonal;
