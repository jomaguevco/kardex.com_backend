import sequelize from '../config/database';
import Usuario from '../models/Usuario';
import Categoria from '../models/Categoria';
import Marca from '../models/Marca';
import Cliente from '../models/Cliente';
import Proveedor from '../models/Proveedor';
import Producto from '../models/Producto';
import Compra from '../models/Compra';
import DetalleCompra from '../models/DetalleCompra';
import Venta from '../models/Venta';
import DetalleVenta from '../models/DetalleVenta';
import crypto from 'crypto';

const hashPassword = (password: string) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min: number, max: number) => Math.random() * (max - min) + min;

const nombresPersonas = ['Juan', 'María', 'Carlos', 'Ana', 'Pedro', 'Laura', 'Luis', 'Carmen', 'José', 'Rosa', 'Miguel', 'Patricia', 'Antonio', 'Isabel', 'Francisco', 'Lucía', 'Manuel', 'Elena', 'Javier', 'Sofía'];
const apellidos = ['García', 'Rodríguez', 'Martínez', 'López', 'González', 'Pérez', 'Sánchez', 'Ramírez', 'Torres', 'Flores', 'Rivera', 'Gómez', 'Díaz', 'Cruz', 'Morales', 'Reyes', 'Gutiérrez', 'Ortiz', 'Jiménez', 'Hernández'];
const empresas = ['Tech Solutions', 'Digital Systems', 'Innovate Corp', 'Smart Business', 'Global Tech', 'Future Systems', 'Advanced Solutions', 'Prime Technology', 'Elite Computing', 'Superior Systems'];
const calles = ['Av. Principal', 'Jr. Comercio', 'Calle Los Olivos', 'Av. Industrial', 'Jr. San Martín', 'Calle Las Flores', 'Av. Universitaria', 'Jr. Los Pinos', 'Calle Real', 'Av. Central'];
const distritos = ['Lima', 'Miraflores', 'San Isidro', 'Surco', 'La Molina', 'San Borja', 'Los Olivos', 'San Miguel', 'Callao', 'Pueblo Libre'];

const nombresProductos = {
  laptops: ['Laptop Gaming', 'Laptop Ultrabook', 'Laptop Business', 'Laptop Student', 'Laptop Pro', 'Laptop Air', 'Laptop Workstation'],
  monitores: ['Monitor Gaming', 'Monitor Profesional', 'Monitor UltraWide', 'Monitor Curvo', 'Monitor 4K', 'Monitor Full HD'],
  teclados: ['Teclado Mecánico', 'Teclado Gaming RGB', 'Teclado Inalámbrico', 'Teclado Compacto', 'Teclado Ergonómico'],
  mouse: ['Mouse Gaming', 'Mouse Inalámbrico', 'Mouse Ergonómico', 'Mouse Vertical', 'Mouse Trackball'],
  audio: ['Auriculares Gaming', 'Auriculares Bluetooth', 'Parlantes 2.1', 'Parlantes 5.1', 'Micrófono USB'],
  componentes: ['Tarjeta Gráfica', 'Procesador', 'Motherboard', 'Fuente de Poder', 'Case Gaming'],
  almacenamiento: ['SSD NVMe', 'SSD SATA', 'HDD 1TB', 'HDD 2TB', 'Memoria USB'],
  memorias: ['RAM DDR4 8GB', 'RAM DDR4 16GB', 'RAM DDR5 16GB', 'RAM DDR5 32GB'],
  redes: ['Router WiFi 6', 'Switch Gigabit', 'Access Point', 'Adaptador WiFi', 'Cable Red Cat6'],
  accesorios: ['Webcam HD', 'Hub USB', 'Adaptador HDMI', 'Base Enfriadora', 'Mousepad Gaming']
};

