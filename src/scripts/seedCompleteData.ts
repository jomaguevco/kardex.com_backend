import sequelize from '../config/database';
import Usuario from '../models/Usuario';
import Categoria from '../models/Categoria';
import Marca from '../models/Marca';
import UnidadMedida from '../models/UnidadMedida';
import Almacen from '../models/Almacen';
import TipoMovimientoKardex from '../models/TipoMovimientoKardex';
import Cliente from '../models/Cliente';
import Proveedor from '../models/Proveedor';
import Producto from '../models/Producto';
import Compra from '../models/Compra';
import DetalleCompra from '../models/DetalleCompra';
import Venta from '../models/Venta';
import DetalleVenta from '../models/DetalleVenta';
import MovimientoKardex from '../models/MovimientoKardex';
import crypto from 'crypto';

const hashPassword = (password: string) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

export const seedCompleteData = async () => {
  try {
    console.log('🌱 Iniciando seed completo de la base de datos...');

    // Verificar si ya hay productos (indicador de datos existentes)
    const productoCount = await Producto.count();
    if (productoCount > 10) {
      console.log('⚠️  Ya existen datos en la base de datos. Continuando...');
    }

    console.log('📦 1/10 - Creando usuarios...');
    const usuarios = await Usuario.bulkCreate([
      {
        nombre_usuario: 'admin',
        contrasena: hashPassword('admin123'),
        nombre_completo: 'Administrador del Sistema',
        email: 'admin@kardex.com',
        rol: 'ADMINISTRADOR',
        activo: true
      },
      {
        nombre_usuario: 'vendedor1',
        contrasena: hashPassword('vendedor123'),
        nombre_completo: 'Juan Carlos Pérez',
        email: 'jperez@kardex.com',
        rol: 'VENDEDOR',
        activo: true
      },
      {
        nombre_usuario: 'vendedor2',
        contrasena: hashPassword('vendedor123'),
        nombre_completo: 'María Elena López',
        email: 'mlopez@kardex.com',
        rol: 'VENDEDOR',
        activo: true
      }
    ], { ignoreDuplicates: true, returning: true });

    console.log('📁 2/10 - Creando categorías...');
    const categorias = await Categoria.bulkCreate([
      { nombre: 'LAPTOPS', descripcion: 'Computadoras portátiles', activo: true },
      { nombre: 'MONITORES', descripcion: 'Pantallas y monitores', activo: true },
      { nombre: 'TECLADOS', descripcion: 'Teclados y accesorios', activo: true },
      { nombre: 'MOUSE', descripcion: 'Ratones y trackpads', activo: true },
      { nombre: 'DISCOS DUROS', descripcion: 'Almacenamiento externo e interno', activo: true },
      { nombre: 'MEMORIAS RAM', descripcion: 'Memorias de acceso aleatorio', activo: true }
    ], { ignoreDuplicates: true, returning: true });

    console.log('🏷️  3/10 - Creando marcas...');
    const marcas = await Marca.bulkCreate([
      { nombre: 'HP', descripcion: 'Hewlett-Packard', activo: true },
      { nombre: 'DELL', descripcion: 'Dell Technologies', activo: true },
      { nombre: 'LENOVO', descripcion: 'Lenovo Group', activo: true },
      { nombre: 'LOGITECH', descripcion: 'Logitech International', activo: true },
      { nombre: 'KINGSTON', descripcion: 'Kingston Technology', activo: true },
      { nombre: 'SAMSUNG', descripcion: 'Samsung Electronics', activo: true }
    ], { ignoreDuplicates: true, returning: true });

    console.log('📏 4/10 - Creando unidades de medida...');
    await UnidadMedida.bulkCreate([
      { nombre: 'UNIDAD', abreviatura: 'UND', activo: true },
      { nombre: 'CAJA', abreviatura: 'CJA', activo: true }
    ], { ignoreDuplicates: true });

    console.log('🏢 5/10 - Creando almacenes...');
    await Almacen.bulkCreate([
      {
        codigo: 'ALM-001',
        nombre: 'ALMACÉN PRINCIPAL',
        direccion: 'Av. Principal 100, Lima',
        responsable: 'Carlos Rodríguez',
        activo: true
      }
    ], { ignoreDuplicates: true });

    console.log('👥 6/10 - Creando clientes...');
    const clientes = await Cliente.bulkCreate([
      {
        codigo: 'CLI-001',
        tipo_documento: 'DNI',
        numero_documento: '12345678',
        nombre: 'Carlos Alberto Mendoza',
        email: 'carlos.mendoza@email.com',
        telefono: '987654321',
        direccion: 'Av. Los Pinos 123, Lima',
        tipo_cliente: 'NATURAL',
        activo: true
      },
      {
        codigo: 'CLI-002',
        tipo_documento: 'RUC',
        numero_documento: '20123456789',
        nombre: 'EMPRESA TECNOLOGÍA SAC',
        email: 'ventas@empresa-tech.com',
        telefono: '014567890',
        direccion: 'Jr. Los Negocios 456, San Isidro',
        tipo_cliente: 'JURIDICA',
        activo: true
      },
      {
        codigo: 'CLI-003',
        tipo_documento: 'DNI',
        numero_documento: '23456789',
        nombre: 'María Fernanda García',
        email: 'maria.garcia@email.com',
        telefono: '998877665',
        direccion: 'Calle Las Flores 789, Miraflores',
        tipo_cliente: 'NATURAL',
        activo: true
      }
    ], { ignoreDuplicates: true, returning: true });

    console.log('🏭 7/10 - Creando proveedores...');
    const proveedores = await Proveedor.bulkCreate([
      {
        codigo: 'PROV-001',
        tipo_documento: 'RUC',
        numero_documento: '20111222333',
        nombre: 'DISTRIBUIDORA TECH PERU SAC',
        email: 'ventas@techperu.com',
        telefono: '014445566',
        direccion: 'Av. Industrial 1000, Lima',
        contacto: 'Juan Pérez',
        tipo_proveedor: 'NACIONAL',
        activo: true
      },
      {
        codigo: 'PROV-002',
        tipo_documento: 'RUC',
        numero_documento: '20444555666',
        nombre: 'IMPORTACIONES GLOBAL TECH SRL',
        email: 'compras@globaltech.pe',
        telefono: '017778899',
        direccion: 'Jr. Importadores 500, Callao',
        contacto: 'Ana Sánchez',
        tipo_proveedor: 'INTERNACIONAL',
        activo: true
      }
    ], { ignoreDuplicates: true, returning: true });

    console.log('💻 8/10 - Creando productos...');
    const productos = await Producto.bulkCreate([
      {
        codigo_interno: 'PROD-001',
        codigo_barras: '7501234567890',
        nombre: 'Laptop HP Pavilion 15',
        descripcion: 'Intel Core i5, 8GB RAM, 256GB SSD, 15.6"',
        categoria_id: categorias[0]?.id || 1,
        marca_id: marcas[0]?.id || 1,
        unidad_medida_id: 1,
        precio_compra: 1200.00,
        costo_promedio: 1200.00,
        precio_venta: 1800.00,
        stock_actual: 15,
        stock_minimo: 5,
        stock_maximo: 50,
        punto_reorden: 8,
        tiene_caducidad: false,
        dias_caducidad: 0,
        activo: true
      },
      {
        codigo_interno: 'PROD-002',
        codigo_barras: '7501234567891',
        nombre: 'Laptop DELL Inspiron 14',
        descripcion: 'Intel Core i7, 16GB RAM, 512GB SSD, 14"',
        categoria_id: categorias[0]?.id || 1,
        marca_id: marcas[1]?.id || 2,
        unidad_medida_id: 1,
        precio_compra: 1800.00,
        costo_promedio: 1800.00,
        precio_venta: 2500.00,
        stock_actual: 10,
        stock_minimo: 3,
        stock_maximo: 30,
        punto_reorden: 5,
        tiene_caducidad: false,
        dias_caducidad: 0,
        activo: true
      },
      {
        codigo_interno: 'PROD-003',
        codigo_barras: '7501234567892',
        nombre: 'Monitor HP 24" Full HD',
        descripcion: 'Monitor LED 24 pulgadas, 1920x1080',
        categoria_id: categorias[1]?.id || 2,
        marca_id: marcas[0]?.id || 1,
        unidad_medida_id: 1,
        precio_compra: 300.00,
        costo_promedio: 300.00,
        precio_venta: 450.00,
        stock_actual: 25,
        stock_minimo: 8,
        stock_maximo: 60,
        punto_reorden: 12,
        tiene_caducidad: false,
        dias_caducidad: 0,
        activo: true
      },
      {
        codigo_interno: 'PROD-004',
        codigo_barras: '7501234567893',
        nombre: 'Teclado Logitech K380',
        descripcion: 'Teclado inalámbrico Bluetooth, multi-dispositivo',
        categoria_id: categorias[2]?.id || 3,
        marca_id: marcas[3]?.id || 4,
        unidad_medida_id: 1,
        precio_compra: 80.00,
        costo_promedio: 80.00,
        precio_venta: 120.00,
        stock_actual: 50,
        stock_minimo: 15,
        stock_maximo: 100,
        punto_reorden: 20,
        tiene_caducidad: false,
        dias_caducidad: 0,
        activo: true
      },
      {
        codigo_interno: 'PROD-005',
        codigo_barras: '7501234567894',
        nombre: 'Mouse Logitech MX Master 3',
        descripcion: 'Mouse inalámbrico ergonómico, USB-C',
        categoria_id: categorias[3]?.id || 4,
        marca_id: marcas[3]?.id || 4,
        unidad_medida_id: 1,
        precio_compra: 150.00,
        costo_promedio: 150.00,
        precio_venta: 230.00,
        stock_actual: 30,
        stock_minimo: 10,
        stock_maximo: 60,
        punto_reorden: 15,
        tiene_caducidad: false,
        dias_caducidad: 0,
        activo: true
      },
      {
        codigo_interno: 'PROD-006',
        codigo_barras: '7501234567895',
        nombre: 'Disco Duro Kingston 1TB SSD',
        descripcion: 'SSD 1TB, SATA III, 550MB/s',
        categoria_id: categorias[4]?.id || 5,
        marca_id: marcas[4]?.id || 5,
        unidad_medida_id: 1,
        precio_compra: 180.00,
        costo_promedio: 180.00,
        precio_venta: 280.00,
        stock_actual: 40,
        stock_minimo: 12,
        stock_maximo: 80,
        punto_reorden: 18,
        tiene_caducidad: false,
        dias_caducidad: 0,
        activo: true
      },
      {
        codigo_interno: 'PROD-007',
        codigo_barras: '7501234567896',
        nombre: 'Memoria RAM Kingston 8GB DDR4',
        descripcion: 'RAM 8GB DDR4 2666MHz',
        categoria_id: categorias[5]?.id || 6,
        marca_id: marcas[4]?.id || 5,
        unidad_medida_id: 1,
        precio_compra: 60.00,
        costo_promedio: 60.00,
        precio_venta: 95.00,
        stock_actual: 60,
        stock_minimo: 20,
        stock_maximo: 120,
        punto_reorden: 30,
        tiene_caducidad: false,
        dias_caducidad: 0,
        activo: true
      }
    ], { ignoreDuplicates: true, returning: true });

    console.log('🛒 9/10 - Creando compras de ejemplo...');
    const fechaBase = new Date('2024-11-01');
    
    const compra1 = await Compra.create({
      numero_factura: 'FC-2024-001',
      proveedor_id: proveedores[0]?.id || 1,
      usuario_id: usuarios[0]?.id || 1,
      fecha_compra: new Date(fechaBase.getTime() + 1 * 24 * 60 * 60 * 1000),
      subtotal: 6000.00,
      descuento: 0,
      impuestos: 1080.00,
      total: 7080.00,
      estado: 'PROCESADA',
      observaciones: 'Compra inicial de laptops'
    });

    await DetalleCompra.bulkCreate([
      {
        compra_id: compra1.id,
        producto_id: productos[0]?.id || 1,
        cantidad: 5,
        precio_unitario: 1200.00,
        descuento: 0,
        subtotal: 6000.00
      }
    ]);

    const compra2 = await Compra.create({
      numero_factura: 'FC-2024-002',
      proveedor_id: proveedores[1]?.id || 2,
      usuario_id: usuarios[0]?.id || 1,
      fecha_compra: new Date(fechaBase.getTime() + 3 * 24 * 60 * 60 * 1000),
      subtotal: 4500.00,
      descuento: 0,
      impuestos: 810.00,
      total: 5310.00,
      estado: 'PROCESADA',
      observaciones: 'Compra de monitores'
    });

    await DetalleCompra.bulkCreate([
      {
        compra_id: compra2.id,
        producto_id: productos[2]?.id || 3,
        cantidad: 15,
        precio_unitario: 300.00,
        descuento: 0,
        subtotal: 4500.00
      }
    ]);

    console.log('💰 10/10 - Creando ventas de ejemplo...');
    
    const venta1 = await Venta.create({
      numero_factura: 'FV-2024-001',
      cliente_id: clientes[0]?.id || 1,
      usuario_id: usuarios[1]?.id || 2,
      fecha_venta: new Date(fechaBase.getTime() + 7 * 24 * 60 * 60 * 1000),
      subtotal: 1800.00,
      descuento: 0,
      impuestos: 324.00,
      total: 2124.00,
      estado: 'PROCESADA',
      observaciones: 'Venta de laptop HP'
    });

    await DetalleVenta.bulkCreate([
      {
        venta_id: venta1.id,
        producto_id: productos[0]?.id || 1,
        cantidad: 1,
        precio_unitario: 1800.00,
        descuento: 0,
        subtotal: 1800.00
      }
    ]);

    const venta2 = await Venta.create({
      numero_factura: 'FV-2024-002',
      cliente_id: clientes[1]?.id || 2,
      usuario_id: usuarios[1]?.id || 2,
      fecha_venta: new Date(fechaBase.getTime() + 8 * 24 * 60 * 60 * 1000),
      subtotal: 1350.00,
      descuento: 0,
      impuestos: 243.00,
      total: 1593.00,
      estado: 'PROCESADA',
      observaciones: 'Venta corporativa de monitores'
    });

    await DetalleVenta.bulkCreate([
      {
        venta_id: venta2.id,
        producto_id: productos[2]?.id || 3,
        cantidad: 3,
        precio_unitario: 450.00,
        descuento: 0,
        subtotal: 1350.00
      }
    ]);

    const venta3 = await Venta.create({
      numero_factura: 'FV-2024-003',
      cliente_id: clientes[2]?.id || 3,
      usuario_id: usuarios[2]?.id || 3,
      fecha_venta: new Date(fechaBase.getTime() + 9 * 24 * 60 * 60 * 1000),
      subtotal: 350.00,
      descuento: 0,
      impuestos: 63.00,
      total: 413.00,
      estado: 'PROCESADA',
      observaciones: 'Venta de periféricos'
    });

    await DetalleVenta.bulkCreate([
      {
        venta_id: venta3.id,
        producto_id: productos[3]?.id || 4,
        cantidad: 2,
        precio_unitario: 120.00,
        descuento: 0,
        subtotal: 240.00
      },
      {
        venta_id: venta3.id,
        producto_id: productos[6]?.id || 7,
        cantidad: 1,
        precio_unitario: 95.00,
        descuento: 0,
        subtotal: 95.00
      }
    ]);

    console.log('✅ Seed completo exitoso!');
    console.log('\n📊 Resumen:');
    console.log(`   - ${usuarios.length} usuarios creados`);
    console.log(`   - ${categorias.length} categorías creadas`);
    console.log(`   - ${marcas.length} marcas creadas`);
    console.log(`   - ${clientes.length} clientes creados`);
    console.log(`   - ${proveedores.length} proveedores creados`);
    console.log(`   - ${productos.length} productos creados`);
    console.log(`   - 2 compras con detalles`);
    console.log(`   - 3 ventas con detalles`);
    console.log('\n🎉 Base de datos lista para usar!\n');

  } catch (error) {
    console.error('❌ Error en el seed:', error);
    throw error;
  }
};

// Si se ejecuta directamente
if (require.main === module) {
  seedCompleteData()
    .then(() => {
      console.log('✅ Proceso completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}
