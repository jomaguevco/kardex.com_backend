import sequelize from '../config/database';
import { QueryTypes } from 'sequelize';

/**
 * Script para migrar/adaptar el sistema web a una base de datos existente
 * Este script verifica la estructura existente y crea las tablas faltantes
 */

interface TableInfo {
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string;
}

async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    const result = await sequelize.query(
      `SELECT COUNT(*) as count FROM information_schema.tables 
       WHERE table_schema = DATABASE() AND table_name = :tableName`,
      {
        replacements: { tableName },
        type: QueryTypes.SELECT
      }
    );
    return (result[0] as any).count > 0;
  } catch (error) {
    console.error(`Error checking table ${tableName}:`, error);
    return false;
  }
}

async function getTableColumns(tableName: string): Promise<TableInfo[]> {
  try {
    const result = await sequelize.query(
      `SELECT column_name, data_type, is_nullable, column_default
       FROM information_schema.columns 
       WHERE table_schema = DATABASE() AND table_name = :tableName
       ORDER BY ordinal_position`,
      {
        replacements: { tableName },
        type: QueryTypes.SELECT
      }
    );
    return result as TableInfo[];
  } catch (error) {
    console.error(`Error getting columns for ${tableName}:`, error);
    return [];
  }
}

async function createMissingTables() {
  console.log('🔍 Verificando estructura de la base de datos...');

  const requiredTables = [
    'usuarios',
    'categorias', 
    'marcas',
    'unidades_medida',
    'productos',
    'clientes',
    'proveedores',
    'ventas',
    'detalle_ventas',
    'compras',
    'detalle_compras',
    'tipos_movimiento_kardex',
    'movimientos_kardex'
  ];

  for (const tableName of requiredTables) {
    const exists = await checkTableExists(tableName);
    
    if (!exists) {
      console.log(`❌ Tabla ${tableName} no existe. Creando...`);
      await createTable(tableName);
    } else {
      console.log(`✅ Tabla ${tableName} existe. Verificando columnas...`);
      await verifyTableStructure(tableName);
    }
  }
}

