# 🧪 GUÍA DE PRUEBAS - Dashboard de Cajas UI Redesign

## 📋 Tabla de Contenidos
1. [Pruebas en Desktop](#desktop)
2. [Pruebas en Tablet](#tablet)
3. [Pruebas en Móvil](#móvil)
4. [Pruebas de Funcionalidad](#funcionalidad)
5. [Pruebas de Rendimiento](#rendimiento)

---

## 🖥️ DESKTOP {#desktop}

### Prueba 1: Visualización General
**Objetivo:** Verificar que todo se ve correctamente en desktop

- [ ] Accede a http://172.16.0.23:5173/cajas/dashboard
- [ ] Verifica que las 4 tarjetas de stats estén en una fila
- [ ] Verifica que los iconos sean grandes y coloridos
- [ ] Verifica que haya dos gráficos en la segunda fila
- [ ] Verifica que las tablas estén debajo

**Resultado esperado:** ✅ Layout profesional con 4 columnas

### Prueba 2: Animaciones de Cards
**Objetivo:** Verificar que las tarjetas tengan animaciones suaves

- [ ] Pasa el mouse sobre cada tarjeta
- [ ] Observa que la tarjeta se eleva suavemente
- [ ] Observa que la sombra aumenta
- [ ] Verifica que no hay saltos bruscos

**Resultado esperado:** ✅ Animación suave de elevación

### Prueba 3: Selector de Períodos
**Objetivo:** Verificar que el selector funciona

- [ ] Haz clic en "Esta Semana" (debe estar activo por defecto)
- [ ] Haz clic en "Este Mes"
- [ ] Verifica que el botón cambie de color (azul)
- [ ] Verifica que los datos se actualicen
- [ ] Haz clic en "Este Año"
- [ ] Verifica que los datos cambien nuevamente

**Resultado esperado:** ✅ Selector funciona y actualiza datos

### Prueba 4: Botón Actualizar
**Objetivo:** Verificar que el botón de actualizar funciona

- [ ] Haz clic en el botón "Actualizar"
- [ ] Observa que el ícono gira (spinner animation)
- [ ] Verifica que los datos se recargan
- [ ] Verifica que el spinner se detiene después de cargar

**Resultado esperado:** ✅ Botón actualiza datos con animación

### Prueba 5: Colores y Contrastes
**Objetivo:** Verificar que los colores sean claros y legibles

- [ ] Tarjeta Ingresos: Verde (#10b981)
- [ ] Tarjeta Gastos: Rojo (#ef4444)
- [ ] Tarjeta Balance: Azul (#3b82f6)
- [ ] Tarjeta Estado: Naranja (#f59e0b)
- [ ] Verifica que el texto sea legible en todos los casos

**Resultado esperado:** ✅ Colores profesionales y legibles

### Prueba 6: Tablas de Datos
**Objetivo:** Verificar que las tablas funcionen bien

- [ ] Scroll horizontal en la tabla si es necesario
- [ ] Verifica que los badges sean visibles
- [ ] Haz hover sobre una fila
- [ ] Verifica que la fila tenga fondo diferente
- [ ] Haz clic en el botón de ver detalles
- [ ] Verifica que el ícono cambie de color

**Resultado esperado:** ✅ Tabla funcional con interactividad

### Prueba 7: Carga Inicial
**Objetivo:** Verificar la experiencia de carga

- [ ] Recarga la página (F5)
- [ ] Verifica que aparezca el spinner de carga
- [ ] Verifica que muestre "Cargando Dashboard..."
- [ ] Espera a que carguen los datos
- [ ] Verifica que los datos aparezcan correctamente

**Resultado esperado:** ✅ Loader visible y datos cargan correctamente

---

## 📱 TABLET {#tablet}

### Prueba 1: Layout Adaptativo
**Objetivo:** Verificar que el layout se adapte a tablet

- [ ] Abre DevTools (F12)
- [ ] Cambia a vista de tablet (iPad: 768x1024)
- [ ] Verifica que las tarjetas estén en 2 columnas
- [ ] Verifica que el header se reorganice
- [ ] Verifica que los gráficos se apilen verticalmente

**Resultado esperado:** ✅ Layout adaptado correctamente a 2 columnas

### Prueba 2: Botones y Controles
**Objetivo:** Verificar que los botones sean accesibles en tablet

- [ ] Verifica que el botón "Actualizar" sea accesible
- [ ] Verifica que los botones de período sean clickeables
- [ ] Verifica que no haya elementos ocultos

**Resultado esperado:** ✅ Todos los controles accesibles

### Prueba 3: Tipografía
**Objetivo:** Verificar que el texto sea legible

- [ ] Verifica que los títulos sean legibles
- [ ] Verifica que los valores de moneda sean claros
- [ ] Verifica que no haya truncamiento de texto

**Resultado esperado:** ✅ Texto legible en todos lados

---

## 📲 MÓVIL {#móvil}

### Prueba 1: Layout Móvil
**Objetivo:** Verificar que el layout se adapte a móvil

- [ ] Abre DevTools (F12)
- [ ] Cambia a vista de móvil (iPhone 12: 390x844)
- [ ] Verifica que las tarjetas estén en 1 columna
- [ ] Verifica que el contenido no se corte
- [ ] Verifica que el padding sea apropiado

**Resultado esperado:** ✅ Layout optimizado para móvil en 1 columna

### Prueba 2: Botón Actualizar en Móvil
**Objetivo:** Verificar que el botón sea usable en móvil

- [ ] Verifica que el botón ocupe el ancho completo
- [ ] Verifica que sea fácil de tocar
- [ ] Verifica que el spinner sea visible
- [ ] Verifica que funcione correctamente

**Resultado esperado:** ✅ Botón usable y funcional

### Prueba 3: Selector de Períodos en Móvil
**Objetivo:** Verificar que el selector sea usable en móvil

- [ ] Verifica que los botones estén bien espaciados
- [ ] Verifica que sean fáciles de tocar
- [ ] Verifica que no se corten
- [ ] Prueba cambiar de período

**Resultado esperado:** ✅ Selector usable en móvil

### Prueba 4: Tablas en Móvil
**Objetivo:** Verificar que las tablas sean usables en móvil

- [ ] Verifica que la tabla tenga scroll horizontal
- [ ] Verifica que el scroll sea suave
- [ ] Verifica que todas las columnas sean visibles
- [ ] Verifica que se pueda ver todo el contenido

**Resultado esperado:** ✅ Tabla usable con scroll horizontal

### Prueba 5: Tipografía en Móvil
**Objetivo:** Verificar que el texto sea legible sin zoom

- [ ] Verifica que puedas leer todo SIN hacer zoom
- [ ] Verifica que los títulos sean claros
- [ ] Verifica que los números sean legibles
- [ ] Verifica que no haya truncamiento de texto

**Resultado esperado:** ✅ Todo legible sin zoom

### Prueba 6: Rendimiento en Móvil
**Objetivo:** Verificar que funcione bien en móvil lento

- [ ] Abre DevTools → Throttling → "Slow 4G"
- [ ] Recarga la página
- [ ] Observa que el loader aparezca
- [ ] Espera a que los datos carguen
- [ ] Verifica que sea usable (no congelado)

**Resultado esperado:** ✅ Funciona aceptablemente en conexión lenta

---

## ⚙️ FUNCIONALIDAD {#funcionalidad}

### Prueba 1: Actualización de Datos
**Objetivo:** Verificar que los datos se actualicen correctamente

- [ ] Anota los valores mostrados
- [ ] Espera 1 minuto
- [ ] Haz clic en "Actualizar"
- [ ] Verifica que los datos se actualicen
- [ ] Verifica que el spinner funcione

**Resultado esperado:** ✅ Datos actualizados correctamente

### Prueba 2: Cambio de Período
**Objetivo:** Verificar que cambiar período actualice los datos

- [ ] Anota los valores en "Esta Semana"
- [ ] Haz clic en "Este Mes"
- [ ] Verifica que los valores cambien
- [ ] Anota los valores en "Este Mes"
- [ ] Haz clic en "Este Año"
- [ ] Verifica que los valores cambien nuevamente

**Resultado esperado:** ✅ Período cambia correctamente

### Prueba 3: Indicador de Estado Activo
**Objetivo:** Verificar que el período activo sea visible

- [ ] Haz clic en "Este Mes"
- [ ] Verifica que el botón esté azul
- [ ] Haz clic en "Este Año"
- [ ] Verifica que el botón anterior vuelva al gris
- [ ] Verifica que el nuevo botón esté azul

**Resultado esperado:** ✅ Indicador visual del período activo

### Prueba 4: Manejo de Errores
**Objetivo:** Verificar que los errores se manejen correctamente

- [ ] Desconecta la conexión (DevTools Network → Offline)
- [ ] Haz clic en "Actualizar"
- [ ] Verifica que aparezca un mensaje de error
- [ ] Verifica que haya botón "Reintentar"
- [ ] Conecta la red nuevamente
- [ ] Haz clic en "Reintentar"
- [ ] Verifica que los datos carguen correctamente

**Resultado esperado:** ✅ Errores manejados elegantemente

### Prueba 5: Historial de Transacciones
**Objetivo:** Verificar que la tabla de historial funcione

- [ ] Verifica que haya al menos una transacción
- [ ] Verifica que los tipos de transacción sean correctos
- [ ] Haz clic en el botón "Ver" de una transacción
- [ ] Verifica que sea clickeable

**Resultado esperado:** ✅ Tabla de historial funcional

---

## 🚀 RENDIMIENTO {#rendimiento}

### Prueba 1: Tiempo de Carga
**Objetivo:** Verificar que la página carga rápido

- [ ] Abre DevTools → Performance
- [ ] Recarga la página
- [ ] Verifica que Time to Interactive sea < 3 segundos
- [ ] Verifica que los datos carguen < 2 segundos

**Resultado esperado:** ✅ Carga rápida

### Prueba 2: Animaciones Fluidas
**Objetivo:** Verificar que las animaciones sean fluidas

- [ ] Pasa el mouse sobre varias tarjetas rápidamente
- [ ] Verifica que no haya stuttering
- [ ] Verifica que las animaciones sean suaves
- [ ] Abre DevTools → Performance
- [ ] Registra una sesión de 5 segundos
- [ ] Verifica que el FPS sea > 60

**Resultado esperado:** ✅ Animaciones fluidas

### Prueba 3: Uso de Memoria
**Objetivo:** Verificar que no haya memory leaks

- [ ] Abre DevTools → Memory
- [ ] Toma un snapshot inicial
- [ ] Interactúa con la página 2 minutos
- [ ] Toma otro snapshot
- [ ] Verifica que el tamaño de memoria no haya aumentado significativamente

**Resultado esperado:** ✅ Uso de memoria estable

---

## ✅ CHECKLIST DE ACEPTACIÓN

- [ ] Desktop: Layout 4 columnas
- [ ] Desktop: Animaciones suaves
- [ ] Desktop: Selector funciona
- [ ] Desktop: Botón actualizar funciona
- [ ] Tablet: Layout 2 columnas
- [ ] Tablet: Controles accesibles
- [ ] Móvil: Layout 1 columna
- [ ] Móvil: Sin zoom necesario
- [ ] Móvil: Tablas con scroll
- [ ] Funcionalidad: Datos actualizan
- [ ] Funcionalidad: Período cambia
- [ ] Funcionalidad: Errores manejados
- [ ] Rendimiento: Carga rápida
- [ ] Rendimiento: Animaciones fluidas
- [ ] Rendimiento: Memoria estable

---

## 📝 Notas de Prueba

### Ambiente Recomendado
- **Navegador**: Chrome/Edge/Firefox (últimas versiones)
- **Resoluciones a probar**: 1920x1080, 768x1024, 390x844
- **Conexión**: Prueba con Throttling ("Slow 4G")
- **Dispositivos**: Desktop, Tablet, Smartphone

### Datos de Prueba
Si necesitas datos de prueba específicos, verifica:
- Hay aperturas de caja hoy?
- Hay movimientos de ingresos?
- Hay movimientos de gastos?
- Hay historial de aperturas/cierres?

### Reporte de Errores
Si encuentras errores, documenta:
1. Pasos para reproducir
2. Resultado esperado
3. Resultado actual
4. Screenshot (si aplica)
5. Navegador y versión
6. Dispositivo y resolución

---

## 🎓 Casos de Prueba Especiales

### Cambio Rápido de Períodos
**Objetivo:** Verificar que no haya conflictos

- [ ] Haz clic rápidamente en diferentes períodos
- [ ] Verifica que no haya datos duplicados
- [ ] Verifica que los datos sean consistentes

**Resultado esperado:** ✅ Sin conflictos ni datos duplicados

### Navegación con Keyboard
**Objetivo:** Verificar accesibilidad de teclado

- [ ] Presiona Tab para navegar entre controles
- [ ] Verifica que los botones sean focusables
- [ ] Presiona Enter en botones
- [ ] Verifica que funcionen con teclado

**Resultado esperado:** ✅ Navegación con teclado funcional

---

## 🏁 Conclusión

Una vez que todas las pruebas pasen, el dashboard está listo para:
- ✅ Producción
- ✅ Usuarios finales
- ✅ Documentación

**Si todo está verde, ¡FELICIDADES! 🎉 El redesign es un éxito.**

---

**Última actualización:** 27 de Noviembre de 2025  
**Versión:** 1.0 - Guía de Pruebas  
**Estado:** Listo para usar
