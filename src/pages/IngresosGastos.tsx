import React, { useState, useEffect, useMemo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import DataTable from '../components/feature/DataTable';
import Modal from '../components/feature/Modal';
import { useAuth } from '../context/AuthProvider';
import { AuthService } from '../services/authService';
import Swal from 'sweetalert2';
import './IngresosGastos.css';
import { getAllCuentaContables } from '../services/cuentaContableService';
import { formatearMontoConSigno } from '../utils/montoUtils';
import {
  Receipt, Plus, Search, Edit2, Trash2,
  TrendingUp, TrendingDown, Calendar, DollarSign
} from 'lucide-react';

interface CategoriaCuenta {
  id: string;
  nombre: string;
  codigo: string;
  tipo: 'activo' | 'pasivo' | 'patrimonio' | 'ingreso' | 'gasto';
  subtipo?: string | null;
  esDetalle: boolean;
  activa: boolean;
}

interface Bank {
  id: string;
  nombre: string;
}

interface CajaItem {
  id: string;
  nombre: string;
  tipo: string;
  saldoActual: number;
}

interface CuentaBancaria {
  id: string;
  nombre: string;
  saldo: number;
  bankId: string;
}

interface MovimientoContable {
  id: string;
  tipo: 'ingreso' | 'gasto';
  monto: number;
  categoriaId: string;
  metodo: 'caja' | 'banco' | 'papeleria';
  cajaId?: string | null; // Field for caja ID
  bankId?: string | null; // New field for bank
  cuentaBancariaId?: string | null; // New field for bank account
  descripcion?: string | null;
  fecha: string;
  usuarioId?: string; // Add usuarioId field
  usuario?: {
    id: string;
    username: string;
    nombre: string;
    apellido: string;
  };
  cuentaBancaria?: {
    id: string;
    numeroCuenta: string;
    nombreOficialCuenta?: string;
  };
}

const IngresosGastos: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [tipo, setTipo] = useState<'ingreso' | 'gasto'>('ingreso');
  const [monto, setMonto] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [metodo, setMetodo] = useState<'caja' | 'banco' | 'papeleria'>('caja');
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null); // State for selected bank
  const [selectedCuentaBancariaId, setSelectedCuentaBancariaId] = useState<string | null>(null); // State for selected bank account
  const [descripcion, setDescripcion] = useState('');
  const [movimientos, setMovimientos] = useState<MovimientoContable[]>([]);
  const [filterText, setFilterText] = useState('');
  const [allCategoriasCuenta, setAllCategoriasCuenta] = useState<CategoriaCuenta[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]); // State for banks
  const [cuentasBancarias, setCuentasBancarias] = useState<CuentaBancaria[]>([]); // State for bank accounts
  const [cajasDisponibles, setCajasDisponibles] = useState<CajaItem[]>([]); // State for available cajas
  const [selectedCajaId, setSelectedCajaId] = useState<string | null>(null); // Selected caja ID
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMovimiento, setEditingMovimiento] = useState<MovimientoContable | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<MovimientoContable>>({});
  const [isBackdateModalOpen, setIsBackdateModalOpen] = useState(false);
  const [backdate, setBackdate] = useState(new Date());
  
  // Estados para mostrar balances actuales
  const [saldoCajaActual, setSaldoCajaActual] = useState<number>(0);
  const [saldoPapeleriaActual, setSaldoPapeleriaActual] = useState<number>(0);
  const [loadingBalance, setLoadingBalance] = useState<boolean>(false);

  const can = (permission: string) => {
    if (!user) return false;
    return user.permissions.includes(permission);
  };

  const isAdmin = () => {
    if (!user) {
      console.log('🔍 DEBUG isAdmin: No user');
      return false;
    }

    // 🔍 DEBUG: Mostrar estructura del usuario
    console.log('🔍 DEBUG isAdmin: Usuario:', {
      username: user.username,
      roles: user.roles,
      permissions: user.permissions?.slice(0, 3) // Solo primeros 3 para no llenar el log
    });

    const hasAdminRole = user.roles?.includes('Administrador');
    const hasGestionarUsuarios = user.permissions?.includes('gestionar_usuarios');
    const hasGestionarRoles = user.permissions?.includes('gestionar_roles');
    const hasSistemaPermisos = user.permissions?.includes('sistema.permisos');

    console.log('🔍 DEBUG isAdmin checks:', {
      hasAdminRole,
      hasGestionarUsuarios,
      hasGestionarRoles,
      hasSistemaPermisos
    });

    const result = hasAdminRole || hasGestionarUsuarios || hasGestionarRoles || hasSistemaPermisos;
    console.log('🔍 DEBUG isAdmin result:', result);

    return result;
  };


  const getAuthHeaders = (contentType: string = 'application/json'): HeadersInit => {
    const token = AuthService.getToken();
    const headers: Record<string, string> = {
      'Content-Type': contentType,
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  const filteredCategorias = useMemo(() => {
    console.log('🔍 DEBUG filteredCategorias: Iniciando filtrado');
    console.log('🔍 DEBUG filteredCategorias: tipo =', tipo);
    console.log('🔍 DEBUG filteredCategorias: allCategoriasCuenta.length =', allCategoriasCuenta.length);

    let categorias: CategoriaCuenta[] = [];
    if (tipo === 'ingreso') {
      categorias = allCategoriasCuenta.filter(cat => ['ingreso', 'activo', 'patrimonio'].includes(cat.tipo.toLowerCase()));
    } else { // tipo === 'gasto'
      categorias = allCategoriasCuenta.filter(cat => ['gasto', 'pasivo'].includes(cat.tipo.toLowerCase()));
    }

    console.log('🔍 DEBUG filteredCategorias: categorias por tipo =', categorias.length);

    // Buscar categorías de ajustes
    const categoriasAjustes = categorias.filter(cat =>
      cat.subtipo && cat.subtipo.toLowerCase().includes('ajustes y correcciones')
    );
    console.log('🔍 DEBUG filteredCategorias: categorías de ajustes encontradas =', categoriasAjustes.length);
    categoriasAjustes.forEach(cat => {
      console.log('  -', cat.nombre, '(' + cat.subtipo + ')');
    });

    // 🔒 SEGURIDAD: Solo mostrar categorías de ajustes a administradores
    const adminResult = isAdmin();
    console.log('🔍 DEBUG filteredCategorias: isAdmin() =', adminResult);

    if (!adminResult) {
      const beforeFilter = categorias.length;
      categorias = categorias.filter(cat =>
        !cat.subtipo ||
        !cat.subtipo.toLowerCase().includes('ajustes y correcciones')
      );
      console.log('🔍 DEBUG filteredCategorias: Filtradas de', beforeFilter, 'a', categorias.length);
    }

    // Ordenar alfabéticamente por nombre
    categorias.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));

    return categorias;
  }, [tipo, allCategoriasCuenta, user]);

  useEffect(() => {
    if (filteredCategorias.length > 0 && !filteredCategorias.some(cat => cat.id === categoriaId)) {
      setCategoriaId(filteredCategorias[0].id); // Set default if current category is not in filtered list
    } else if (filteredCategorias.length === 0) {
      setCategoriaId(''); // Clear if no categories
    }
  }, [filteredCategorias, categoriaId]);

  const fetchCategorias = async () => {
    if (!isAuthenticated) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/contabilidad/categorias-cuentas`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setAllCategoriasCuenta(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      Swal.fire('Error', 'Error al cargar las categorías de cuenta. Asegúrate de que el servidor backend esté funcionando y estés autenticado.', 'error');
    }
  };

  const fetchBanks = async () => {
    if (!isAuthenticated) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/banks`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setBanks(data);
      if (data.length > 0) {
        setSelectedBankId(data[0].id); // Set default selected bank
      }
    } catch (error) {
      console.error('Error fetching banks:', error);
      Swal.fire('Error', 'Error al cargar los bancos. Asegúrate de que el servidor backend esté funcionando y estés autenticado.', 'error');
    }
  };

  const fetchCajasDisponibles = async () => {
    if (!isAuthenticated) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/cajas`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const cajasActivas = data.filter((caja: CajaItem) => caja.tipo !== 'banco'); // Excluir cajas de tipo banco
      setCajasDisponibles(cajasActivas);
      
      // Establecer caja por defecto
      if (cajasActivas.length > 0) {
        // Buscar Caja Principal primero, si no existe usar la primera
        const cajaPrincipal = cajasActivas.find((caja: CajaItem) => 
          caja.nombre.toLowerCase().includes('principal') || caja.tipo === 'general'
        );
        setSelectedCajaId(cajaPrincipal ? cajaPrincipal.id : cajasActivas[0].id);
      }
    } catch (error) {
      console.error('Error fetching cajas:', error);
      Swal.fire('Error', 'Error al cargar las cajas. Asegúrate de que el servidor backend esté funcionando y estés autenticado.', 'error');
    }
  };

  // Function to fetch cuentas contables (for updating balances)
  const fetchCuentas = async () => {
    if (!isAuthenticated) return;
    try {
      await getAllCuentaContables();
    } catch (error) {
      console.error('Error fetching cuentas contables:', error);
      // We don't show an error to the user here as this is just for updating balances
    }
  };

  const fetchCuentasBancarias = async (bankId: string) => {
    if (!isAuthenticated || !bankId) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/banks/${bankId}/accounts`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setCuentasBancarias(data);
      if (data.length > 0) {
        setSelectedCuentaBancariaId(data[0].id); // Set default selected bank account
      } else {
        setSelectedCuentaBancariaId(null);
      }
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
      Swal.fire('Error', 'Error al cargar las cuentas bancarias. Asegúrate de que el servidor backend esté funcionando y estés autenticado.', 'error');
    }
  };

  const fetchMovimientos = async () => {
    if (!isAuthenticated) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/contabilidad/movimientos`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const sortedMovimientos = (data || []).sort((a, b) => {
        // Sort by date descending (most recent first)
        return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
      });
      setMovimientos(sortedMovimientos);
    } catch (error) {
      console.error('Error fetching movimientos:', error);
      Swal.fire('Error', 'Error al cargar los movimientos. Asegúrate de que el servidor backend esté funcionando y estés autenticado.', 'error');
    }
  };

  const fetchCajaBalances = async () => {
    try {
      // Fetch both caja and papeleria balances
      const [cajaResponse, papeleriaResponse] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_BASE_URL}/contabilidad/movimientos/balance/caja`, {
          headers: getAuthHeaders(),
        }),
        fetch(`${import.meta.env.VITE_API_BASE_URL}/contabilidad/movimientos/balance/papeleria`, {
          headers: getAuthHeaders(),
        })
      ]);

      const cajaData = cajaResponse.ok ? await cajaResponse.json() : { balance: 0 };
      const papeleriaData = papeleriaResponse.ok ? await papeleriaResponse.json() : { balance: 0 };

      return {
        caja: cajaData.balance || 0,
        papeleria: papeleriaData.balance || 0,
      };
    } catch (error) {
      console.error('Error obteniendo balances:', error);
      return { caja: 0, papeleria: 0 };
    }
  };

  // Nueva función para actualizar balances cuando cambia el método
  const updateBalanceForMethod = async (metodoPago: 'caja' | 'banco' | 'papeleria') => {
    if (metodoPago === 'caja' || metodoPago === 'papeleria') {
      setLoadingBalance(true);
      try {
        const balances = await fetchCajaBalances();
        setSaldoCajaActual(balances.caja);
        setSaldoPapeleriaActual(balances.papeleria);
      } catch (error) {
        console.error('Error actualizando balances:', error);
      } finally {
        setLoadingBalance(false);
      }
    }
  };

  useEffect(() => {
    fetchCategorias();
    fetchMovimientos();
    fetchBanks();
    fetchCajasDisponibles();
    // Cargar balances iniciales
    updateBalanceForMethod(metodo);
  }, []);

  useEffect(() => {
    if (metodo === 'banco' && selectedBankId) {
      fetchCuentasBancarias(selectedBankId);
    } else {
      setCuentasBancarias([]);
    }
  }, [metodo, selectedBankId]);

  useEffect(() => {
    if (metodo === 'banco' && selectedBankId) {
      fetchCuentasBancarias(selectedBankId);
    } else {
      setCuentasBancarias([]);
      setSelectedCuentaBancariaId(null);
    }
  }, [metodo, selectedBankId]);

  const getBalance = async (method: 'caja' | 'papeleria' | 'banco', id?: string): Promise<number> => {
    if (!isAuthenticated) return 0;
    try {
      let url = '';
      if (method === 'caja' && id) {
        // Obtener balance de una caja específica
        url = `${import.meta.env.VITE_API_BASE_URL}/cajas/${id}/balance`;
      } else if (method === 'caja') {
        url = `${import.meta.env.VITE_API_BASE_URL}/contabilidad/movimientos/balance/caja`;
      } else if (method === 'papeleria') {
        url = `${import.meta.env.VITE_API_BASE_URL}/contabilidad/movimientos/balance/papeleria`;
      } else if (method === 'banco' && id) {
        url = `${import.meta.env.VITE_API_BASE_URL}/contabilidad/movimientos/balance/cuenta-bancaria/${id}`;
      } else {
        return 0;
      }

      const response = await fetch(url, { headers: getAuthHeaders() });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.balance;
    } catch (error) {
      console.error(`Error fetching balance for ${method}:`, error);
      Swal.fire('Error', `Error al obtener el balance de ${method}.`, 'error');
      return 0;
    }
  };

  const handleSubmit = async (e: React.FormEvent, date?: Date) => {
    e.preventDefault();
    const parsedMonto = parseFloat(monto);

    if (!isAuthenticated) {
      Swal.fire('Error', 'Debes iniciar sesión para registrar movimientos.', 'error');
      return;
    }

    if (isNaN(parsedMonto) || parsedMonto <= 0) {
      Swal.fire('Error', 'El monto debe ser un número positivo.', 'error');
      return;
    }

    // Balance check for 'gasto'
    if (tipo === 'gasto') {
      let currentBalance = 0;
      let accountName = '';

      if (metodo === 'caja') {
        // Si hay una caja específica seleccionada, usar su balance
        if (selectedCajaId) {
          const selectedCaja = cajasDisponibles.find(c => c.id === selectedCajaId);
          if (selectedCaja) {
            currentBalance = await getBalance('caja', selectedCaja.id);
            accountName = selectedCaja.nombre;
          } else {
            Swal.fire('Error', 'Por favor, selecciona una caja válida.', 'error');
            return;
          }
        } else {
          currentBalance = await getBalance('caja');
          accountName = 'Caja';
        }
      } else if (metodo === 'papeleria') {
        currentBalance = await getBalance('papeleria');
        accountName = 'Papelería';
      } else if (metodo === 'banco' && selectedCuentaBancariaId) {
        const selectedCuenta = cuentasBancarias.find(cb => cb.id === selectedCuentaBancariaId);
        if (selectedCuenta) {
          currentBalance = await getBalance('banco', selectedCuenta.id);
          accountName = `Cuenta Bancaria: ${selectedCuenta.nombre}`;
        } else {
          Swal.fire('Error', 'Por favor, selecciona una cuenta bancaria válida.', 'error');
          return;
        }
      }

      if (parsedMonto > currentBalance) {
        Swal.fire({
          icon: 'error',
          title: 'Fondos Insuficientes',
          text: `No se puede efectuar el gasto. El monto de $${parsedMonto.toFixed(2)} es mayor que el disponible en ${accountName}. Saldo actual: $${currentBalance.toFixed(2)}.`,
        });
        return;
      }
    }

    const newMovimiento: Omit<MovimientoContable, 'id' | 'fecha'> & { fecha?: string } = {
      tipo,
      monto: parsedMonto,
      categoriaId,
      metodo,
      cajaId: metodo === 'caja' ? selectedCajaId : null,
      bankId: metodo === 'banco' ? selectedBankId : null,
      cuentaBancariaId: metodo === 'banco' ? selectedCuentaBancariaId : null,
      descripcion: descripcion === '' ? null : descripcion,
      usuarioId: user?.id,
    };

    if (date) {
      newMovimiento.fecha = date.toISOString();
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/contabilidad/movimientos`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newMovimiento),
      });

      if (response.ok) {
        const createdMovimiento = await response.json();
        setMovimientos(prev => [...prev, createdMovimiento]);
        Swal.fire('Éxito', 'Movimiento registrado exitosamente.', 'success');
        // Reset form
        setMonto('');
        setCategoriaId(filteredCategorias.length > 0 ? filteredCategorias[0].id : '');
        // Refresh cuentas contables and caja balances to update in real-time
        fetchCuentas();
        fetchCajaBalances();

        // Reset form
        setMonto('');
        setCategoriaId(filteredCategorias.length > 0 ? filteredCategorias[0].id : '');
        setDescripcion('');
        setSelectedBankId(banks.length > 0 ? banks[0].id : null); // Reset bank selection
        setSelectedCuentaBancariaId(null); // Reset bank account selection
        setIsBackdateModalOpen(false); // Close the backdate modal

        // Balances are updated on the backend when a movimiento is created
        // No need to fetch cuentas contables here as they're not displayed in this component

        // Refresh the movimientos list to ensure UI is up to date
        try {
          await fetchMovimientos();
        } catch (refreshError) {
          console.error('Error refreshing movimientos after create:', refreshError);
        }
      } else {
        const errorData = await response.json();
        Swal.fire('Error', `Error al registrar el movimiento: ${errorData.message || response.statusText}`, 'error');
        console.error('Error al registrar el movimiento:', errorData);
      }
    } catch (error) {
      console.error('Error creating movimiento:', error);
      Swal.fire('Error', 'Error de red al registrar el movimiento. Asegúrate de que el servidor backend esté funcionando.', 'error');
    }
  };

  const handleEdit = (movimiento: MovimientoContable) => {
    setEditingMovimiento(movimiento);
    setEditFormData(movimiento);
    setIsEditModalOpen(true);
    
    // Cargar balances al abrir el modal de edición
    fetchCajaBalances();
    
    if (movimiento.metodo === 'banco' && movimiento.bankId) {
      fetchCuentasBancarias(movimiento.bankId);
    }
  };

  const handleDelete = async (movimiento: MovimientoContable) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Quieres eliminar el movimiento de ${movimiento.tipo} por $${Number(movimiento.monto).toFixed(2)}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      if (!isAuthenticated) {
        Swal.fire('Error', 'Debes iniciar sesión para eliminar movimientos.', 'error');
        return;
      }
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/contabilidad/movimientos/${movimiento.id}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });

        if (response.ok) {
          setMovimientos(prev => prev.filter(mov => mov.id !== movimiento.id));
          Swal.fire('Eliminado', 'Movimiento eliminado exitosamente.', 'success');
        } else {
          const errorData = await response.json();
          Swal.fire('Error', `Error al eliminar el movimiento: ${errorData.message || response.statusText}`, 'error');
          console.error('Error al eliminar el movimiento:', errorData);
        }
      } catch (error) {
        console.error('Error deleting movimiento:', error);
        Swal.fire('Error', 'Error de red al eliminar el movimiento. Asegúrate de que el servidor backend esté funcionando.', 'error');
      }
    }
  };

  const handleUpdateMovimiento = async () => {
    if (!editFormData || !editingMovimiento) return;

    if (!isAuthenticated) {
      Swal.fire('Error', 'Debes iniciar sesión para actualizar movimientos.', 'error');
      return;
    }
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/contabilidad/movimientos/${editingMovimiento.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...editFormData,
          descripcion: editFormData.descripcion === '' ? null : editFormData.descripcion,
          usuarioId: user?.id,
        }),
      });
      if (response.ok) {
        const updatedMovimiento = await response.json();
        setMovimientos(prev =>
          prev.map(mov => (mov.id === updatedMovimiento.id ? updatedMovimiento : mov))
        );
        Swal.fire('Actualizado', 'Movimiento actualizado exitosamente.', 'success');
        setIsEditModalOpen(false);
        setEditingMovimiento(null);
      } else {
        const errorData = await response.json();
        Swal.fire('Error', `Error al actualizar el movimiento: ${errorData.message || response.statusText}`, 'error');
        console.error('Error al actualizar el movimiento:', errorData);
      }
    } catch (error) {
      console.error('Error updating movimiento:', error);
      Swal.fire('Error', 'Error de red al actualizar el movimiento. Asegúrate de que el servidor backend esté funcionando.', 'error');
    }
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    if (name === 'bankId' && value) {
      fetchCuentasBancarias(value);
      setEditFormData(prev => ({ ...prev, cuentaBancariaId: '' }));
    }
  };

  const filteredMovimientos = useMemo(() => {
    return movimientos.filter(mov => {
      const categoriaNombre = allCategoriasCuenta.find(cat => cat.id === mov.categoriaId)?.nombre || '';

      // Format date for search
      const formatDateForSearch = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const caracasTime = new Date(date.getTime() - (4 * 60 * 60 * 1000));
        const day = caracasTime.getDate().toString().padStart(2, '0');
        const month = (caracasTime.getMonth() + 1).toString().padStart(2, '0');
        const year = caracasTime.getFullYear();
        let hours = caracasTime.getHours();
        const minutes = caracasTime.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        return `${day}-${month}-${year} ${hours}:${minutes} ${ampm}`;
      };

      const formattedFecha = formatDateForSearch(mov.fecha);

      return categoriaNombre.toLowerCase().includes(filterText.toLowerCase()) ||
        mov.descripcion?.toLowerCase().includes(filterText.toLowerCase()) ||
        mov.tipo.toLowerCase().includes(filterText.toLowerCase()) ||
        mov.fecha.includes(filterText) ||
        formattedFecha.toLowerCase().includes(filterText.toLowerCase()) ||
        mov.metodo.toLowerCase().includes(filterText.toLowerCase()) ||
        mov.cuentaBancaria?.numeroCuenta?.toLowerCase().includes(filterText.toLowerCase()) ||
        mov.usuario?.nombre?.toLowerCase().includes(filterText.toLowerCase()) ||
        mov.usuario?.apellido?.toLowerCase().includes(filterText.toLowerCase()) ||
        mov.usuario?.username?.toLowerCase().includes(filterText.toLowerCase());
    });
  }, [movimientos, filterText, allCategoriasCuenta]);

  const columns: ColumnDef<MovimientoContable>[] = useMemo(() => [
    {
      accessorKey: 'fecha',
      header: 'Fecha',
      cell: info => {
        const dateStr = info.getValue() as string;
        if (!dateStr) return 'N/A';

        const date = new Date(dateStr);
        // Convert to Caracas timezone (UTC-4)
        const caracasTime = new Date(date.getTime() - (4 * 60 * 60 * 1000));

        const day = caracasTime.getDate().toString().padStart(2, '0');
        const month = (caracasTime.getMonth() + 1).toString().padStart(2, '0');
        const year = caracasTime.getFullYear();

        let hours = caracasTime.getHours();
        const minutes = caracasTime.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // Convert 0 to 12

        return `${day}-${month}-${year} ${hours}:${minutes} ${ampm}`;
      },
    },
    {
      accessorKey: 'tipo',
      header: 'Tipo',
      cell: ({ row }) => (
        <span className={`status-badge ${row.original.tipo === 'ingreso' ? 'success' : 'danger'}`}>
          {row.original.tipo === 'ingreso' ? 'Ingreso' : 'Gasto'}
        </span>
      ),
    },
    {
      accessorKey: 'categoriaId',
      header: 'Categoría',
      cell: ({ row }) => {
        const categoria = allCategoriasCuenta.find(cat => cat.id === row.original.categoriaId);
        return categoria ? categoria.nombre : 'N/A';
      },
    },
    {
      accessorKey: 'descripcion',
      header: 'Descripción',
      cell: info => info.getValue() || 'N/A',
    },
    {
      accessorKey: 'monto',
      header: 'Monto',
      cell: ({ row }) => (
        <span style={{ fontWeight: 'bold', color: row.original.tipo === 'ingreso' ? 'var(--colors-success-main)' : 'var(--colors-error-main)' }}>
          {formatearMontoConSigno(row.original.monto, row.original.tipo)}
        </span>
      ),
    },
    {
      accessorKey: 'metodo',
      header: 'Método',
    },
    {
      id: 'cuenta',
      header: 'Cuenta',
      cell: ({ row }) => (
        <span>{row.original.cuentaBancaria ? row.original.cuentaBancaria.numeroCuenta : 'N/A'}</span>
      ),
    },
    {
      id: 'usuario',
      header: 'Usuario',
      cell: ({ row }) => {
        const usuario = row.original.usuario;
        return usuario ? `${usuario.nombre} ${usuario.apellido}` : 'N/A';
      },
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="action-icons">
          <Edit2 size={18} className="icon-edit" onClick={() => handleEdit(row.original)} />
          <Trash2 size={18} className="icon-delete" onClick={() => handleDelete(row.original)} />
        </div>
      ),
    },
  ], [handleEdit, handleDelete, allCategoriasCuenta]);

  return (
    <div className="ingresos-gastos-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="header-content">
          <h1>
            <Receipt className="icon" size={28} />
            Ingresos y Gastos
          </h1>
          <p>Registro y gestión de movimientos contables</p>
        </div>
        <button
          onClick={() => {
            setIsBackdateModalOpen(true);
            fetchCajaBalances();
            // Establecer caja por defecto si no hay ninguna seleccionada
            if (!selectedCajaId && cajasDisponibles.length > 0) {
              const cajaDefault = cajasDisponibles.find(c => 
                c.nombre.toLowerCase().includes('principal') || c.tipo === 'general'
              ) || cajasDisponibles[0];
              setSelectedCajaId(cajaDefault.id);
            }
          }}
          className="btn btn-secondary btn-lg"
        >
          <Calendar size={18} />
          Fecha Anterior
        </button>
      </div>

      {/* Main Form */}
      <div className="form-wrapper">
        <form onSubmit={(e) => handleSubmit(e)} className={`category-form ${tipo === 'gasto' ? 'gasto-form' : 'ingreso-form'}`}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="tipo">
                {tipo === 'ingreso' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                Tipo
              </label>
              <select
                id="tipo"
                name="tipo"
                value={tipo}
                onChange={(e) => {
                  const newTipo = e.target.value as 'ingreso' | 'gasto';
                  setTipo(newTipo);
                }}
                required
              >
                <option value="ingreso">Ingreso</option>
                <option value="gasto">Gasto</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="monto">
                <DollarSign size={14} />
                Monto
              </label>
              <input
                type="number"
                id="monto"
                name="monto"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                min="0.01"
                step="0.01"
                placeholder="0.00"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="categoriaId">Categoría</label>
              <select
                id="categoriaId"
                name="categoriaId"
                value={categoriaId}
                onChange={(e) => setCategoriaId(e.target.value)}
                required
              >
                {filteredCategorias.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="metodo">Método de Pago</label>
              <select
                id="metodo"
                name="metodo"
                value={metodo}
                onChange={(e) => {
                  const nuevoMetodo = e.target.value as 'caja' | 'banco' | 'papeleria';
                  setMetodo(nuevoMetodo);
                  updateBalanceForMethod(nuevoMetodo);
                }}
                required
              >
                <option value="caja">Caja</option>
                <option value="banco">Banco</option>
                <option value="papeleria">Papelería</option>
              </select>
              
              {/* Mostrar saldo actual para caja y papelería */}
              {(metodo === 'caja' || metodo === 'papeleria') && (
                <div className="balance-info" style={{
                  marginTop: '8px',
                  padding: '8px 12px',
                  backgroundColor: '#f0f9ff',
                  borderLeft: '4px solid #0ea5e9',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}>
                  {loadingBalance ? (
                    <span style={{ color: '#6b7280' }}>Cargando saldo...</span>
                  ) : (
                    <span style={{ fontWeight: '500', color: '#1e40af' }}>
                      💰 Saldo actual: ${metodo === 'caja' ? saldoCajaActual.toFixed(2) : saldoPapeleriaActual.toFixed(2)}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {metodo === 'banco' && (
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="bankId">Banco</label>
                <select
                  id="bankId"
                  name="bankId"
                  value={selectedBankId || ''}
                  onChange={(e) => setSelectedBankId(e.target.value)}
                  required={metodo === 'banco'}
                >
                  <option value="">Seleccione un banco</option>
                  {banks.map(bank => (
                    <option key={bank.id} value={bank.id}>{bank.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="cuentaBancariaId">Cuenta Bancaria</label>
                <select
                  id="cuentaBancariaId"
                  name="cuentaBancariaId"
                  value={selectedCuentaBancariaId || ''}
                  onChange={(e) => setSelectedCuentaBancariaId(e.target.value)}
                  required={metodo === 'banco'}
                >
                  <option value="">Seleccione una cuenta</option>
                  {cuentasBancarias.map(cuenta => (
                    <option key={cuenta.id} value={cuenta.id}>
                      {cuenta.nombre} (Saldo: ${(typeof cuenta.saldo === 'string' ? parseFloat(cuenta.saldo) : cuenta.saldo).toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="form-group full-width">
            <label htmlFor="descripcion">Descripción</label>
            <textarea
              id="descripcion"
              name="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={2}
              placeholder="Detalles del movimiento..."
            ></textarea>
          </div>

          <div className="modal-actions">
            <button type="submit" className={`btn ${tipo === 'ingreso' ? 'btn-success' : 'btn-danger'} btn-lg`} style={{ width: '100%' }}>
              <Plus size={16} />
              Registrar {tipo === 'ingreso' ? 'Ingreso' : 'Gasto'}
            </button>
          </div>
        </form>
      </div>

      {/* Data Table */}
      <div className="datatable-wrapper">
        <div className="search-box" style={{ marginBottom: '20px' }}>
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar movimientos..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
        </div>
        <DataTable
          columns={columns}
          data={filteredMovimientos}
          isLoading={false}
          tableName="movimientosContables"
          getRowProps={(row: MovimientoContable) => ({
            className: row.tipo === 'gasto' ? 'gasto-row' : '',
          })}
        />
      </div>

      {isEditModalOpen && editingMovimiento && (
        <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Editar Movimiento">
          <form onSubmit={(e) => { e.preventDefault(); handleUpdateMovimiento(); }}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="edit-tipo">Tipo:</label>
                <select
                  id="edit-tipo"
                  name="tipo"
                  value={editFormData.tipo || ''}
                  onChange={(e) => {
                    const newTipo = e.target.value as 'ingreso' | 'gasto';
                    setEditFormData(prev => ({ ...prev, tipo: newTipo }));
                    // Also update the category dropdown in the modal
                    const newFiltered = (newTipo === 'ingreso'
                      ? allCategoriasCuenta.filter(cat => ['ingreso', 'activo', 'patrimonio'].includes(cat.tipo))
                      : allCategoriasCuenta.filter(cat => ['gasto', 'pasivo'].includes(cat.tipo))
                    ).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
                    if (newFiltered.length > 0) {
                      setEditFormData(prev => ({ ...prev, categoriaId: newFiltered[0].id }));
                    } else {
                      setEditFormData(prev => ({ ...prev, categoriaId: '' }));
                    }
                  }}
                  required
                >
                  <option value="ingreso">Ingreso</option>
                  <option value="gasto">Gasto</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="edit-monto">Monto:</label>
                <input
                  type="number"
                  id="edit-monto"
                  name="monto"
                  value={editFormData.monto || ''}
                  onChange={handleEditFormChange}
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="edit-categoriaId">Categoría:</label>
                <select
                  id="edit-categoriaId"
                  name="categoriaId"
                  value={editFormData.categoriaId || ''}
                  onChange={handleEditFormChange}
                  required
                >
                  {/* Filter categories for the edit modal based on the current editFormData.tipo */}
                  {allCategoriasCuenta
                    .filter(cat => {
                      if (editFormData.tipo === 'ingreso') {
                        return ['ingreso', 'activo', 'patrimonio'].includes(cat.tipo);
                      } else if (editFormData.tipo === 'gasto') {
                        return ['gasto', 'pasivo'].includes(cat.tipo);
                      }
                      return false;
                    })
                    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }))
                    .map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                    ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="edit-metodo">Método:</label>
                <select
                  id="edit-metodo"
                  name="metodo"
                  value={editFormData.metodo || ''}
                  onChange={(e) => {
                    handleEditFormChange(e);
                    const nuevoMetodo = e.target.value as 'caja' | 'banco' | 'papeleria';
                    updateBalanceForMethod(nuevoMetodo);
                  }}
                  required
                >
                  <option value="caja">Caja</option>
                  <option value="banco">Banco</option>
                  <option value="papeleria">Papelería</option>
                </select>
                
                {/* Mostrar saldo actual para caja y papelería */}
                {(editFormData.metodo === 'caja' || editFormData.metodo === 'papeleria') && (
                  <div className="balance-info" style={{
                    marginTop: '8px',
                    padding: '8px 12px',
                    backgroundColor: '#f0f9ff',
                    borderLeft: '4px solid #0ea5e9',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}>
                    {loadingBalance ? (
                      <span style={{ color: '#6b7280' }}>Cargando saldo...</span>
                    ) : (
                      <span style={{ fontWeight: '500', color: '#1e40af' }}>
                        💰 Saldo actual: ${editFormData.metodo === 'caja' ? saldoCajaActual.toFixed(2) : saldoPapeleriaActual.toFixed(2)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {editFormData.metodo === 'banco' && (
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-bankId">Banco:</label>
                  <select
                    id="edit-bankId"
                    name="bankId"
                    value={editFormData.bankId || ''}
                    onChange={handleEditFormChange}
                    required={editFormData.metodo === 'banco'}
                  >
                    <option value="">Seleccione un banco</option>
                    {banks.map(bank => (
                      <option key={bank.id} value={bank.id}>{bank.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="edit-cuentaBancariaId">Cuenta Bancaria:</label>
                  <select
                    id="edit-cuentaBancariaId"
                    name="cuentaBancariaId"
                    value={editFormData.cuentaBancariaId || ''}
                    onChange={handleEditFormChange}
                    required={editFormData.metodo === 'banco'}
                  >
                    <option value="">Seleccione una cuenta</option>
                    {cuentasBancarias
                      .filter(cb => cb.bankId === editFormData.bankId)
                      .map(cuenta => (
                        <option key={cuenta.id} value={cuenta.id}>{cuenta.nombre} (Saldo: ${(typeof cuenta.saldo === 'string' ? parseFloat(cuenta.saldo) : cuenta.saldo).toFixed(2)})</option>
                      ))}
                  </select>
                </div>
              </div>
            )}

            <div className="form-group form-group-full">
              <label htmlFor="edit-descripcion">Descripción:</label>
              <textarea
                id="edit-descripcion"
                name="descripcion"
                value={editFormData.descripcion || ''}
                onChange={handleEditFormChange}
                rows={3}
                placeholder="Detalles del ingreso o gasto"
              ></textarea>
            </div>
            <div className="modal-actions">
              <button type="submit" className="submit-button">Guardar Cambios</button>
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="cancel-button">Cancelar</button>
            </div>
          </form>
        </Modal>
      )}

      {isBackdateModalOpen && (
        <Modal isOpen={isBackdateModalOpen} onClose={() => setIsBackdateModalOpen(false)} title="Registrar Movimiento con Fecha Anterior">
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(e, backdate); }}>
            {/* Fecha first */}
            <div className="form-group form-group-full">
              <label htmlFor="backdate-fecha">Fecha:</label>
              <input
                type="date"
                id="backdate-fecha"
                name="fecha"
                className="date-compact"
                value={(() => {
                  try {
                    return backdate && !isNaN(backdate.getTime()) ? backdate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
                  } catch (e) {
                    return new Date().toISOString().split('T')[0];
                  }
                })()}
                onChange={(e) => {
                  const newDate = new Date(e.target.value);
                  if (!isNaN(newDate.getTime())) {
                    setBackdate(newDate);
                  }
                }}
                required
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="backdate-tipo">Tipo:</label>
                <select
                  id="backdate-tipo"
                  name="tipo"
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as 'ingreso' | 'gasto')}
                  required
                >
                  <option value="ingreso">Ingreso</option>
                  <option value="gasto">Gasto</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="backdate-monto">Monto:</label>
                <input
                  type="number"
                  id="backdate-monto"
                  name="monto"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="backdate-categoriaId">Categoría:</label>
                <select
                  id="backdate-categoriaId"
                  name="categoriaId"
                  value={categoriaId}
                  onChange={(e) => setCategoriaId(e.target.value)}
                  required
                >
                  {filteredCategorias.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="backdate-caja">Caja:</label>
                <select
                  id="backdate-caja"
                  name="cajaId"
                  value={selectedCajaId || ''}
                  onChange={async (e) => {
                    const cajaId = e.target.value;
                    setSelectedCajaId(cajaId);
                    setMetodo('caja'); // Forzar método caja para movimientos históricos
                    
                    // Actualizar balance para la caja seleccionada
                    if (cajaId) {
                      setLoadingBalance(true);
                      try {
                        const balance = await getBalance('caja', cajaId);
                        setSaldoCajaActual(balance);
                      } catch (error) {
                        console.error('Error updating balance:', error);
                      } finally {
                        setLoadingBalance(false);
                      }
                    }
                  }}
                  required
                >
                  <option value="">Seleccione una caja</option>
                  {cajasDisponibles.map(caja => (
                    <option key={caja.id} value={caja.id}>
                      {caja.nombre} - ${caja.saldoActual?.toFixed(2) || '0.00'}
                    </option>
                  ))}
                </select>
                
                {/* Mostrar saldo actual de la caja seleccionada */}
                {selectedCajaId && (
                  <div className="balance-info" style={{
                    marginTop: '8px',
                    padding: '8px 12px',
                    backgroundColor: '#f0f9ff',
                    borderLeft: '4px solid #0ea5e9',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}>
                    {loadingBalance ? (
                      <span style={{ color: '#6b7280' }}>Cargando saldo...</span>
                    ) : (
                      <span style={{ fontWeight: '500', color: '#1e40af' }}>
                        💰 Saldo actual: ${saldoCajaActual.toFixed(2)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {metodo === 'banco' && (
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="backdate-bankId">Banco:</label>
                  <select
                    id="backdate-bankId"
                    name="bankId"
                    value={selectedBankId || ''}
                    onChange={(e) => setSelectedBankId(e.target.value)}
                    required={metodo === 'banco'}
                  >
                    <option value="">Seleccione un banco</option>
                    {banks.map(bank => (
                      <option key={bank.id} value={bank.id}>{bank.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="backdate-cuentaBancariaId">Cuenta Bancaria:</label>
                  <select
                    id="backdate-cuentaBancariaId"
                    name="cuentaBancariaId"
                    value={selectedCuentaBancariaId || ''}
                    onChange={(e) => setSelectedCuentaBancariaId(e.target.value)}
                    required={metodo === 'banco'}
                  >
                    <option value="">Seleccione una cuenta</option>
                    {cuentasBancarias.map(cuenta => (
                      <option key={cuenta.id} value={cuenta.id}>{cuenta.nombre} (Saldo: ${(typeof cuenta.saldo === 'string' ? parseFloat(cuenta.saldo) : cuenta.saldo).toFixed(2)})</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="form-group form-group-full">
              <label htmlFor="backdate-descripcion">Descripción:</label>
              <textarea
                id="backdate-descripcion"
                name="descripcion"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={3}
                placeholder="Detalles del ingreso o gasto"
              ></textarea>
            </div>

            <div className="modal-actions">
              <button type="submit" className="submit-button">Registrar</button>
              <button type="button" onClick={() => setIsBackdateModalOpen(false)} className="cancel-button">Cancelar</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default IngresosGastos;
