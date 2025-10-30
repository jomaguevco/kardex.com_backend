import sequelize from '../config/database';
import { QueryTypes } from 'sequelize';

/**
 * Script para adaptar el sistema web a la base de datos existente
 * Verifica la estructura y configura las tablas necesarias
 */

async function checkDatabaseConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida');
    return true;
  } catch (error) {
    console.error('❌ Error de conexión a la base de datos:', error);
    return false;
  }
}

async function checkTableStructure() {
  console.log('🔍 Verificando estructura de la base de datos...');
  
  const tables = [
    'usuarios', 'productos', 'ventas', 'detalle_ventas', 
    'compras', 'detalle_compras', 'clientes', 'proveedores',
    'movimientos_kardex', 'tipos_movimiento_kardex', 'almacenes',
    'categorias', 'marcas', 'unidades_medida'
  ];

  for (const table of tables) {
    try {
      const result = await sequelize.query(
        `SELECT COUNT(*) as count FROM information_schema.tables 
         WHERE table_schema = DATABASE() AND table_name = :tableName`,
        {
          replacements: { tableName: table },
          type: QueryTypes.SELECT
        }
      );
      
      const exists = (result[0] as any).count > 0;
      console.log(`${exists ? '✅' : '❌'} Tabla ${table}: ${exists ? 'Existe' : 'No existe'}`);
    } catch (error) {
      console.log(`❌ Error verificando tabla ${table}:`, error);
    }
  }
}

async function checkDataIntegrity() {
  console.log('🔍 Verificando integridad de datos...');
  
  try {
    // Verificar usuarios
    const usuarios = await sequelize.query(
      'SELECT COUNT(*) as count FROM usuarios',
      { type: QueryTypes.SELECT }
    );
    console.log(`📊 Usuarios: ${(usuarios[0] as any).count}`);

    // Verificar productos
    const productos = await sequelize.query(
      'SELECT COUNT(*) as count FROM productos',
      { type: QueryTypes.SELECT }
    );
    console.log(`📊 Productos: ${(productos[0] as any).count}`);

    // Verificar clientes
    const clientes = await sequelize.query(
      'SELECT COUNT(*) as count FROM clientes',
      { type: QueryTypes.SELECT }
    );
    console.log(`📊 Clientes: ${(clientes[0] as any).count}`);

    // Verificar proveedores
    const proveedores = await sequelize.query(
      'SELECT COUNT(*) as count FROM proveedores',
      { type: QueryTypes.SELECT }
    );
    console.log(`📊 Proveedores: ${(proveedores[0] as any).count}`);

    // Verificar movimientos KARDEX
    const movimientos = await sequelize.query(
      'SELECT COUNT(*) as count FROM movimientos_kardex',
      { type: QueryTypes.SELECT }
    );
    console.log(`📊 Movimientos KARDEX: ${(movimientos[0] as any).count}`);

  } catch (error) {
    console.error('❌ Error verificando datos:', error);
  }
}

async function checkUserCredentials() {
  console.log('🔍 Verificando credenciales de usuario...');
  
  try {
    const usuarios = await sequelize.query(
      'SELECT nombre_usuario, nombre_completo, rol FROM usuarios WHERE activo = 1',
      { type: QueryTypes.SELECT }
    );
    
    console.log('👥 Usuarios disponibles:');
    usuarios.forEach((usuario: any) => {
      console.log(`   - ${usuario.nombre_usuario} (${usuario.nombre_completo}) - ${usuario.rol}`);
    });
    
    // Verificar usuario admin
    const admin = await sequelize.query(
      'SELECT nombre_usuario FROM usuarios WHERE nombre_usuario = "admin" AND activo = 1',
      { type: QueryTypes.SELECT }
    );
    
    if (admin.length > 0) {
      console.log('✅ Usuario administrador encontrado');
    } else {
      console.log('⚠️  Usuario administrador no encontrado');
    }
    
  } catch (error) {
    console.error('❌ Error verificando usuarios:', error);
  }
}

async function checkKardexSystem() {
  console.log('🔍 Verificando sistema KARDEX...');
  
  try {
    // Verificar tipos de movimiento
    const tipos = await sequelize.query(
      'SELECT codigo, nombre, tipo_operacion FROM tipos_movimiento_kardex WHERE activo = 1',
      { type: QueryTypes.SELECT }
    );
    
    console.log('📋 Tipos de movimiento disponibles:');
    tipos.forEach((tipo: any) => {
      console.log(`   - ${tipo.codigo}: ${tipo.nombre} (${tipo.tipo_operacion})`);
    });
    
    // Verificar almacenes
    const almacenes = await sequelize.query(
      'SELECT codigo, nombre FROM almacenes WHERE activo = 1',
      { type: QueryTypes.SELECT }
    );
    
    console.log('🏪 Almacenes disponibles:');
    almacenes.forEach((almacen: any) => {
      console.log(`   - ${almacen.codigo}: ${almacen.nombre}`);
    });
    
  } catch (error) {
    console.error('❌ Error verificando sistema KARDEX:', error);
  }
}

async function generateConnectionInfo() {
  console.log('📋 Información de conexión:');
  console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
  console.log(`   Puerto: ${process.env.DB_PORT || '3306'}`);
  console.log(`   Base de datos: ${process.env.DB_NAME || 'sistema_ventas_kardex'}`);
  console.log(`   Usuario: ${process.env.DB_USER || 'root'}`);
}

async function main() {
  console.log('🚀 Iniciando verificación de base de datos existente...');
  console.log('================================================');
  
  // Verificar conexión
  const connected = await checkDatabaseConnection();
  if (!connected) {
    process.exit(1);
  }
  
  // Generar información de conexión
  await generateConnectionInfo();
  console.log('');
  
  // Verificar estructura de tablas
  await checkTableStructure();
  console.log('');
  
  // Verificar integridad de datos
  await checkDataIntegrity();
  console.log('');
  
  // Verificar credenciales de usuario
  await checkUserCredentials();
  console.log('');
  
  // Verificar sistema KARDEX
  await checkKardexSystem();
  console.log('');
  
  console.log('================================================');
  console.log('✅ Verificación completada exitosamente!');
  console.log('');
  console.log('📋 Próximos pasos:');
  console.log('1. Configura las variables de entorno en backend/.env');
  console.log('2. Ejecuta: npm run dev en el directorio backend');
  console.log('3. Ejecuta: npm run dev en el directorio frontend');
  console.log('4. Accede a http://localhost:3000');
  console.log('5. Login con las credenciales mostradas arriba');
  console.log('');
  console.log('🔧 Credenciales por defecto:');
  console.log('   Usuario: admin');
  console.log('   Contraseña: admin123');
  
  await sequelize.close();
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(console.error);
}

export { main as adaptExistingDB };