async function createTable(tableName: string) {
  const tableDefinitions: { [key: string]: string } = {
    usuarios: `
      CREATE TABLE usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        rol ENUM('admin', 'vendedor', 'almacen') NOT NULL DEFAULT 'vendedor',
        activo BOOLEAN NOT NULL DEFAULT TRUE,
        ultimo_acceso DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `,
    
    categorias: `
      CREATE TABLE categorias (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        descripcion TEXT NULL,
        activo BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `,
    
    marcas: `
      CREATE TABLE marcas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        descripcion TEXT NULL,
        activo BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `,
    
    unidades_medida: `
      CREATE TABLE unidades_medida (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(50) NOT NULL,
        simbolo VARCHAR(10) NOT NULL,
        activo BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `,
    
    productos: `
      CREATE TABLE productos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        codigo VARCHAR(50) UNIQUE NOT NULL,
        nombre VARCHAR(200) NOT NULL,
        descripcion TEXT NULL,
        precio_venta DECIMAL(10,2) NOT NULL,
        precio_compra DECIMAL(10,2) NOT NULL,
        stock_actual INT NOT NULL DEFAULT 0,
        stock_minimo INT NOT NULL DEFAULT 0,
        categoria_id INT NOT NULL,
        marca_id INT NOT NULL,
        unidad_medida_id INT NOT NULL,
        codigo_barras VARCHAR(100) UNIQUE NULL,
        imagen VARCHAR(255) NULL,
        activo BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (categoria_id) REFERENCES categorias(id),
        FOREIGN KEY (marca_id) REFERENCES marcas(id),
        FOREIGN KEY (unidad_medida_id) REFERENCES unidades_medida(id)
      )
    `,
    
    clientes: `
      CREATE TABLE clientes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        email VARCHAR(100) NULL,
        telefono VARCHAR(20) NULL,
        direccion TEXT NULL,
        activo BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `,
    
    proveedores: `
      CREATE TABLE proveedores (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        email VARCHAR(100) NULL,
        telefono VARCHAR(20) NULL,
        direccion TEXT NULL,
        activo BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `,
    
    ventas: `
      CREATE TABLE ventas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        numero_factura VARCHAR(50) UNIQUE NOT NULL,
        cliente_id INT NOT NULL,
        usuario_id INT NOT NULL,
        fecha DATETIME NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL,
        descuento DECIMAL(10,2) NOT NULL DEFAULT 0,
        impuesto DECIMAL(10,2) NOT NULL DEFAULT 0,
        total DECIMAL(10,2) NOT NULL,
        estado ENUM('pendiente', 'completada', 'cancelada') NOT NULL DEFAULT 'pendiente',
        observaciones TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (cliente_id) REFERENCES clientes(id),
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
      )
    `,
    
    detalle_ventas: `
      CREATE TABLE detalle_ventas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        venta_id INT NOT NULL,
        producto_id INT NOT NULL,
        cantidad INT NOT NULL,
        precio_unitario DECIMAL(10,2) NOT NULL,
        descuento DECIMAL(10,2) NOT NULL DEFAULT 0,
        subtotal DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
        FOREIGN KEY (producto_id) REFERENCES productos(id)
      )
    `,
    
    compras: `
      CREATE TABLE compras (
        id INT AUTO_INCREMENT PRIMARY KEY,
        numero_factura VARCHAR(50) UNIQUE NOT NULL,
        proveedor_id INT NOT NULL,
        usuario_id INT NOT NULL,
        fecha DATETIME NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL,
        descuento DECIMAL(10,2) NOT NULL DEFAULT 0,
        impuesto DECIMAL(10,2) NOT NULL DEFAULT 0,
        total DECIMAL(10,2) NOT NULL,
        estado ENUM('pendiente', 'completada', 'cancelada') NOT NULL DEFAULT 'pendiente',
        observaciones TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (proveedor_id) REFERENCES proveedores(id),
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
      )
    `,
    
    detalle_compras: `
      CREATE TABLE detalle_compras (
        id INT AUTO_INCREMENT PRIMARY KEY,
        compra_id INT NOT NULL,
        producto_id INT NOT NULL,
        cantidad INT NOT NULL,
        precio_unitario DECIMAL(10,2) NOT NULL,
        descuento DECIMAL(10,2) NOT NULL DEFAULT 0,
        subtotal DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (compra_id) REFERENCES compras(id) ON DELETE CASCADE,
        FOREIGN KEY (producto_id) REFERENCES productos(id)
      )
    `,
    
    tipos_movimiento_kardex: `
      CREATE TABLE tipos_movimiento_kardex (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(50) NOT NULL,
        tipo ENUM('entrada', 'salida', 'ajuste') NOT NULL,
        descripcion TEXT NULL,
        activo BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `,
    
    movimientos_kardex: `
      CREATE TABLE movimientos_kardex (
        id INT AUTO_INCREMENT PRIMARY KEY,
        producto_id INT NOT NULL,
        tipo_movimiento_id INT NOT NULL,
        cantidad INT NOT NULL,
        precio_unitario DECIMAL(10,2) NOT NULL,
        total DECIMAL(10,2) NOT NULL,
        fecha DATETIME NOT NULL,
        referencia VARCHAR(100) NOT NULL,
        observaciones TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (producto_id) REFERENCES productos(id),
        FOREIGN KEY (tipo_movimiento_id) REFERENCES tipos_movimiento_kardex(id)
      )
    `
  };

  const sql = tableDefinitions[tableName];
  if (sql) {
    try {
      await sequelize.query(sql);
      console.log(`✅ Tabla ${tableName} creada exitosamente`);
    } catch (error) {
      console.error(`❌ Error creando tabla ${tableName}:`, error);
    }
  }
}

