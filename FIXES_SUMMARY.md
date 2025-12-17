# Fix for Papeleria Caja Issue - Complete Solution

## Problem Description
When trying to make an expense in the "Registro de Ingresos y Gastos" form, the system was showing the error:
"Fondos Insuficientes - No se puede efectuar el gasto. El monto de $65.00 es mayor que el disponible en Papelería. Saldo actual: $0.00."

Additionally, there was a 500 Internal Server Error when trying to fetch the balance for papeleria:
```
GET http://172.16.0.23:54115/api/contabilidad/movimientos/balance/papeleria 500 (Internal Server Error)
```

## Root Cause
The issue was that there was no "papeleria" caja (cash register) in the database. The `getBalancePapeleria()` function in `movimientoContableService.js` was looking for a caja with `tipo: 'papeleria'`, but it didn't exist.

Additionally, there were field name inconsistencies in the code where `activo` was used instead of `activa`.

## Fixes Applied

### 1. Created missing papeleria caja:
- Created a script (`setup-cajas.mjs`) that creates both "papeleria" and "general" cajas if they don't exist
- Ran the script successfully to create the missing cajas

### 2. Fixed field name inconsistencies:
- Updated `server/services/movimientoContableService.js` to use `activa` instead of `activo` in:
  - `updateBalance()` function
  - `getBalanceCaja()` function
  - `getBalancePapeleria()` function

### 3. Fixed frontend issue:
- Removed invalid `fetchCuentas()` call from `src/pages/IngresosGastos.tsx` that was causing a runtime error
- Added proper import for `cuentaContableService` (though not actually needed for this component)

## Verification
- Created and ran test script (`test-papeleria-caja.mjs`) to verify the papeleria caja exists and is working correctly
- Confirmed that the balance can be calculated properly
- Verified that the field name inconsistencies have been resolved

## Solution Status
✅ RESOLVED - The issue should now be fixed. Users can make expenses using the papeleria payment method.

## Additional Notes
The fix addresses both the immediate issue (missing papeleria caja) and the underlying code issues (field name inconsistencies). The system should now properly handle expenses made through the papeleria payment method.