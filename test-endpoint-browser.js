// Simple test to check the API endpoint
const testEndpoint = async () => {
    try {
        const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
        if (!token) {
            console.error('No auth token found');
            return;
        }

        const response = await fetch('http://172.16.0.23:54116/api/facturas/pagos-mes/2025', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);

        if (response.ok) {
            const data = await response.json();
            console.log('Success! Data received:', data);
        } else {
            const errorText = await response.text();
            console.error('Error response:', errorText);
        }
    } catch (error) {
        console.error('Network error:', error);
    }
};

// Run the test
testEndpoint();