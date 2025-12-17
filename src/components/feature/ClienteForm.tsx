import React, { useState, useEffect } from 'react';
import Button from '../ui/Button';
import { formatearMonto } from '../../utils/montoUtils';
import { ddmmyyyyToISODateTime, isValidDDMMYYYY } from '../../utils/dateUtils';
import { Upload, X } from 'lucide-react';
import './ClienteForm.css';

export interface ClientFormData {
  // Step 1: Información Personal
  nombre: string;
  apellidos: string;
  cedula: string;
  fecha_ingreso: string;
  sexo: 'MASCULINO' | 'FEMENINO' | 'OTRO' | '';
  
  // Step 2: Información de Contacto
  telefono: string;
  telefono_secundario: string;
  email: string;
  contacto: string;
  contacto_emergencia: string;
  telefono_emergencia: string;
  
  // Step 3: Dirección
  direccion: string;
  sector_barrio: string;
  ciudad: string;
  provincia: string;
  codigo_postal: string;
  coordenadas_lat: string;
  coordenadas_lng: string;
  referencia_direccion: string;
  
  // Step 4: Detalles del Cliente
  tipo_cliente: string;
  categoria_cliente: 'NUEVO' | 'VIEJO' | 'VIP' | 'INACTIVO';
  estado: string;
  limite_crediticio: number;
  dias_credito: number;
  descuento_porcentaje: number;
  referido_por: string;
  notas: string;
  
  // Step 5: Confirmación
  foto_url: string;
}

interface ClienteFormProps {
  initialData?: Partial<ClientFormData>;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  isEditing: boolean;
}

