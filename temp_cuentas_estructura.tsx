// Esta es solo la estructura JSX corregida para CuentasPorPagar
return (
  <>
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Receipt className="h-8 w-8 text-indigo-600 mr-3" />
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Cuentas por Pagar</h1>
                    <p className="text-sm text-gray-500">
                      Gestiona las cuentas pendientes de pago a proveedores
                    </p>
                  </div>
                </div>
                
                {/* Botones principales */}
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => {
                      resetForm();
                      setModalFormOpen(true);
                    }}
                    className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-lg shadow-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Nueva Cuenta
                  </button>
                  <button
                    onClick={() => setMostrarFiltros(!mostrarFiltros)}
                    className={`inline-flex items-center justify-center px-6 py-3 border-2 rounded-lg shadow-lg text-sm font-semibold transition-all duration-200 hover:shadow-xl transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                      mostrarFiltros 
                        ? 'border-indigo-500 text-indigo-600 bg-indigo-50 hover:bg-indigo-100' 
                        : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <Filter className="h-5 w-5 mr-2" />
                    Filtros
                  </button>
                  <button
                    onClick={cargarDatos}
                    disabled={loading}
                    className="inline-flex items-center justify-center px-6 py-3 border-2 border-gray-300 rounded-lg shadow-lg text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <RefreshCw className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Actualizar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        {resumen && (
          <div className="dashboard-kpis">
            <KpiWidget
              title="TOTAL POR PAGAR"
              value={formatCurrency(resumen.totalPorPagar)}
              percentage={`${resumen.cuentasPendientes} cuentas pendientes`}
              percentageClass="neutral"
              icon={<span className="material-icons">monetization_on</span>}
              barColor="#00BFA5"
            />

            <KpiWidget
              title="TOTAL VENCIDAS"
              value={formatCurrency(resumen.totalVencidas)}
              percentage={`${resumen.cuentasVencidas} cuentas vencidas`}
              percentageClass={resumen.totalVencidas > 0 ? "negative" : "neutral"}
              icon={<span className="material-icons">warning</span>}
              barColor="#F44336"
            />

            <KpiWidget
              title="PRÓXIMAS A VENCER"
              value={formatCurrency(resumen.totalProximasVencer)}
              percentage={"Próximos 7 días"}
              percentageClass={resumen.totalProximasVencer > 0 ? "warning" : "neutral"}
              icon={<span className="material-icons">schedule</span>}
              barColor="#FF9800"
            />

            <KpiWidget
              title="CUENTAS PENDIENTES"
              value={resumen.cuentasPendientes.toString()}
              percentage={`De ${resumen.cuentasPendientes + resumen.cuentasVencidas} total`}
              percentageClass="positive"
              icon={<span className="material-icons">receipt_long</span>}
              barColor="#2196F3"
            />

            <KpiWidget
              title="CUENTAS VENCIDAS"
              value={resumen.cuentasVencidas.toString()}
              percentage={resumen.cuentasVencidas > 0 ? "Requieren atención" : "Al día"}
              percentageClass={resumen.cuentasVencidas > 0 ? "negative" : "positive"}
              icon={<span className="material-icons">error_outline</span>}
              barColor={resumen.cuentasVencidas > 0 ? "#F44336" : "#4CAF50"}
            />
          </div>
        )}

        {/* Filtros */}
        {mostrarFiltros && (
          <div className="mx-4 sm:mx-6 lg:mx-8 mb-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Filtros</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Contenido de filtros aquí */}
              </div>
            </div>
          </div>
        )}

        {/* Tabla de datos */}
        <div className="mx-4 sm:mx-6 lg:mx-8 mb-6">
          <div className="bg-white shadow rounded-lg">
            <DataTable
              data={cuentas}
              columns={columns}
              loading={loading}
            />
          </div>
        </div>
      </div>
    </div>

    {/* Modal Formulario */}
    <Modal
      open={modalFormOpen}
      onClose={() => {
        setModalFormOpen(false);
        resetForm();
      }}
      title={modoEdicion ? 'Editar Cuenta por Pagar' : 'Nueva Cuenta por Pagar'}
    >
      {/* Contenido del modal aquí */}
    </Modal>

    {/* Otros modales aquí */}
  </>
);