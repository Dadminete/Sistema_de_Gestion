import React from 'react';
import { MapPin, Home, Building, Hash, FileText } from 'lucide-react';
import type { StepProps } from './types';

const StepAddress: React.FC<StepProps> = ({
    formData,
    updateFormData
}) => {
    return (
        <div className="step-content">
            <div className="step-header">
                <div className="step-icon">
                    <MapPin size={24} />
                </div>
                <div>
                    <h3>Dirección</h3>
                    <p>Ubicación y detalles geográficos</p>
                </div>
            </div>

            <div className="form-section">
                <div className="form-row">
                    <div className="form-group full-width">
                        <label htmlFor="direccion">
                            <Home size={16} />
                            Dirección Completa
                        </label>
                        <textarea
                            id="direccion"
                            value={formData.direccion}
                            onChange={(e) => updateFormData('direccion', e.target.value)}
                            className="form-input"
                            rows={3}
                            placeholder="Calle Principal #123, Apartamento 4B, Torre Empresarial..."
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="sector_barrio">
                            <Building size={16} />
                            Sector/Barrio
                        </label>
                        <input
                            id="sector_barrio"
                            type="text"
                            value={formData.sector_barrio}
                            onChange={(e) => updateFormData('sector_barrio', e.target.value)}
                            className="form-input"
                            placeholder="Ej: Villa Consuelo"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="ciudad">
                            <Building size={16} />
                            Ciudad
                        </label>
                        <input
                            id="ciudad"
                            type="text"
                            value={formData.ciudad}
                            onChange={(e) => updateFormData('ciudad', e.target.value)}
                            className="form-input"
                            placeholder="Ej: Santo Domingo"
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="provincia">
                            <MapPin size={16} />
                            Provincia
                        </label>
                        <input
                            id="provincia"
                            type="text"
                            value={formData.provincia}
                            onChange={(e) => updateFormData('provincia', e.target.value)}
                            className="form-input"
                            placeholder="Ej: Distrito Nacional"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="codigo_postal">
                            <Hash size={16} />
                            Código Postal
                        </label>
                        <input
                            id="codigo_postal"
                            type="text"
                            value={formData.codigo_postal}
                            onChange={(e) => updateFormData('codigo_postal', e.target.value)}
                            className="form-input"
                            placeholder="10101"
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="coordenadas_lat">
                            <MapPin size={16} />
                            Latitud (Opcional)
                        </label>
                        <input
                            id="coordenadas_lat"
                            type="number"
                            step="any"
                            value={formData.coordenadas_lat}
                            onChange={(e) => updateFormData('coordenadas_lat', e.target.value)}
                            className="form-input"
                            placeholder="18.4567"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="coordenadas_lng">
                            <MapPin size={16} />
                            Longitud (Opcional)
                        </label>
                        <input
                            id="coordenadas_lng"
                            type="number"
                            step="any"
                            value={formData.coordenadas_lng}
                            onChange={(e) => updateFormData('coordenadas_lng', e.target.value)}
                            className="form-input"
                            placeholder="-69.9876"
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group full-width">
                        <label htmlFor="referencia_direccion">
                            <FileText size={16} />
                            Referencia de Dirección
                        </label>
                        <textarea
                            id="referencia_direccion"
                            value={formData.referencia_direccion}
                            onChange={(e) => updateFormData('referencia_direccion', e.target.value)}
                            className="form-input"
                            rows={2}
                            placeholder="Cerca de la iglesia, edificio azul, frente al supermercado..."
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StepAddress;
