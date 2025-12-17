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

export interface StepProps {
  formData: ClientFormData;
  updateFormData: (field: keyof ClientFormData, value: string | number) => void;
  markTouched: (field: keyof ClientFormData) => void;
  touched: Record<string, boolean>;
  fieldError: (name: keyof ClientFormData) => string | null;
  firstErrorRef: React.MutableRefObject<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null>;
}
