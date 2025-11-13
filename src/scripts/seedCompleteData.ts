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
      console.log('⚠️  Ya existen datos en la base de datos. ¿Deseas continuar? (Esto agregará más datos)');
      // Continuar de todas formas para agregar más datos
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
      },
      {
        nombre_usuario: 'almacenero1',
        contrasena: hashPassword('almacen123'),
        nombre_completo: 'Roberto Sánchez Torres',
        email: 'rsanchez@kardex.com',
        rol: 'ALMACENERO',
        activo: true
      }
    ], { ignoreDuplicates: true, returning: true });

    console.log('📁 2/10 - Creando categorías...');
    const categorias = await Categoria.bulkCreate([
      { nombre: 'LAPTOPS', descripcion: 'Computadoras portátiles', activo: true },
      { nombre: 'DESKTOPS', descripcion: 'Computadoras de escritorio', activo: true },
      { nombre: 'MONITORES', descripcion: 'Pantallas y monitores', activo: true },
      { nombre: 'TECLADOS', descripcion: 'Teclados y accesorios', activo: true },
      { nombre: 'MOUSE', descripcion: 'Ratones y trackpads', activo: true },
      { nombre: 'DISCOS DUROS', descripcion: 'Almacenamiento externo e interno', activo: true },
      { nombre: 'MEMORIAS RAM', descripcion: 'Memorias de acceso aleatorio', activo: true },
      { nombre: 'PROCESADORES', descripcion: 'CPUs y procesadores', activo: true },
      { nombre: 'TARJETAS GRÁFICAS', descripcion: 'GPUs y tarjetas de video', activo: true },
      { nombre: 'IMPRESORAS', descripcion: 'Impresoras y escáneres', activo: true }
    ], { ignoreDuplicates: true, returning: true });

    console.log('🏷️  3/10 - Creando marcas...');
    const marcas = await Marca.bulkCreate([
      { nombre: 'HP', descripcion: 'Hewlett-Packard', activo: true },
      { nombre: 'DELL', descripcion: 'Dell Technologies', activo: true },
      { nombre: 'LENOVO', descripcion: 'Lenovo Group', activo: true },
      { nombre: 'ASUS', descripcion: 'ASUSTeK Computer', activo: true },
      { nombre: 'ACER', descripcion: 'Acer Incorporated', activo: true },
      { nombre: 'LOGITECH', descripcion: 'Logitech International', activo: true },
      { nombre: 'KINGSTON', descripcion: 'Kingston Technology', activo: true },
      { nombre: 'SAMSUNG', descripcion: 'Samsung Electronics', activo: true },
      { nombre: 'INTEL', descripcion: 'Intel Corporation', activo: true },
      { nombre: 'AMD', descripcion: 'Advanced Micro Devices', activo: true },
      { nombre: 'NVIDIA', descripcion: 'NVIDIA Corporation', activo: true },
      { nombre: 'CORSAIR', descripcion: 'Corsair Gaming', activo: true }
    ], { ignoreDuplicates: true, returning: true });

    console.log('📏 4/10 - Creando unidades de medida...');
    await UnidadMedida.bulkCreate([
      { nombre: 'UNIDAD', abreviatura: 'UND', activo: true },
      { nombre: 'CAJA', abreviatura: 'CJA', activo: true },
      { nombre: 'PAQUETE', abreviatura: 'PAQ', activo: true }
    ], { ignoreDuplicates: true });

    console.log('🏢 5/10 - Creando almacenes...');
    await Almacen.bulkCreate([
      {
        codigo: 'ALM-001',
        nombre: 'ALMACÉN PRINCIPAL',
        direccion: 'Av. Principal 100, Lima',
        responsable: 'Carlos Rodríguez',
        activo: true
      },
      {
        codigo: 'ALM-002',
        nombre: 'ALMACÉN SUCURSAL NORTE',
        direccion: 'Jr. Comercio 250, Los Olivos',
        responsable: 'Ana Torres',
        activo: true
      }
    ], { ignoreDuplicates: true });

    console.log('👥 6/10 - Creando clientes...');
    const clientes = await Cliente.bulkCreate([
      {
        tipo_documento: 'DNI',
        numero_documento: '12345678',
        nombre: 'Carlos Alberto Mendoza',
        email: 'carlos.mendoza@email.com',
        telefono: '987654321',
        direccion: 'Av. Los Pinos 123, Lima',
        activo: true
      },
      {
        tipo_documento: 'RUC',
        numero_documento: '20123456789',
        nombre: 'EMPRESA TECNOLOGÍA SAC',
        email: 'ventas@empresa-tech.com',
        telefono: '014567890',
        direccion: 'Jr. Los Negocios 456, San Isidro',
        activo: true
      },
      {
        tipo_documento: 'DNI',
        numero_documento: '23456789',
        nombre: 'María Fernanda García',
        email: 'maria.garcia@email.com',
        telefono: '998877665',
        direccion: 'Calle Las Flores 789, Miraflores',
        activo: true
      },
      {
        tipo_documento: 'DNI',
        numero_documento: '34567890',
        nombre: 'Jorge Luis Ramírez',
        email: 'jorge.ramirez@email.com',
        telefono: '955443322',
        direccion: 'Av. Universitaria 321, San Miguel',
        activo: true
      },
      {
        tipo_documento: 'RUC',
        numero_documento: '20987654321',
        nombre: 'INVERSIONES DIGITALES EIRL',
        email: 'contacto@invdigital.com',
        telefono: '015551234',
        direccion: 'Av. Javier Prado 999, San Borja',
        activo: true
      }
    ], { ignoreDuplicates: true, returning: true });

    console.log('🏭 7/10 - Creando proveedores...');
    const proveedores = await Proveedor.bulkCreate([
      {
        ruc: '20111222333',
        razon_social: 'DISTRIBUIDORA TECH PERU SAC',
        nombre_comercial: 'TechPeru',
        email: 'ventas@techperu.com',
        telefono: '014445566',
        direccion: 'Av. Industrial 1000, Lima',
        contacto: 'Juan Pérez',
        activo: true
      },
      {
        ruc: '20444555666',
        razon_social: 'IMPORTACIONES GLOBAL TECH SRL',
        nombre_comercial: 'GlobalTech',
        email: 'compras@globaltech.pe',
        telefono: '017778899',
        direccion: 'Jr. Importadores 500, Callao',
        contacto: 'Ana Sánchez',
        activo: true
      },
      {
        ruc: '20777888999',
        razon_social: 'MAYORISTA DE COMPUTADORAS SA',
        nombre_comercial: 'MayoristaPC',
        email: 'info@mayoristapc.com',
        telefono: '013332211',
        direccion: 'Av. Mayorista 250, Lima',
        contacto: 'Roberto Torres',
        activo: true
      }
    ], { ignoreDuplicates: true, returning: true });

    console.log('💻 8/10 - Creando productos...');
    const productos = await Producto.bulkCreate([
      // Laptops
      {
        codigo_interno: 'PROD-001',
        codigo_barras: '7501234567890',
        nombre: 'Laptop HP Pavilion 15',
        descripcion: 'Intel Core i5, 8GB RAM, 256GB SSD, 15.6"',
        categoria_id: categorias[0]?.id || 1,
        marca_id: marcas[0]?.id || 1,
        unidad_medida_id: 1,
        precio_compra: 1200.00,
        precio_venta: 1800.00,
        stock_actual: 15,
        stock_minimo: 5,
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
        precio_venta: 2500.00,
        stock_actual: 10,
        stock_minimo: 3,
        activo: true
      },
      {
        codigo_interno: 'PROD-003',
        codigo_barras: '7501234567892',
        nombre: 'Laptop LENOVO ThinkPad',
        descripcion: 'Intel Core i5, 8GB RAM, 256GB SSD, 14"',
        categoria_id: categorias[0]?.id || 1,
        marca_id: marcas[2]?.id || 3,
        unidad_medida_id: 1,
        precio_compra: 1500.00,
        precio_venta: 2100.00,
        stock_actual: 8,
        stock_minimo: 4,
        activo: true
      },
      // Monitores
      {
        codigo_interno: 'PROD-004',
        codigo_barras: '7501234567893',
        nombre: 'Monitor HP 24" Full HD',
        descripcion: 'Monitor LED 24 pulgadas, 1920x1080',
        categoria_id: categorias[2]?.id || 3,
        marca_id: marcas[0]?.id || 1,
        unidad_medida_id: 1,
        precio_compra: 300.00,
        precio_venta: 450.00,
        stock_actual: 25,
        stock_minimo: 8,
        activo: true
      },
      {
        codigo_interno: 'PROD-005',
        codigo_barras: '7501234567894',
        nombre: 'Monitor DELL 27" 4K',
        descripcion: 'Monitor LED 27 pulgadas, 3840x2160, IPS',
        categoria_id: categorias[2]?.id || 3,
        marca_id: marcas[1]?.id || 2,
        unidad_medida_id: 1,
        precio_compra: 800.00,
        precio_venta: 1200.00,
        stock_actual: 12,
        stock_minimo: 5,
        activo: true
      },
      // Teclados
      {
        codigo_interno: 'PROD-006',
        codigo_barras: '7501234567895',
        nombre: 'Teclado Logitech K380',
        descripcion: 'Teclado inalámbrico Bluetooth, multi-dispositivo',
        categoria_id: categorias[3]?.id || 4,
        marca_id: marcas[5]?.id || 6,
        unidad_medida_id: 1,
        precio_compra: 80.00,
        precio_venta: 120.00,
        stock_actual: 50,
        stock_minimo: 15,
        activo: true
      },
      {
        codigo_interno: 'PROD-007',
        codigo_barras: '7501234567896',
        nombre: 'Teclado Mecánico Corsair K70',
        descripcion: 'Teclado mecánico RGB, Cherry MX Red',
        categoria_id: categorias[3]?.id || 4,
        marca_id: marcas[11]?.id || 12,
        unidad_medida_id: 1,
        precio_compra: 200.00,
        precio_venta: 320.00,
        stock_actual: 18,
        stock_minimo: 6,
        activo: true
      },
      // Mouse
      {
        codigo_interno: 'PROD-008',
        codigo_barras: '7501234567897',
        nombre: 'Mouse Logitech MX Master 3',
        descripcion: 'Mouse inalámbrico ergonómico, USB-C',
        categoria_id: categorias[4]?.id || 5,
        marca_id: marcas[5]?.id || 6,
        unidad_medida_id: 1,
        precio_compra: 150.00,
        precio_venta: 230.00,
        stock_actual: 30,
        stock_minimo: 10,
        activo: true
      },
      // Discos Duros
      {
        codigo_interno: 'PROD-009',
        codigo_barras: '7501234567898',
        nombre: 'Disco Duro Kingston 1TB SSD',
        descripcion: 'SSD 1TB, SATA III, 550MB/s',
        categoria_id: categorias[5]?.id || 6,
        marca_id: marcas[6]?.id || 7,
        unidad_medida_id: 1,
        precio_compra: 180.00,
        precio_venta: 280.00,
        stock_actual: 40,
        stock_minimo: 12,
        activo: true
      },
      {
        codigo_interno: 'PROD-010',
        codigo_barras: '7501234567899',
        nombre: 'Disco Duro Samsung 500GB SSD',
        descripcion: 'SSD NVMe 500GB, PCIe Gen3',
        categoria_id: categorias[5]?.id || 6,
        marca_id: marcas[7]?.id || 8,
        unidad_medida_id: 1,
        precio_compra: 120.00,
        precio_venta: 190.00,
        stock_actual: 35,
        stock_minimo: 10,
        activo: true
      },
      // Memorias RAM
      {
        codigo_interno: 'PROD-011',
        codigo_barras: '7501234567900',
        nombre: 'Memoria RAM Kingston 8GB DDR4',
        descripcion: 'RAM 8GB DDR4 2666MHz',
        categoria_id: categorias[6]?.id || 7,
        marca_id: marcas[6]?.id || 7,
        unidad_medida_id: 1,
        precio_compra: 60.00,
        precio_venta: 95.00,
        stock_actual: 60,
        stock_minimo: 20,
        activo: true
      },
      {
        codigo_interno: 'PROD-012',
        codigo_barras: '7501234567901',
        nombre: 'Memoria RAM Corsair 16GB DDR4',
        descripcion: 'RAM 16GB DDR4 3200MHz RGB',
        categoria_id: categorias[6]?.id || 7,
        marca_id: marcas[11]?.id || 12,
        unidad_medida_id: 1,
        precio_compra: 120.00,
        precio_venta: 180.00,
        stock_actual: 45,
        stock_minimo: 15,
        activo: true
      },
      // Procesadores
      {
        codigo_interno: 'PROD-013',
        codigo_barras: '7501234567902',
        nombre: 'Procesador Intel Core i5-11400',
        descripcion: 'CPU Intel Core i5 11th Gen, 6 cores',
        categoria_id: categorias[7]?.id || 8,
        marca_id: marcas[8]?.id || 9,
        unidad_medida_id: 1,
        precio_compra: 350.00,
        precio_venta: 520.00,
        stock_actual: 20,
        stock_minimo: 5,
        activo: true
      },
      {
        codigo_interno: 'PROD-014',
        codigo_barras: '7501234567903',
        nombre: 'Procesador AMD Ryzen 5 5600X',
        descripcion: 'CPU AMD Ryzen 5, 6 cores, 12 threads',
        categoria_id: categorias[7]?.id || 8,
        marca_id: marcas[9]?.id || 10,
        unidad_medida_id: 1,
        precio_compra: 400.00,
        precio_venta: 590.00,
        stock_actual: 15,
        stock_minimo: 4,
        activo: true
      },
      // Tarjetas Gráficas
      {
        codigo_interno: 'PROD-015',
        codigo_barras: '7501234567904',
        nombre: 'Tarjeta Gráfica NVIDIA RTX 3060',
        descripcion: 'GPU NVIDIA GeForce RTX 3060 12GB',
        categoria_id: categorias[8]?.id || 9,
        marca_id: marcas[10]?.id || 11,
        unidad_medida_id: 1,
        precio_compra: 800.00,
        precio_venta: 1200.00,
        stock_actual: 8,
        stock_minimo: 3,
        activo: true
      }
    ], { ignoreDuplicates: true, returning: true });

    console.log('🛒 9/10 - Creando compras de ejemplo...');
    const fechaBase = new Date('2024-11-01');
    
    // Compra 1
    const compra1 = await Compra.create({
      numero_factura: 'FC-2024-001',
      proveedor_id: proveedores[0]?.id || 1,
      usuario_id: usuarios[0]?.id || 1,
      fecha_compra: new Date(fechaBase.getTime() + 1 * 24 * 60 * 60 * 1000),
      subtotal: 6000.00,
      impuesto: 1080.00,
      total: 7080.00,
      estado: 'completada',
      observaciones: 'Compra inicial de laptops'
    });

    await DetalleCompra.bulkCreate([
      {
        compra_id: compra1.id,
        producto_id: productos[0]?.id || 1,
        cantidad: 5,
        precio_unitario: 1200.00,
        subtotal: 6000.00
      }
    ]);

    // Compra 2
    const compra2 = await Compra.create({
      numero_factura: 'FC-2024-002',
      proveedor_id: proveedores[1]?.id || 2,
      usuario_id: usuarios[0]?.id || 1,
      fecha_compra: new Date(fechaBase.getTime() + 3 * 24 * 60 * 60 * 1000),
      subtotal: 4500.00,
      impuesto: 810.00,
      total: 5310.00,
      estado: 'completada',
      observaciones: 'Compra de monitores'
    });

    await DetalleCompra.bulkCreate([
      {
        compra_id: compra2.id,
        producto_id: productos[3]?.id || 4,
        cantidad: 15,
        precio_unitario: 300.00,
        subtotal: 4500.00
      }
    ]);

    // Compra 3
    const compra3 = await Compra.create({
      numero_factura: 'FC-2024-003',
      proveedor_id: proveedores[2]?.id || 3,
      usuario_id: usuarios[3]?.id || 4,
      fecha_compra: new Date(fechaBase.getTime() + 5 * 24 * 60 * 60 * 1000),
      subtotal: 2400.00,
      impuesto: 432.00,
      total: 2832.00,
      estado: 'completada',
      observaciones: 'Compra de periféricos'
    });

    await DetalleCompra.bulkCreate([
      {
        compra_id: compra3.id,
        producto_id: productos[5]?.id || 6,
        cantidad: 20,
        precio_unitario: 80.00,
        subtotal: 1600.00
      },
      {
        compra_id: compra3.id,
        producto_id: productos[7]?.id || 8,
        cantidad: 10,
        precio_unitario: 80.00,
        subtotal: 800.00
      }
    ]);

    console.log('💰 10/10 - Creando ventas de ejemplo...');
    
    // Venta 1
    const venta1 = await Venta.create({
      numero_factura: 'FV-2024-001',
      cliente_id: clientes[0]?.id || 1,
      usuario_id: usuarios[1]?.id || 2,
      fecha_venta: new Date(fechaBase.getTime() + 7 * 24 * 60 * 60 * 1000),
      subtotal: 1800.00,
      descuento: 0,
      impuesto: 324.00,
      total: 2124.00,
      estado: 'completada',
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

    // Venta 2
    const venta2 = await Venta.create({
      numero_factura: 'FV-2024-002',
      cliente_id: clientes[1]?.id || 2,
      usuario_id: usuarios[1]?.id || 2,
      fecha_venta: new Date(fechaBase.getTime() + 8 * 24 * 60 * 60 * 1000),
      subtotal: 3450.00,
      descuento: 150.00,
      impuesto: 594.00,
      total: 3894.00,
      estado: 'completada',
      observaciones: 'Venta corporativa de monitores'
    });

    await DetalleVenta.bulkCreate([
      {
        venta_id: venta2.id,
        producto_id: productos[3]?.id || 4,
        cantidad: 3,
        precio_unitario: 450.00,
        descuento: 50.00,
        subtotal: 1300.00
      },
      {
        venta_id: venta2.id,
        producto_id: productos[4]?.id || 5,
        cantidad: 2,
        precio_unitario: 1200.00,
        descuento: 100.00,
        subtotal: 2300.00
      }
    ]);

    // Venta 3
    const venta3 = await Venta.create({
      numero_factura: 'FV-2024-003',
      cliente_id: clientes[2]?.id || 3,
      usuario_id: usuarios[2]?.id || 3,
      fecha_venta: new Date(fechaBase.getTime() + 9 * 24 * 60 * 60 * 1000),
      subtotal: 540.00,
      descuento: 0,
      impuesto: 97.20,
      total: 637.20,
      estado: 'completada',
      observaciones: 'Venta de periféricos'
    });

    await DetalleVenta.bulkCreate([
      {
        venta_id: venta3.id,
        producto_id: productos[5]?.id || 6,
        cantidad: 2,
        precio_unitario: 120.00,
        descuento: 0,
        subtotal: 240.00
      },
      {
        venta_id: venta3.id,
        producto_id: productos[7]?.id || 8,
        cantidad: 1,
        precio_unitario: 230.00,
        descuento: 0,
        subtotal: 230.00
      },
      {
        venta_id: venta3.id,
        producto_id: productos[10]?.id || 11,
        cantidad: 1,
        precio_unitario: 95.00,
        descuento: 0,
        subtotal: 95.00
      }
    ]);

    // Venta 4
    const venta4 = await Venta.create({
      numero_factura: 'FV-2024-004',
      cliente_id: clientes[3]?.id || 4,
      usuario_id: usuarios[1]?.id || 2,
      fecha_venta: new Date(fechaBase.getTime() + 10 * 24 * 60 * 60 * 1000),
      subtotal: 2500.00,
      descuento: 100.00,
      impuesto: 432.00,
      total: 2832.00,
      estado: 'completada',
      observaciones: 'Venta de laptop DELL'
    });

    await DetalleVenta.bulkCreate([
      {
        venta_id: venta4.id,
        producto_id: productos[1]?.id || 2,
        cantidad: 1,
        precio_unitario: 2500.00,
        descuento: 100.00,
        subtotal: 2400.00
      }
    ]);

    // Venta 5
    const venta5 = await Venta.create({
      numero_factura: 'FV-2024-005',
      cliente_id: clientes[4]?.id || 5,
      usuario_id: usuarios[2]?.id || 3,
      fecha_venta: new Date(fechaBase.getTime() + 11 * 24 * 60 * 60 * 1000),
      subtotal: 1660.00,
      descuento: 60.00,
      impuesto: 288.00,
      total: 1888.00,
      estado: 'completada',
      observaciones: 'Venta de componentes PC'
    });

    await DetalleVenta.bulkCreate([
      {
        venta_id: venta5.id,
        producto_id: productos[12]?.id || 13,
        cantidad: 1,
        precio_unitario: 520.00,
        descuento: 20.00,
        subtotal: 500.00
      },
      {
        venta_id: venta5.id,
        producto_id: productos[8]?.id || 9,
        cantidad: 2,
        precio_unitario: 280.00,
        descuento: 20.00,
        subtotal: 540.00
      },
      {
        venta_id: venta5.id,
        producto_id: productos[11]?.id || 12,
        cantidad: 2,
        precio_unitario: 180.00,
        descuento: 20.00,
        subtotal: 340.00
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
    console.log(`   - 3 compras con detalles`);
    console.log(`   - 5 ventas con detalles`);
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