const ClienteForm: React.FC<ClienteFormProps> = ({ initialData, onSubmit, onCancel, isEditing }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ClientFormData>({
    nombre: '',
    apellidos: '',
    cedula: '',
    fecha_ingreso: '',
    sexo: '',
    telefono: '',
    telefono_secundario: '',
    email: '',
    contacto: '',
    contacto_emergencia: '',
    telefono_emergencia: '',
    direccion: '',
    sector_barrio: '',
    ciudad: '',
    provincia: '',
    codigo_postal: '',
    coordenadas_lat: '',
    coordenadas_lng: '',
    referencia_direccion: '',
    tipo_cliente: 'residencial',
    categoria_cliente: 'NUEVO',
    estado: 'activo',
    limite_crediticio: 0,
    dias_credito: 0,
    descuento_porcentaje: 0,
    referido_por: '',
    notas: '',
    foto_url: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedPhoto, setUploadedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const totalSteps = 5;

  useEffect(() => {
    // Resetear paso al inicio cuando se abre el modal
    setCurrentStep(1);
    
    if (initialData && Object.keys(initialData).length > 0) {
      // Merge initialData with formData
      const processedData: Partial<ClientFormData> = {};
      
      // Procesar cada campo desde initialData
      for (const key in initialData) {
        const value = (initialData as any)[key];
        
        if (value !== undefined && value !== null && value !== '') {
          processedData[key as keyof ClientFormData] = value as any;
        }
      }
      
      // Actualizar foto preview si existe
      if (processedData.foto_url) {
        setPhotoPreview(processedData.foto_url as string);
      } else {
        setPhotoPreview(null);
      }
      
      setFormData(prev => ({ ...prev, ...processedData }));
    } else {
      // Si no hay initialData, resetear el formulario
      setFormData({
        nombre: '',
        apellidos: '',
        cedula: '',
        fecha_ingreso: '',
        sexo: '',
        telefono: '',
        telefono_secundario: '',
        email: '',
        contacto: '',
        contacto_emergencia: '',
        telefono_emergencia: '',
        direccion: '',
        sector_barrio: '',
        ciudad: '',
        provincia: '',
        codigo_postal: '',
        coordenadas_lat: '',
        coordenadas_lng: '',
        referencia_direccion: '',
        tipo_cliente: 'residencial',
        categoria_cliente: 'NUEVO',
        estado: 'activo',
        limite_crediticio: 0,
        dias_credito: 0,
        descuento_porcentaje: 0,
        referido_por: '',
        notas: '',
        foto_url: '',
      });
      setPhotoPreview(null);
      setUploadedPhoto(null);
    }
  }, [initialData]);

  const updateFormData = (field: keyof ClientFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return formData.nombre.trim() !== '' && formData.apellidos.trim() !== '';
      case 2:
        return true;
      case 3:
        return true;
      case 4:
        return true;
      case 5:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleFileUpload = async (file: File): Promise<string | null> => {
    try {
      setUploadingPhoto(true);
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/upload`, {
        method: 'POST',
        headers,
        body: formDataUpload,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.filePath;
    } catch (error) {
      console.error('Error uploading file:', error);
      setError('Error al subir la foto del cliente');
      return null;
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Solo se permiten archivos de imagen');
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError('La imagen no puede ser mayor a 5MB');
        return;
      }

      setUploadedPhoto(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setUploadedPhoto(null);
    setPhotoPreview(null);
    updateFormData('foto_url', '');
    // Clear the file input
    const fileInput = document.getElementById('photo-upload-form') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      let photoUrl = formData.foto_url;

      // Upload photo if one was selected
      if (uploadedPhoto) {
        const uploadedPath = await handleFileUpload(uploadedPhoto);
        if (uploadedPath) {
          photoUrl = uploadedPath;
        }
      }

      // Format fecha_ingreso properly for Prisma
      let fechaIngresoFormatted = undefined;
      if (formData.fecha_ingreso) {
        if (!isValidDDMMYYYY(formData.fecha_ingreso)) {
          throw new Error('Fecha de Ingreso inválida. Use formato DD/MM/YYYY');
        }
        fechaIngresoFormatted = ddmmyyyyToISODateTime(formData.fecha_ingreso);
      }

      const clientData = {
        // Basic personal info
        nombre: formData.nombre,
        apellidos: formData.apellidos,
        cedula: formData.cedula || undefined,
        fecha_ingreso: fechaIngresoFormatted,
        sexo: formData.sexo === '' ? undefined : formData.sexo,
        fotoUrl: photoUrl || undefined,

        // Contact info
        telefono: formData.telefono || undefined,
        telefonoSecundario: formData.telefono_secundario || undefined,
        email: formData.email || undefined,
        contacto: formData.contacto || undefined,
        contactoEmergencia: formData.contacto_emergencia || undefined,
        telefonoEmergencia: formData.telefono_emergencia || undefined,

        // Address info
        direccion: formData.direccion || undefined,
        sector_barrio: formData.sector_barrio || undefined,
        ciudad: formData.ciudad || undefined,
        provincia: formData.provincia || undefined,
        codigoPostal: formData.codigo_postal || undefined,
        coordenadasLat: formData.coordenadas_lat ? parseFloat(formData.coordenadas_lat) : undefined,
        coordenadasLng: formData.coordenadas_lng ? parseFloat(formData.coordenadas_lng) : undefined,
        referenciaDireccion: formData.referencia_direccion || undefined,

        // Client details
        tipoCliente: formData.tipo_cliente,
        categoria_cliente: formData.categoria_cliente,
        estado: formData.estado,
        limiteCrediticio: formData.limite_crediticio,
        diasCredito: formData.dias_credito,
        descuentoPorcentaje: formData.descuento_porcentaje,
        referidoPorId: formData.referido_por || undefined,
        notas: formData.notas || undefined,
      };

      await onSubmit(clientData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el cliente');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="step-indicator">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map(step => (
        <div
          key={step}
          className={`step ${step === currentStep ? 'active' : step < currentStep ? 'completed' : ''}`}
        >
          <span className="step-number">{step}</span>
          <span className="step-label">
            {step === 1 && 'Información Personal'}
            {step === 2 && 'Contacto'}
            {step === 3 && 'Dirección'}
            {step === 4 && 'Detalles'}
            {step === 5 && 'Confirmación'}
          </span>
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="step-content">
      <h3>Información Personal</h3>
      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="nombre">Nombre *</label>
          <input
            id="nombre"
            type="text"
            value={formData.nombre}
            onChange={(e) => updateFormData('nombre', e.target.value)}
            className="form-input"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="apellidos">Apellidos *</label>
          <input
            id="apellidos"
            type="text"
            value={formData.apellidos}
            onChange={(e) => updateFormData('apellidos', e.target.value)}
            className="form-input"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="cedula">Cédula</label>
          <input
            id="cedula"
            type="text"
            value={formData.cedula}
            onChange={(e) => updateFormData('cedula', e.target.value)}
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label htmlFor="fecha_ingreso">Fecha de Ingreso</label>
          <input
            id="fecha_ingreso"
            type="text"
            value={formData.fecha_ingreso}
            onChange={(e) => {
              const value = e.target.value;
              updateFormData('fecha_ingreso', value);
            }}
            onBlur={(e) => {
              const value = e.target.value;
              if (value && !isValidDDMMYYYY(value)) {
                Swal.fire('Formato inválido', 'Por favor, ingrese la fecha en formato DD/MM/YYYY', 'warning');
                updateFormData('fecha_ingreso', '');
              }
            }}
            className="form-input"
            placeholder="DD/MM/YYYY"
          />
        </div>
        <div className="form-group">
          <label htmlFor="sexo">Sexo</label>
          <select
            id="sexo"
            value={formData.sexo}
            onChange={(e) => updateFormData('sexo', e.target.value as any)}
            className="form-input"
          >
            <option value="">Seleccione</option>
            <option value="MASCULINO">Masculino</option>
            <option value="FEMENINO">Femenino</option>
            <option value="OTRO">Otro</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="step-content">
      <h3>Información de Contacto</h3>
      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="telefono">Teléfono Principal *</label>
          <input
            id="telefono"
            type="tel"
            value={formData.telefono}
            onChange={(e) => updateFormData('telefono', e.target.value)}
            className="form-input"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="telefono_secundario">Teléfono Secundario</label>
          <input
            id="telefono_secundario"
            type="tel"
            value={formData.telefono_secundario}
            onChange={(e) => updateFormData('telefono_secundario', e.target.value)}
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => updateFormData('email', e.target.value)}
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label htmlFor="contacto">Contacto</label>
          <input
            id="contacto"
            type="text"
            value={formData.contacto}
            onChange={(e) => updateFormData('contacto', e.target.value)}
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label htmlFor="contacto_emergencia">Contacto de Emergencia</label>
          <input
            id="contacto_emergencia"
            type="text"
            value={formData.contacto_emergencia}
            onChange={(e) => updateFormData('contacto_emergencia', e.target.value)}
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label htmlFor="telefono_emergencia">Teléfono de Emergencia</label>
          <input
            id="telefono_emergencia"
            type="tel"
            value={formData.telefono_emergencia}
            onChange={(e) => updateFormData('telefono_emergencia', e.target.value)}
            className="form-input"
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="step-content">
      <h3>Dirección</h3>
      <div className="form-grid">
        <div className="form-group full-width">
          <label htmlFor="direccion">Dirección Completa</label>
          <textarea
            id="direccion"
            value={formData.direccion}
            onChange={(e) => updateFormData('direccion', e.target.value)}
            className="form-input"
            rows={3}
          />
        </div>
        <div className="form-group">
          <label htmlFor="sector_barrio">Sector/Barrio</label>
          <input
            id="sector_barrio"
            type="text"
            value={formData.sector_barrio}
            onChange={(e) => updateFormData('sector_barrio', e.target.value)}
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label htmlFor="ciudad">Ciudad</label>
          <input
            id="ciudad"
            type="text"
            value={formData.ciudad}
            onChange={(e) => updateFormData('ciudad', e.target.value)}
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label htmlFor="provincia">Provincia</label>
          <input
            id="provincia"
            type="text"
            value={formData.provincia}
            onChange={(e) => updateFormData('provincia', e.target.value)}
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label htmlFor="codigo_postal">Código Postal</label>
          <input
            id="codigo_postal"
            type="text"
            value={formData.codigo_postal}
            onChange={(e) => updateFormData('codigo_postal', e.target.value)}
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label htmlFor="coordenadas_lat">Latitud</label>
          <input
            id="coordenadas_lat"
            type="text"
            value={formData.coordenadas_lat}
            onChange={(e) => updateFormData('coordenadas_lat', e.target.value)}
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label htmlFor="coordenadas_lng">Longitud</label>
          <input
            id="coordenadas_lng"
            type="text"
            value={formData.coordenadas_lng}
            onChange={(e) => updateFormData('coordenadas_lng', e.target.value)}
            className="form-input"
          />
        </div>
        <div className="form-group full-width">
          <label htmlFor="referencia_direccion">Referencia de Dirección</label>
          <textarea
            id="referencia_direccion"
            value={formData.referencia_direccion}
            onChange={(e) => updateFormData('referencia_direccion', e.target.value)}
            className="form-input"
            rows={2}
          />
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="step-content">
      <h3>Detalles del Cliente</h3>
      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="tipo_cliente">Tipo de Cliente</label>
          <select
            id="tipo_cliente"
            value={formData.tipo_cliente}
            onChange={(e) => updateFormData('tipo_cliente', e.target.value)}
            className="form-input"
          >
            <option value="residencial">Residencial</option>
            <option value="empresarial">Empresarial</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="categoria_cliente">Categoría</label>
          <select
            id="categoria_cliente"
            value={formData.categoria_cliente}
            onChange={(e) => updateFormData('categoria_cliente', e.target.value as any)}
            className="form-input"
          >
            <option value="NUEVO">Nuevo</option>
            <option value="VIEJO">Viejo</option>
            <option value="VIP">VIP</option>
            <option value="INACTIVO">Inactivo</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="estado">Estado</label>
          <select
            id="estado"
            value={formData.estado}
            onChange={(e) => updateFormData('estado', e.target.value)}
            className="form-input"
          >
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
            <option value="suspendido">Suspendido</option>
            <option value="moroso">Moroso</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="limite_crediticio">Límite Crediticio (DOP)</label>
          <input
            id="limite_crediticio"
            type="number"
            value={formData.limite_crediticio}
            onChange={(e) => updateFormData('limite_crediticio', parseFloat(e.target.value) || 0)}
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label htmlFor="dias_credito">Días de Crédito</label>
          <input
            id="dias_credito"
            type="number"
            value={formData.dias_credito}
            onChange={(e) => updateFormData('dias_credito', parseInt(e.target.value) || 0)}
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label htmlFor="descuento_porcentaje">Descuento (%)</label>
          <input
            id="descuento_porcentaje"
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={formData.descuento_porcentaje}
            onChange={(e) => updateFormData('descuento_porcentaje', parseFloat(e.target.value) || 0)}
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label htmlFor="referido_por">Referido Por (ID)</label>
          <input
            id="referido_por"
            type="text"
            value={formData.referido_por}
            onChange={(e) => updateFormData('referido_por', e.target.value)}
            className="form-input"
          />
        </div>
        <div className="form-group full-width">
          <label htmlFor="notas">Notas</label>
          <textarea
            id="notas"
            value={formData.notas}
            onChange={(e) => updateFormData('notas', e.target.value)}
            className="form-input"
            rows={3}
          />
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="step-content">
      <h3>Confirmación</h3>
      <div className="confirmation-summary">
        <div className="summary-section">
          <h4>Información Personal</h4>
          <p><strong>Nombre:</strong> {formData.nombre} {formData.apellidos}</p>
          {formData.cedula && <p><strong>Cédula:</strong> {formData.cedula}</p>}
          {formData.fecha_ingreso && <p><strong>Fecha de Ingreso:</strong> {formData.fecha_ingreso}</p>}
          {formData.sexo && <p><strong>Sexo:</strong> {formData.sexo}</p>}
        </div>

        <div className="summary-section">
          <h4>Contacto</h4>
          {formData.telefono && <p><strong>Teléfono:</strong> {formData.telefono}</p>}
          {formData.email && <p><strong>Email:</strong> {formData.email}</p>}
          {formData.contacto && <p><strong>Contacto:</strong> {formData.contacto}</p>}
        </div>

        <div className="summary-section">
          <h4>Dirección</h4>
          {formData.direccion && <p><strong>Dirección:</strong> {formData.direccion}</p>}
          {formData.ciudad && <p><strong>Ciudad:</strong> {formData.ciudad}</p>}
          {formData.provincia && <p><strong>Provincia:</strong> {formData.provincia}</p>}
        </div>

        <div className="summary-section">
          <h4>Detalles del Cliente</h4>
          <p><strong>Tipo:</strong> {formData.tipo_cliente}</p>
          <p><strong>Categoría:</strong> {formData.categoria_cliente}</p>
          <p><strong>Estado:</strong> {formData.estado}</p>
          {formData.limite_crediticio > 0 && <p><strong>Límite Crédito:</strong> {formatearMonto(formData.limite_crediticio)}</p>}
        </div>

        {/* Photo Upload Section */}
        <div className="form-group">
          <label>Foto del Cliente (opcional)</label>

          {/* File Upload Area */}
          <div className="file-upload-area">
            <input
              id="photo-upload-form"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />

            {!photoPreview ? (
              <div
                className="upload-zone"
                onClick={() => document.getElementById('photo-upload-form')?.click()}
                style={{
                  border: '2px dashed var(--colors-border)',
                  borderRadius: '8px',
                  padding: '2rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: 'var(--colors-background-secondary)',
                  transition: 'all 0.3s ease'
                }}
              >
                <Upload size={48} style={{ color: 'var(--colors-text-secondary)', marginBottom: '1rem' }} />
                <p style={{ margin: '0 0 0.5rem 0', color: 'var(--colors-text-secondary)' }}>
                  Haz clic para subir una foto
                </p>
                <p style={{ margin: '0', fontSize: '0.9rem', color: 'var(--colors-text-secondary)' }}>
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
                    borderRadius: '8px',
                    border: '1px solid var(--colors-border)'
                  }}
                />
                <button
                  type="button"
                  onClick={removePhoto}
                  style={{
                    position: 'absolute',
                    top: '5px',
                    right: '5px',
                    backgroundColor: 'var(--colors-error-main)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '30px',
                    height: '30px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Eliminar foto"
                >
                  <X size={16} />
                </button>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: 'var(--colors-text-secondary)' }}>
                  {uploadedPhoto?.name || 'Foto seleccionada'}
                </p>
              </div>
            )}

            {uploadingPhoto && (
              <div style={{
                marginTop: '1rem',
                padding: '1rem',
                backgroundColor: 'var(--colors-background-secondary)',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <span className="material-icons" style={{ animation: 'spin 1s linear infinite' }}>refresh</span>
                  <span>Subiendo foto...</span>
                </div>
              </div>
            )}
          </div>

          {/* Alternative URL input */}
          <div style={{ marginTop: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--colors-text-secondary)' }}>
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
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      default: return null;
    }
  };

  return (
    <div className="cliente-nuevo">
      <div className="form-header">
        <h1>{isEditing ? 'Editar Cliente' : 'Crear Nuevo Cliente'}</h1>
        <p>Complete la información del cliente paso a paso</p>
      </div>

      {renderStepIndicator()}

      <div className="form-container">
        {renderCurrentStep()}

        {error && (
          <div className="error-message">
            <span className="material-icons">error</span>
            {error}
          </div>
        )}

        <div className="form-navigation">
          <Button
            onClick={currentStep === 1 ? onCancel : handlePrevious}
            disabled={loading}
            className="secondary"
          >
            <span className="material-icons">arrow_back</span>
            {currentStep === 1 ? 'Cancelar' : 'Anterior'}
          </Button>

          <div className="step-counter">
            Paso {currentStep} de {totalSteps}
          </div>

          {currentStep < totalSteps ? (
            <Button
              onClick={handleNext}
              disabled={!validateStep(currentStep)}
              className="primary"
            >
              Siguiente
              <span className="material-icons">arrow_forward</span>
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="success"
            >
              {loading ? 'Guardando...' : 'Guardar Cambios'}
              <span className="material-icons">check</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClienteForm;