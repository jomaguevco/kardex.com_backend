const mysql = require('mysql2/promise');

async function testConnection() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '',
      database: 'sistema_ventas_kardex'
    });
    
    console.log('✅ Conexión a la base de datos exitosa');
    await connection.end();
  } catch (error) {
    console.error('❌ Error de conexión a la base de datos:', error.message);
  }
}

testConnection();
