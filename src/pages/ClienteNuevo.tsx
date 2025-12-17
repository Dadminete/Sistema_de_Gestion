import React, { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import { clientService } from '../services/clientService';
import { ddmmyyyyToISODateTime, isValidDDMMYYYY } from '../utils/dateUtils';
import './ClienteNuevo.css';
import StepPersonal from '../components/clients/wizard/StepPersonal';
import StepContact from '../components/clients/wizard/StepContact';
import StepAddress from '../components/clients/wizard/StepAddress';
import StepDetails from '../components/clients/wizard/StepDetails';
import StepConfirmation from '../components/clients/wizard/StepConfirmation';
import type { ClientFormData } from '../components/clients/wizard/types';

const initialFormData: ClientFormData = {
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
};

const ClienteNuevo: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ClientFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const firstErrorRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null>(null);
  const [uploadedPhoto, setUploadedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const totalSteps = 5;

  const updateFormData = (field: keyof ClientFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: typeof value === 'string' ? value : value }));
  };

  const markTouched = (field: keyof ClientFormData) => setTouched(prev => ({ ...prev, [field]: true }));

  const emailRegex = useMemo(() => /^(?:[a-zA-Z0-9_.'+\-]+)@(?:[a-zA-Z0-9\-]+\.)+[a-zA-Z]{2,}$/i, []);
  const phoneRegex = useMemo(() => /^[0-9+()\-\s]{7,20}$/, []);
  const cedulaRegex = useMemo(() => /^(\d{3}-\d{7}-\d{1}|\d{11})$/, []);

  const fieldError = (name: keyof ClientFormData): string | null => {
    const v = formData[name] as any;
    switch (name) {
      case 'nombre':
        return v && String(v).trim().length >= 2 ? null : 'Nombre es obligatorio (mín. 2 caracteres)';
      case 'apellidos':
        return v && String(v).trim().length >= 2 ? null : 'Apellidos es obligatorio (mín. 2 caracteres)';
      case 'email':
        return !v || emailRegex.test(String(v)) ? null : 'Correo inválido';
      case 'telefono':
        return !v || phoneRegex.test(String(v)) ? null : 'Teléfono inválido';
      case 'telefono_secundario':
        return !v || phoneRegex.test(String(v)) ? null : 'Teléfono inválido';
      case 'telefono_emergencia':
        return !v || phoneRegex.test(String(v)) ? null : 'Teléfono inválido';
      case 'cedula':
        return !v || cedulaRegex.test(String(v)) ? null : 'Cédula inválida';
      case 'fecha_ingreso':
        return !v || isValidDDMMYYYY(String(v)) ? null : 'Use formato DD/MM/YYYY';
      case 'descuento_porcentaje':
        return (typeof v === 'number' ? v : parseFloat(v || '0')) <= 100 ? null : 'No puede exceder 100%';
      default:
        return null;
    }
  };

  const formHasErrors = useMemo(() => {
    const keys: (keyof ClientFormData)[] = ['nombre', 'apellidos', 'email', 'telefono', 'telefono_secundario', 'telefono_emergencia', 'cedula', 'fecha_ingreso', 'descuento_porcentaje'];
    return keys.some(k => fieldError(k));
  }, [formData]);

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !fieldError('nombre') && !fieldError('apellidos') && !fieldError('cedula') && !fieldError('fecha_ingreso');
      case 2:
        return !fieldError('email') && !fieldError('telefono') && !fieldError('telefono_secundario') && !fieldError('telefono_emergencia');
      case 3:
        return true;
      case 4:
        return !fieldError('descuento_porcentaje');
      case 5:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    } else {
      // focus first error in current step
      firstErrorRef.current?.focus();
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
    // Clear the file input
    const fileInput = document.getElementById('photo-upload') as HTMLInputElement;
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
        } else {
          throw new Error('Error al subir la foto del cliente. Por favor, inténtelo de nuevo.');
        }
      }

      let fechaSuscripcion = undefined;
      if (formData.fecha_ingreso) {
        if (!isValidDDMMYYYY(formData.fecha_ingreso)) {
          throw new Error('Fecha de Suscripción inválida. Use formato DD/MM/YYYY');
        }
        fechaSuscripcion = ddmmyyyyToISODateTime(formData.fecha_ingreso);
      }

      // Prepare data for API
      const clientData = {
        nombre: formData.nombre,
        apellidos: formData.apellidos,
        email: formData.email || undefined,
        telefono: formData.telefono || undefined,
        direccion: formData.direccion || undefined,
        sector_barrio: formData.sector_barrio || undefined,
        ciudad: formData.ciudad || undefined,
        provincia: formData.provincia || undefined,
        codigoPostal: formData.codigo_postal || undefined,
        coordenadasLat: formData.coordenadas_lat ? parseFloat(formData.coordenadas_lat) : undefined,
        coordenadasLng: formData.coordenadas_lng ? parseFloat(formData.coordenadas_lng) : undefined,
        referenciaDireccion: formData.referencia_direccion || undefined,
        sexo: formData.sexo === '' ? undefined : formData.sexo,
        categoria_cliente: formData.categoria_cliente,
        estado: formData.estado || 'activo',
        fotoUrl: photoUrl || undefined,
        tipoCliente: formData.tipo_cliente,
        cedula: formData.cedula || undefined,
        limiteCrediticio: formData.limite_crediticio,
        diasCredito: formData.dias_credito,
        descuentoPorcentaje: formData.descuento_porcentaje,
        fechaSuscripcion: fechaSuscripcion || undefined,
        referidoPorId: formData.referido_por || undefined,
        notas: formData.notas || undefined,
      } as any;

      await clientService.createClient(clientData);
      navigate('/clients/list');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el cliente');
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
            {step === 1 && 'Personal'}
            {step === 2 && 'Contacto'}
            {step === 3 && 'Dirección'}
            {step === 4 && 'Detalles'}
            {step === 5 && 'Confirmar'}
          </span>
        </div>
      ))}
    </div>
  );

  const commonProps = {
    formData,
    updateFormData,
    markTouched,
    touched,
    fieldError,
    firstErrorRef
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return <StepPersonal {...commonProps} />;
      case 2: return <StepContact {...commonProps} />;
      case 3: return <StepAddress {...commonProps} />;
      case 4: return <StepDetails {...commonProps} />;
      case 5: return (
        <StepConfirmation
          {...commonProps}
          handleFileChange={handleFileChange}
          removePhoto={removePhoto}
          photoPreview={photoPreview}
          uploadedPhoto={uploadedPhoto}
          uploadingPhoto={uploadingPhoto}
        />
      );
      default: return null;
    }
  };

  return (
    <div className="cliente-nuevo">
      <div className="form-header">
        <h1>Crear Nuevo Cliente</h1>
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
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="secondary"
          >
            <span className="material-icons">arrow_back</span>
            Anterior
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
              disabled={loading || formHasErrors}
              className="success"
            >
              {loading ? 'Creando...' : 'Crear Cliente'}
              <span className="material-icons">check</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClienteNuevo;