export const seedMassiveData = async () => {
  try {
    console.log('🚀 Iniciando seed MASIVO de datos...\n');

    // Obtener datos existentes
    const usuariosExistentes = await Usuario.findAll();
    const categoriasExistentes = await Categoria.findAll();
    const marcasExistentes = await Marca.findAll();

    console.log('👥 1/6 - Creando 20 clientes adicionales...');
    const nuevosClientes = [];
    for (let i = 0; i < 20; i++) {
      const esEmpresa = Math.random() > 0.7;
      const numero = 1000 + i;
      
      if (esEmpresa) {
        nuevosClientes.push({
          codigo: `CLI-${String(numero).padStart(4, '0')}`,
          tipo_documento: 'RUC' as 'RUC',
          numero_documento: `20${randomInt(100000000, 999999999)}`,
          nombre: `${empresas[randomInt(0, empresas.length - 1)]} ${['SAC', 'SRL', 'EIRL', 'SA'][randomInt(0, 3)]}`,
          email: `ventas${i}@empresa${i}.com`,
          telefono: `01${randomInt(1000000, 9999999)}`,
          direccion: `${calles[randomInt(0, calles.length - 1)]} ${randomInt(100, 999)}, ${distritos[randomInt(0, distritos.length - 1)]}`,
          tipo_cliente: 'JURIDICA' as 'JURIDICA',
          activo: true
        });
      } else {
        const nombre = nombresPersonas[randomInt(0, nombresPersonas.length - 1)];
        const apellido1 = apellidos[randomInt(0, apellidos.length - 1)];
        const apellido2 = apellidos[randomInt(0, apellidos.length - 1)];
        nuevosClientes.push({
          codigo: `CLI-${String(numero).padStart(4, '0')}`,
          tipo_documento: 'DNI' as 'DNI',
          numero_documento: String(randomInt(10000000, 99999999)),
          nombre: `${nombre} ${apellido1} ${apellido2}`,
          email: `${nombre.toLowerCase()}.${apellido1.toLowerCase()}${i}@email.com`,
          telefono: `9${randomInt(10000000, 99999999)}`,
          direccion: `${calles[randomInt(0, calles.length - 1)]} ${randomInt(100, 999)}, ${distritos[randomInt(0, distritos.length - 1)]}`,
          tipo_cliente: 'NATURAL' as 'NATURAL',
          activo: Math.random() > 0.1
        });
      }
    }
    await Cliente.bulkCreate(nuevosClientes, { ignoreDuplicates: true });
    console.log(`   ✅ ${nuevosClientes.length} clientes creados`);

    console.log('🏭 2/6 - Creando 10 proveedores adicionales...');
    const nuevosProveedores = [];
    for (let i = 0; i < 10; i++) {
      const numero = 100 + i;
      nuevosProveedores.push({
        codigo: `PROV-${String(numero).padStart(4, '0')}`,
        tipo_documento: 'RUC' as 'RUC',
        numero_documento: `20${randomInt(100000000, 999999999)}`,
        nombre: `${empresas[randomInt(0, empresas.length - 1)]} ${['DISTRIBUIDORA', 'IMPORTADORA', 'COMERCIAL', 'MAYORISTA'][randomInt(0, 3)]} ${['SAC', 'SRL', 'SA'][randomInt(0, 2)]}`,
        email: `compras${i}@proveedor${i}.com`,
        telefono: `01${randomInt(1000000, 9999999)}`,
        direccion: `${calles[randomInt(0, calles.length - 1)]} ${randomInt(100, 999)}, ${distritos[randomInt(0, distritos.length - 1)]}`,
        contacto: `${nombresPersonas[randomInt(0, nombresPersonas.length - 1)]} ${apellidos[randomInt(0, apellidos.length - 1)]}`,
        tipo_proveedor: (Math.random() > 0.3 ? 'NACIONAL' : 'INTERNACIONAL') as 'NACIONAL' | 'INTERNACIONAL',
        activo: true
      });
    }
    await Proveedor.bulkCreate(nuevosProveedores, { ignoreDuplicates: true });
    console.log(`   ✅ ${nuevosProveedores.length} proveedores creados`);

    console.log('💻 3/6 - Creando 100 productos adicionales...');
    const marcas = await Marca.findAll();
    const categorias = await Categoria.findAll();
    const nuevosProductos = [];
    let codigoProducto = 100;

    // Crear productos variados
    const tiposProductos = Object.keys(nombresProductos);
    for (let i = 0; i < 100; i++) {
      const tipo = tiposProductos[randomInt(0, tiposProductos.length - 1)];
      const nombres = nombresProductos[tipo as keyof typeof nombresProductos];
      const nombreBase = nombres[randomInt(0, nombres.length - 1)];
      const marca = marcas[randomInt(0, marcas.length - 1)];
      const categoria = categorias[randomInt(0, categorias.length - 1)];
      
      const precioCompra = randomFloat(50, 2000);
      const margen = randomFloat(1.3, 2.5);
      const precioVenta = Math.round(precioCompra * margen * 100) / 100;
      const stockInicial = randomInt(5, 100);

      nuevosProductos.push({
        codigo_interno: `PROD-${String(codigoProducto++).padStart(4, '0')}`,
        codigo_barras: `75012${String(randomInt(10000000, 99999999))}`,
        nombre: `${marca.nombre} ${nombreBase} ${['Pro', 'Plus', 'Elite', 'Max', 'Ultra', ''][randomInt(0, 5)]}`.trim(),
        descripcion: `Producto de alta calidad marca ${marca.nombre}`,
        categoria_id: categoria.id,
        marca_id: marca.id,
        unidad_medida_id: 1,
        precio_compra: Math.round(precioCompra * 100) / 100,
        costo_promedio: Math.round(precioCompra * 100) / 100,
        precio_venta: precioVenta,
        stock_actual: stockInicial,
        stock_minimo: Math.max(3, Math.floor(stockInicial * 0.2)),
        stock_maximo: stockInicial * 3,
        punto_reorden: Math.max(5, Math.floor(stockInicial * 0.3)),
        tiene_caducidad: false,
        dias_caducidad: 0,
        activo: Math.random() > 0.05
      });
    }
    await Producto.bulkCreate(nuevosProductos, { ignoreDuplicates: true });
    console.log(`   ✅ ${nuevosProductos.length} productos creados`);

    console.log('🛒 4/6 - Creando 30 compras con detalles...');
    const productos = await Producto.findAll();
    const proveedores = await Proveedor.findAll();
    const usuarios = await Usuario.findAll();

    for (let i = 0; i < 30; i++) {
      const fechaCompra = new Date();
      fechaCompra.setDate(fechaCompra.getDate() - randomInt(1, 90));
      
      const numProductos = randomInt(1, 5);
      const productosCompra = [];
      let subtotalCompra = 0;

      for (let j = 0; j < numProductos; j++) {
        const producto = productos[randomInt(0, productos.length - 1)];
        const cantidad = randomInt(5, 50);
        const precioUnitario = producto.precio_compra;
        const subtotal = cantidad * precioUnitario;
        
        productosCompra.push({
          producto_id: producto.id,
          cantidad,
          precio_unitario: precioUnitario,
          descuento: 0,
          subtotal
        });
        
        subtotalCompra += subtotal;
      }

      const impuestos = subtotalCompra * 0.18;
      const total = subtotalCompra + impuestos;

      const compra = await Compra.create({
        numero_factura: `FC-2024-${String(1000 + i).padStart(5, '0')}`,
        proveedor_id: proveedores[randomInt(0, proveedores.length - 1)].id,
        usuario_id: usuarios[randomInt(0, usuarios.length - 1)].id,
        fecha_compra: fechaCompra,
        subtotal: Math.round(subtotalCompra * 100) / 100,
        descuento: 0,
        impuestos: Math.round(impuestos * 100) / 100,
        total: Math.round(total * 100) / 100,
        estado: ['PENDIENTE', 'PROCESADA', 'ANULADA'][Math.random() > 0.9 ? 2 : Math.random() > 0.2 ? 1 : 0] as any,
        observaciones: `Compra ${i + 1}`
      });

      for (const detalle of productosCompra) {
        await DetalleCompra.create({
          compra_id: compra.id,
          ...detalle
        });
      }
    }
    console.log(`   ✅ 30 compras creadas con múltiples detalles`);

    console.log('💰 5/6 - Creando 50 ventas con detalles...');
    const clientes = await Cliente.findAll();

    for (let i = 0; i < 50; i++) {
      const fechaVenta = new Date();
      fechaVenta.setDate(fechaVenta.getDate() - randomInt(1, 60));
      
      const numProductos = randomInt(1, 4);
      const productosVenta = [];
      let subtotalVenta = 0;

      for (let j = 0; j < numProductos; j++) {
        const producto = productos[randomInt(0, productos.length - 1)];
        const cantidad = randomInt(1, 10);
        const precioUnitario = producto.precio_venta;
        const descuentoItem = Math.random() > 0.7 ? randomFloat(0, precioUnitario * 0.1) : 0;
        const subtotal = (cantidad * precioUnitario) - descuentoItem;
        
        productosVenta.push({
          producto_id: producto.id,
          cantidad,
          precio_unitario: precioUnitario,
          descuento: Math.round(descuentoItem * 100) / 100,
          subtotal: Math.round(subtotal * 100) / 100
        });
        
        subtotalVenta += subtotal;
      }

      const descuentoTotal = Math.random() > 0.8 ? randomFloat(0, subtotalVenta * 0.05) : 0;
      const baseImponible = subtotalVenta - descuentoTotal;
      const impuestos = baseImponible * 0.18;
      const total = baseImponible + impuestos;

      const venta = await Venta.create({
        numero_factura: `FV-2024-${String(2000 + i).padStart(5, '0')}`,
        cliente_id: clientes[randomInt(0, clientes.length - 1)].id,
        usuario_id: usuarios[randomInt(0, usuarios.length - 1)].id,
        fecha_venta: fechaVenta,
        subtotal: Math.round(subtotalVenta * 100) / 100,
        descuento: Math.round(descuentoTotal * 100) / 100,
        impuestos: Math.round(impuestos * 100) / 100,
        total: Math.round(total * 100) / 100,
        estado: ['PENDIENTE', 'PROCESADA', 'ANULADA'][Math.random() > 0.95 ? 2 : Math.random() > 0.1 ? 1 : 0] as any,
        observaciones: `Venta ${i + 1}`
      });

      for (const detalle of productosVenta) {
        await DetalleVenta.create({
          venta_id: venta.id,
          ...detalle
        });
      }
    }
    console.log(`   ✅ 50 ventas creadas con múltiples detalles`);

    console.log('\n✅ Seed MASIVO completado exitosamente!\n');
    console.log('📊 RESUMEN TOTAL:');
    console.log(`   - ${await Usuario.count()} usuarios en total`);
    console.log(`   - ${await Cliente.count()} clientes en total`);
    console.log(`   - ${await Proveedor.count()} proveedores en total`);
    console.log(`   - ${await Producto.count()} productos en total`);
    console.log(`   - ${await Compra.count()} compras en total`);
    console.log(`   - ${await Venta.count()} ventas en total`);
    console.log('\n🎉 Base de datos completa con datos masivos!\n');

  } catch (error) {
    console.error('❌ Error en el seed masivo:', error);
    throw error;
  }
};

// Si se ejecuta directamente
if (require.main === module) {
  seedMassiveData()
    .then(() => {
      console.log('✅ Proceso completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}

