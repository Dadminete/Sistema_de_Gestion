$response = Invoke-WebRequest -Uri 'http://172.16.0.23:54117/api/auth/login' -Method POST -Headers @{'Content-Type'='application/json'} -InFile 'temp_login.json'
$json = $response.Content | ConvertFrom-Json
$token = $json.token
Write-Host "Token: $token"
Write-Host "Testing dashboard endpoint..."
$dashboardResponse = Invoke-WebRequest -Uri 'http://172.16.0.23:54117/api/clients/dashboard/overview' -Method GET -Headers @{'Content-Type'='application/json'; 'Authorization'="Bearer $token"}
Write-Host "Dashboard response:"
Write-Host $dashboardResponse.Content