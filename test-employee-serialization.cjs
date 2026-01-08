const { EmployeeService } = require('./server/services/employeeService');

async function test() {
    try {
        console.log('Testing employee serialization...');
        const employee = await EmployeeService.getById('2');
        
        console.log('\nEmployee data after serialization:');
        console.log('ID:', employee.id, 'type:', typeof employee.id);
        console.log('salarioBase:', employee.salarioBase, 'type:', typeof employee.salarioBase);
        console.log('montoAfp:', employee.montoAfp, 'type:', typeof employee.montoAfp);
        console.log('montoSfs:', employee.montoSfs, 'type:', typeof employee.montoSfs);
        
        // Try to convert to JSON
        console.log('\nTrying JSON.stringify...');
        try {
            const json = JSON.stringify(employee);
            console.log('SUCCESS! JSON length:', json.length);
            console.log('Sample:', json.substring(0, 200));
        } catch (err) {
            console.error('FAILED:', err.message);
        }
    } catch (error) {
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
    }
}

test();
