import React, { useState, useEffect } from 'react';
import { getAllCajas, abrirCaja, cerrarCaja, getResumenDiario, getUltimaApertura, getDashboardData } from '../services/cajaService';
import { getTotalVentasPapeleria } from '../services/papeleriaService';
import type { Caja, AperturaCaja, CierreCaja, DashboardData } from '../services/cajaService';
import Swal from 'sweetalert2';
import '../styles/AperturaCierre.css';
import StatusCards from '../components/Cajas/StatusCards';
import AperturaForm from '../components/Cajas/AperturaForm';
import CierreForm from '../components/Cajas/CierreForm';

const AperturaCierre: React.FC = () => {
  const [cajas, setCajas] = useState<Caja[]>([]);
  const [totalPapeleria, setTotalPapeleria] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'apertura' | 'cierre'>('apertura');
  const [resumenDiario, setResumenDiario] = useState<Record<string, { ingresos: number; gastos: number }>>({});
  const [cajasAbiertas, setCajasAbiertas] = useState<Record<string, boolean>>({});
  const [dashboardStats, setDashboardStats] = useState<DashboardData['stats'] | null>(null);

  // Estados para apertura
  const [aperturaForm, setAperturaForm] = useState({
    cajas: [] as Array<{
      id: string;
      nombre: string;
      montoInicial: number;
      saldoActual: number;
    }>,
    observaciones: '',
  });

  // Estados para cierre
  const [cierreForm, setCierreForm] = useState({
    cajaId: '',
    montoFinal: 0,
    ingresosDelDia: 0,
    gastosDelDia: 0,
    totalVentasPapeleria: 0,
    observaciones: '',
    montosFinales: {} as Record<string, number>,
    resumenCajas: {} as Record<string, { ingresos: number; gastos: number }>,
  });
  const [montoInicialDia, setMontoInicialDia] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCajasData();
  }, []);

  // Actualizar resumen diario cuando cambian las cajas
  useEffect(() => {
    const fetchResumenes = async () => {
      if (cajas.length === 0) return;

      const today = new Date().toISOString().split('T')[0];
      const nuevosResumenes = { ...resumenDiario };

      for (const caja of cajas) {
        try {
          const resumen = await getResumenDiario(caja.id, today);

          nuevosResumenes[caja.id] = {
            ingresos: resumen.totalIngresos || 0,
            gastos: resumen.totalGastos || 0
          };
        } catch (error) {
          console.error(`[Error] Error obteniendo resumen para caja ${caja.id} (${caja.nombre}):`, error);
          nuevosResumenes[caja.id] = { ingresos: 0, gastos: 0 };
        }
      }

      setResumenDiario(nuevosResumenes);
      // Actualizar también en el form de cierre
      setCierreForm(prev => ({
        ...prev,
        resumenCajas: nuevosResumenes,
      }));
    };

    fetchResumenes();
  }, [cajas]);

  useEffect(() => {
    if (cierreForm.cajaId && activeTab === 'cierre') {
      const fetchResumen = async () => {
        try {
          const today = new Date().toISOString().split('T')[0];
          const resumen = await getResumenDiario(cierreForm.cajaId, today) as {
            totalIngresos: number;
            totalGastos: number;
            totalVentasPapeleria?: number;
          };
          const ultimaApertura = await getUltimaApertura(cierreForm.cajaId);

          setMontoInicialDia(ultimaApertura ? ultimaApertura.montoInicial : 0);

          // Determinar el tipo de caja seleccionada
          const selectedCaja = cajas.find(c => c.id === cierreForm.cajaId);
          const nombreLower = selectedCaja?.nombre.toLowerCase() || '';
          const isCajaPrincipal = nombreLower === 'caja' || nombreLower === 'caja principal' || selectedCaja?.tipo === 'general';
          const isPapeleria = nombreLower.includes('papeler') || selectedCaja?.tipo === 'papeleria';

          // Usar datos específicos de la caja del dashboard
          let ingresosDelDia = 0;
          let gastosDelDia = 0;
          let totalVentasPapeleria = 0;

          if (isCajaPrincipal) {
            ingresosDelDia = dashboardStats?.ingresosHoyCajaPrincipal || resumen.totalIngresos;
            gastosDelDia = dashboardStats?.gastosHoy || resumen.totalGastos;
          } else if (isPapeleria) {
            ingresosDelDia = dashboardStats?.ingresosHoyPapeleria || resumen.totalIngresos;
            gastosDelDia = 0; // Papelería generalmente no tiene gastos directos
            totalVentasPapeleria = dashboardStats?.ingresosHoyPapeleria || resumen.totalVentasPapeleria || 0;
          } else {
            // Para otras cajas, usar resumen diario
            ingresosDelDia = resumen.totalIngresos;
            gastosDelDia = resumen.totalGastos;
          }

          setCierreForm(prev => ({
            ...prev,
            ingresosDelDia: ingresosDelDia,
            gastosDelDia: gastosDelDia,
            totalVentasPapeleria: totalVentasPapeleria,
          }));
        } catch (error) {
          console.error('Error fetching daily summary:', error);
        }
      };
      fetchResumen();
    }
  }, [cierreForm.cajaId, activeTab, dashboardStats, cajas]);

  const fetchCajasData = async () => {
    try {
      const cajasData = await getAllCajas();

      // Fetch papelería total in parallel
      const totalVentas = await getTotalVentasPapeleria();
      setTotalPapeleria(totalVentas);

      if (cajasData && Array.isArray(cajasData)) {
        const activeCajas = cajasData.filter(caja => caja.activa);
        setCajas(activeCajas);

        // Verificar estado de apertura de cada caja
        const estadoCajas: Record<string, boolean> = {};
        for (const caja of activeCajas) {
          try {
            const ultimaApertura = await getUltimaApertura(caja.id);
            // La caja está abierta si hay una apertura y estaAbierta es true
            estadoCajas[caja.id] = ultimaApertura ? (ultimaApertura as any).estaAbierta : false;
          } catch (error) {
            console.error(`Error verificando apertura de caja ${caja.id}:`, error);
            estadoCajas[caja.id] = false;
          }
        }
        setCajasAbiertas(estadoCajas);

        const cajasForm = activeCajas.map(caja => ({
          id: caja.id,
          nombre: caja.nombre,
          montoInicial: 0,
          saldoActual: caja.saldoActual,
        }));

        setAperturaForm(prev => ({
          ...prev,
          cajas: cajasForm,
        }));

        if (activeCajas.length > 0) {
          // Inicializar montosFinales con todos los IDs de cajas a 0
          const montosIniciales = activeCajas.reduce((acc, caja) => {
            acc[caja.id] = 0;
            return acc;
          }, {} as Record<string, number>);
          
          setCierreForm(prev => ({ 
            ...prev, 
            cajaId: activeCajas[0].id,
            montosFinales: montosIniciales
          }));
        }
      } else {
        console.error('Error: getAllCajas() returned invalid data:', cajasData);
        setCajas([]);
        setAperturaForm(prev => ({ ...prev, cajas: [] }));
      }
    } catch (error) {
      console.error('Error cargando datos de cajas:', error);
      setCajas([]);
      setAperturaForm(prev => ({ ...prev, cajas: [] }));
    } finally {
      setLoading(false);
    }
  };

  // Cargar los mismos stats del dashboard para reutilizarlos en estos cards
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const data = await getDashboardData('week');
        setDashboardStats(data.stats);
      } catch (error) {
        console.error('Error cargando stats del dashboard para AperturaCierre:', error);
      }
    };

    fetchDashboardStats();
  }, []);

  const handleAperturaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cajasConMonto = aperturaForm.cajas.filter(caja => caja.montoInicial > 0);
    if (cajasConMonto.length === 0) {
      Swal.fire('Error', 'Debe especificar un monto inicial para al menos una caja.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const usuarioId = localStorage.getItem('user_id') || '';

      // Verificar el estado actual de cada caja antes de intentar abrirla
      const cajasParaAbrir = [];
      const cajasYaAbiertas = [];

      for (const caja of cajasConMonto) {
        try {
          const ultimaApertura = await getUltimaApertura(caja.id);
          const estaAbierta = ultimaApertura ? (ultimaApertura as any).estaAbierta : false;

          if (estaAbierta) {
            cajasYaAbiertas.push(caja.nombre);
          } else {
            cajasParaAbrir.push(caja);
          }
        } catch (error) {
          console.error(`Error verificando estado de caja ${caja.nombre}:`, error);
          // En caso de error, intentamos abrir la caja
          cajasParaAbrir.push(caja);
        }
      }

      // Si hay cajas ya abiertas, informar al usuario
      if (cajasYaAbiertas.length > 0) {
        const mensaje = `Las siguientes cajas ya están abiertas y serán omitidas: ${cajasYaAbiertas.join(', ')}`;
        
        if (cajasParaAbrir.length === 0) {
          Swal.fire('Información', `Todas las cajas seleccionadas ya están abiertas: ${cajasYaAbiertas.join(', ')}`, 'info');
          return;
        } else {
          Swal.fire('Advertencia', mensaje, 'warning');
        }
      }

      // Abrir solo las cajas que no están abiertas
      if (cajasParaAbrir.length > 0) {
        const aperturasPromises = cajasParaAbrir.map(async (caja) => {
          try {
            const aperturaData: AperturaCaja = {
              cajaId: caja.id,
              montoInicial: caja.montoInicial,
              fechaApertura: new Date().toISOString(),
              usuarioId,
              observaciones: aperturaForm.observaciones,
            };
            return await abrirCaja(aperturaData);
          } catch (error) {
            console.error(`Error abriendo caja ${caja.nombre}:`, error);
            throw error;
          }
        });

        await Promise.all(aperturasPromises);

        setAperturaForm(prev => ({
          ...prev,
          cajas: prev.cajas.map(caja => ({ ...caja, montoInicial: 0 })),
          observaciones: '',
        }));

        await fetchCajasData();
        
        const mensajeExito = cajasYaAbiertas.length > 0 
          ? `Apertura completada para: ${cajasParaAbrir.map(c => c.nombre).join(', ')}. Cajas omitidas: ${cajasYaAbiertas.join(', ')}`
          : 'Apertura de cajas realizada exitosamente.';
        
        Swal.fire('Éxito', mensajeExito, 'success');
      }
    } catch (error) {
      console.error('Error en apertura de cajas:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al realizar la apertura de cajas';
      Swal.fire('Error', errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCierreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const montosFinales = cierreForm.montosFinales || {};
    const cajasParaCerrar = Object.entries(montosFinales)
      .filter(([, monto]) => monto > 0)
      .map(([cajaId]) => cajaId);

    if (cajasParaCerrar.length === 0) {
      Swal.fire('Advertencia', 'Ingrese montos finales para al menos una caja.', 'warning');
      return;
    }

    const usuarioId = localStorage.getItem('user_id');
    if (!usuarioId) {
      Swal.fire('Error', 'No se pudo obtener el ID del usuario. Por favor, inicie sesión de nuevo.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const cierresPromises = cajasParaCerrar.map(async (cajaId) => {
        const caja = cajas.find(c => c.id === cajaId);
        if (!caja) return;

        const resumen = resumenDiario[cajaId] || { ingresos: 0, gastos: 0 };
        
        const cierreData: CierreCaja = {
          cajaId,
          montoFinal: montosFinales[cajaId],
          ingresosDelDia: resumen.ingresos || 0,
          gastosDelDia: resumen.gastos || 0,
          fechaCierre: new Date().toISOString(),
          usuarioId,
          observaciones: cierreForm.observaciones,
        };

        return await cerrarCaja(cierreData);
      });

      await Promise.all(cierresPromises);

      setCierreForm(prev => ({
        ...prev,
        cajaId: '',
        montoFinal: 0,
        ingresosDelDia: 0,
        gastosDelDia: 0,
        totalVentasPapeleria: 0,
        observaciones: '',
        montosFinales: {},
        resumenCajas: prev.resumenCajas,
      }));

      await fetchCajasData();
      const mensaje = cajasParaCerrar.length === 1 
        ? 'Cierre de caja realizado exitosamente.'
        : `Cierre de ${cajasParaCerrar.length} cajas realizado exitosamente.`;
      Swal.fire('Éxito', mensaje, 'success');
    } catch (error) {
      console.error('Error en cierre de cajas:', error);
      Swal.fire('Error', 'Error al realizar el cierre de cajas', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="apertura-cierre">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando datos de cajas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="apertura-cierre">
      <div className="page-header">
        <h1>Apertura & Cierre de Cajas</h1>
        <p>Gestión diaria de ingresos, gastos y control de cajas</p>
      </div>

      <StatusCards
        cajas={cajas}
        resumenDiario={resumenDiario}
        cajasAbiertas={cajasAbiertas}
        dashboardStats={dashboardStats}
        montoInicialDia={montoInicialDia}
        activeTab={activeTab}
        cierreForm={cierreForm}
        totalPapeleria={totalPapeleria}
      />

      <div className="tabs-container">
        <div className="tabs-header">
          <button
            className={`tab-button ${activeTab === 'apertura' ? 'active' : ''}`}
            onClick={() => setActiveTab('apertura')}
          >
            Apertura de Caja
          </button>
          <button
            className={`tab-button ${activeTab === 'cierre' ? 'active' : ''}`}
            onClick={() => setActiveTab('cierre')}
          >
            Cierre de Caja
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'apertura' ? (
            <AperturaForm
              form={aperturaForm}
              setForm={setAperturaForm}
              onSubmit={handleAperturaSubmit}
              isSubmitting={isSubmitting}
              cajasAbiertas={cajasAbiertas}
            />
          ) : (
            <CierreForm
              form={cierreForm}
              setForm={setCierreForm}
              onSubmit={handleCierreSubmit}
              isSubmitting={isSubmitting}
              cajas={cajas}
              cajasAbiertas={cajasAbiertas}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AperturaCierre;