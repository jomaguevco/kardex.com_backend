import sequelize from '../config/database';
import Usuario from '../models/Usuario';
import Categoria from '../models/Categoria';
import Marca from '../models/Marca';
import UnidadMedida from '../models/UnidadMedida';
import Almacen from '../models/Almacen';
import TipoMovimientoKardex from '../models/TipoMovimientoKardex';
import crypto from 'crypto';

export const seedInitialData = async () => {
  try {
    console.log('📦 Insertando datos iniciales...');

    // Verificar si ya existen datos
    const categoriaCount = await Categoria.count();
    if (categoriaCount > 0) {
      console.log('✅ Los datos iniciales ya existen');
      return;
    }

    // Usuarios adicionales
    const hashedPasswordVendedor = crypto.createHash('sha256').update('vendedor123').digest('hex');
    const hashedPasswordAlmacen = crypto.createHash('sha256').update('almacen123').digest('hex');
    const hashedPasswordContador = crypto.createHash('sha256').update('contador123').digest('hex');

    await Usuario.bulkCreate([
      {
        nombre_usuario: 'vendedor1',
        contrasena: hashedPasswordVendedor,
        nombre_completo: 'Juan Carlos Pérez',
        email: 'jperez@empresa.com',
        rol: 'VENDEDOR',
        activo: true
      },
      {
        nombre_usuario: 'vendedor2',
        contrasena: hashedPasswordVendedor,
        nombre_completo: 'María Elena López',
        email: 'mlopez@empresa.com',
        rol: 'VENDEDOR',
        activo: true
      },
      {
        nombre_usuario: 'almacen1',
        contrasena: hashedPasswordAlmacen,
        nombre_completo: 'Roberto Sánchez Torres',
        email: 'rsanchez@empresa.com',
        rol: 'ALMACENERO',
        activo: true
      },
      {
        nombre_usuario: 'contador1',
        contrasena: hashedPasswordContador,
        nombre_completo: 'Carlos Alberto Díaz',
        email: 'cdiaz@empresa.com',
        rol: 'CONTADOR',
        activo: true
      }
    ], { ignoreDuplicates: true });

    // Categorías
    await Categoria.bulkCreate([
      { nombre: 'COMPUTADORAS', descripcion: 'Equipos de cómputo y accesorios', activo: true },
      { nombre: 'PERIFÉRICOS', descripcion: 'Dispositivos periféricos para PC', activo: true },
      { nombre: 'ALMACENAMIENTO', descripcion: 'Discos duros y memorias', activo: true },
      { nombre: 'REDES', descripcion: 'Equipos de red y comunicaciones', activo: true }
    ], { ignoreDuplicates: true });

    // Marcas
    await Marca.bulkCreate([
      { nombre: 'HP', descripcion: 'Hewlett-Packard', activo: true },
      { nombre: 'DELL', descripcion: 'Dell Technologies', activo: true },
      { nombre: 'LENOVO', descripcion: 'Lenovo Group', activo: true },
      { nombre: 'LOGITECH', descripcion: 'Logitech International', activo: true },
      { nombre: 'KINGSTON', descripcion: 'Kingston Technology', activo: true },
      { nombre: 'SAMSUNG', descripcion: 'Samsung Electronics', activo: true },
      { nombre: 'TP-LINK', descripcion: 'TP-Link Technologies', activo: true }
    ], { ignoreDuplicates: true });

    // Unidades de medida
    await UnidadMedida.bulkCreate([
      { nombre: 'UNIDAD', abreviatura: 'UND', activo: true },
      { nombre: 'CAJA', abreviatura: 'CJA', activo: true }
    ], { ignoreDuplicates: true });

    // Almacenes
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
        nombre: 'ALMACÉN SUCURSAL',
        direccion: 'Jr. Comercio 250, Lima',
        responsable: 'Ana Torres',
        activo: true
      }
    ], { ignoreDuplicates: true });

    // Tipos de movimiento KARDEX
    await TipoMovimientoKardex.bulkCreate([
      {
        codigo: 'ENTRADA_COMPRA',
        nombre: 'Entrada por Compra',
        descripcion: 'Ingreso de productos por compra a proveedores',
        tipo_operacion: 'ENTRADA',
        afecta_stock: true,
        requiere_documento: true,
        requiere_autorizacion: false,
        activo: true
      },
      {
        codigo: 'SALIDA_VENTA',
        nombre: 'Salida por Venta',
        descripcion: 'Salida de productos por venta a clientes',
        tipo_operacion: 'SALIDA',
        afecta_stock: true,
        requiere_documento: true,
        requiere_autorizacion: false,
        activo: true
      },
      {
        codigo: 'AJUSTE_POSITIVO',
        nombre: 'Ajuste Positivo',
        descripcion: 'Ajuste manual de inventario (incremento)',
        tipo_operacion: 'ENTRADA',
        afecta_stock: true,
        requiere_documento: true,
        requiere_autorizacion: true,
        activo: true
      },
      {
        codigo: 'AJUSTE_NEGATIVO',
        nombre: 'Ajuste Negativo',
        descripcion: 'Ajuste manual de inventario (decremento)',
        tipo_operacion: 'SALIDA',
        afecta_stock: true,
        requiere_documento: true,
        requiere_autorizacion: true,
        activo: true
      }
    ], { ignoreDuplicates: true });

    console.log('✅ Datos iniciales insertados exitosamente');
  } catch (error) {
    console.error('⚠️ Error insertando datos iniciales:', error);
    // No lanzamos error para no romper el inicio del servidor
  }
};

