$response = Invoke-RestMethod -Uri "http://172.16.0.23:54116/api/contabilidad/cuentas-por-cobrar" -Method GET
Write-Host "API Response Status: Success"
Write-Host "Total cuentas: $($response.data.Count)"
if ($response.data.Count -gt 0) {
    Write-Host "Primera cuenta: $($response.data[0].numeroDocumento)"
    Write-Host "Cliente: $($response.data[0].cliente.nombre)"
    Write-Host "Monto pendiente: $($response.data[0].montoPendiente)"
}