async function verifyTableStructure(tableName: string) {
  const columns = await getTableColumns(tableName);
  
  // Definir columnas requeridas para cada tabla
  const requiredColumns: { [key: string]: string[] } = {
    usuarios: ['id', 'nombre', 'email', 'password', 'rol', 'activo', 'created_at', 'updated_at'],
    productos: ['id', 'codigo', 'nombre', 'precio_venta', 'precio_compra', 'stock_actual', 'stock_minimo', 'created_at', 'updated_at'],
    ventas: ['id', 'numero_factura', 'cliente_id', 'usuario_id', 'fecha', 'total', 'estado', 'created_at', 'updated_at'],
    compras: ['id', 'numero_factura', 'proveedor_id', 'usuario_id', 'fecha', 'total', 'estado', 'created_at', 'updated_at']
  };

  const required = requiredColumns[tableName] || [];
  const existingColumns = columns.map(col => col.column_name);
  
  const missingColumns = required.filter(col => !existingColumns.includes(col));
  
  if (missingColumns.length > 0) {
    console.log(`⚠️  Tabla ${tableName} tiene columnas faltantes: ${missingColumns.join(', ')}`);
    console.log(`   Columnas existentes: ${existingColumns.join(', ')}`);
  } else {
    console.log(`✅ Tabla ${tableName} tiene la estructura correcta`);
  }
}

async function insertDefaultData() {
  console.log('📝 Insertando datos por defecto...');

  try {
    // Verificar si ya existen datos
    const existingUsers = await sequelize.query(
      'SELECT COUNT(*) as count FROM usuarios',
      { type: QueryTypes.SELECT }
    );

    if ((existingUsers[0] as any).count === 0) {
      // Insertar usuario administrador por defecto
      await sequelize.query(`
        INSERT INTO usuarios (nombre, email, password, rol) VALUES
        ('Administrador', 'admin@sistema.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4c8v8z8z8z', 'admin')
      `);
      console.log('✅ Usuario administrador creado');
    }

    // Insertar tipos de movimiento KARDEX si no existen
    const existingTypes = await sequelize.query(
      'SELECT COUNT(*) as count FROM tipos_movimiento_kardex',
      { type: QueryTypes.SELECT }
    );

    if ((existingTypes[0] as any).count === 0) {
      await sequelize.query(`
        INSERT INTO tipos_movimiento_kardex (nombre, tipo, descripcion) VALUES
        ('Entrada por compra', 'entrada', 'Ingreso de productos por compra'),
        ('Salida por venta', 'salida', 'Salida de productos por venta'),
        ('Ajuste de inventario', 'ajuste', 'Ajuste manual de inventario')
      `);
      console.log('✅ Tipos de movimiento KARDEX creados');
    }

  } catch (error) {
    console.error('❌ Error insertando datos por defecto:', error);
  }
}

async function createIndexes() {
  console.log('🔍 Creando índices para mejorar rendimiento...');

  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_productos_codigo ON productos(codigo)',
    'CREATE INDEX IF NOT EXISTS idx_productos_codigo_barras ON productos(codigo_barras)',
    'CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas(fecha)',
    'CREATE INDEX IF NOT EXISTS idx_ventas_cliente ON ventas(cliente_id)',
    'CREATE INDEX IF NOT EXISTS idx_compras_fecha ON compras(fecha)',
    'CREATE INDEX IF NOT EXISTS idx_movimientos_kardex_producto ON movimientos_kardex(producto_id)',
    'CREATE INDEX IF NOT EXISTS idx_movimientos_kardex_fecha ON movimientos_kardex(fecha)'
  ];

  for (const indexSql of indexes) {
    try {
      await sequelize.query(indexSql);
      console.log(`✅ Índice creado: ${indexSql.split(' ')[5]}`);
    } catch (error) {
      console.log(`⚠️  Índice ya existe o error: ${indexSql.split(' ')[5]}`);
    }
  }
}

async function main() {
  try {
    console.log('🚀 Iniciando migración para base de datos existente...');
    
    // Verificar conexión
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida');

    // Crear tablas faltantes
    await createMissingTables();
    
    // Insertar datos por defecto
    await insertDefaultData();
    
    // Crear índices
    await createIndexes();
    
    console.log('🎉 Migración completada exitosamente!');
    console.log('');
    console.log('📋 Próximos pasos:');
    console.log('1. Configura las variables de entorno en backend/.env');
    console.log('2. Ejecuta: npm run dev en el directorio backend');
    console.log('3. Ejecuta: npm run dev en el directorio frontend');
    console.log('4. Accede a http://localhost:3000');
    console.log('5. Login con: admin@sistema.com / password');
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

export { main as migrateExistingDB };
