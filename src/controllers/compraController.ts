import { Request, Response } from 'express';
import { Compra, DetalleCompra, Producto, Proveedor, Usuario, MovimientoKardex } from '../models';
import { Op, Transaction } from 'sequelize';
import sequelize from '../config/database';

export const getCompras = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10, search = '', fecha_inicio, fecha_fin, proveedor_id } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const whereClause: any = {};

    if (search) {
      whereClause[Op.or] = [
        { numero_factura: { [Op.like]: `%${search}%` } },
        { numero_control: { [Op.like]: `%${search}%` } }
      ];
    }

    if (fecha_inicio && fecha_fin) {
      whereClause.fecha_compra = {
        [Op.between]: [fecha_inicio, fecha_fin]
      };
    }

    if (proveedor_id) {
      whereClause.proveedor_id = proveedor_id;
    }

    const { count, rows: compras } = await Compra.findAndCountAll({
      where: whereClause,
      include: [
        { model: Proveedor, as: 'proveedor' },
        { model: Usuario, as: 'usuario' },
        { 
          model: DetalleCompra, 
          as: 'detalles',
          include: [{ model: Producto, as: 'producto' }]
        }
      ],
      limit: Number(limit),
      offset,
      order: [['fecha_compra', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        compras,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error al obtener compras:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

export const getCompraById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const compra = await Compra.findByPk(id, {
      include: [
        { model: Proveedor, as: 'proveedor' },
        { model: Usuario, as: 'usuario' },
        { 
          model: DetalleCompra, 
          as: 'detalles',
          include: [{ model: Producto, as: 'producto' }]
        }
      ]
    });

    if (!compra) {
      res.status(404).json({
        success: false,
        message: 'Compra no encontrada'
      });
      return;
    }

    res.json({
      success: true,
      data: compra
    });
  } catch (error) {
    console.error('Error al obtener compra:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

export const createCompra = async (req: Request, res: Response): Promise<void> => {
  const transaction: Transaction = await sequelize.transaction();

  try {
    const {
      proveedor_id,
      numero_factura,
      fecha_compra,
      fecha_vencimiento,
      subtotal,
      descuento,
      impuestos,
      total,
      estado,
      observaciones,
      detalles
    } = req.body;

    const usuario_id = (req as any).user?.id;

    // Generar número de factura si no se proporciona
    const numeroFactura = numero_factura || `COMP-${Date.now()}`;

    // Crear la compra
    const compra = await Compra.create({
      proveedor_id,
      numero_factura: numeroFactura,
      fecha_compra: fecha_compra || new Date(),
      fecha_vencimiento,
      subtotal: subtotal || 0,
      descuento: descuento || 0,
      impuestos: impuestos || 0,
      total: total || 0,
      estado: estado || 'PENDIENTE',
      observaciones,
      usuario_id
    }, { transaction });

    // Crear los detalles de la compra
    const detallesCompra = [];
    for (const detalle of detalles) {
      const producto = await Producto.findByPk(detalle.producto_id, { transaction });
      
      if (!producto) {
        throw new Error(`Producto con ID ${detalle.producto_id} no encontrado`);
      }

      const detalleCompra = await DetalleCompra.create({
        compra_id: compra.id,
        producto_id: detalle.producto_id,
        cantidad: detalle.cantidad,
        precio_unitario: detalle.precio_unitario,
        descuento: detalle.descuento || 0,
        subtotal: detalle.cantidad * detalle.precio_unitario - (detalle.descuento || 0)
      }, { transaction });

      detallesCompra.push(detalleCompra);

      // Actualizar stock del producto
      const nuevoStock = producto.stock_actual + detalle.cantidad;
      
      // Calcular nuevo costo promedio
      const costoTotalAnterior = producto.stock_actual * producto.costo_promedio;
      const costoTotalNuevo = detalle.cantidad * detalle.precio_unitario;
      const nuevoCostoPromedio = (costoTotalAnterior + costoTotalNuevo) / nuevoStock;

      await producto.update({ 
        stock_actual: nuevoStock,
        costo_promedio: nuevoCostoPromedio,
        precio_compra: detalle.precio_unitario
      }, { transaction });

      // Crear movimiento en KARDEX
      // tipo_movimiento_id es opcional y referencia a tipos_movimiento_kardex, no a la compra
      // No lo incluimos porque es opcional y TypeScript no acepta null
      await MovimientoKardex.create({
        producto_id: producto.id,
        almacen_id: 1, // Almacén principal por defecto
        tipo_movimiento: 'ENTRADA_COMPRA',
        cantidad: detalle.cantidad,
        precio_unitario: detalle.precio_unitario,
        costo_total: detalle.cantidad * detalle.precio_unitario,
        stock_anterior: producto.stock_actual,
        stock_nuevo: nuevoStock,
        documento_referencia: 'COMPRA',
        numero_documento: numeroFactura,
        fecha_movimiento: compra.fecha_compra,
        usuario_id,
        observaciones: `Compra ${numeroFactura}`,
        estado_movimiento: 'APROBADO'
      }, { transaction });
    }

    await transaction.commit();

    res.status(201).json({
      success: true,
      data: {
        compra,
        detalles: detallesCompra
      },
      message: 'Compra creada exitosamente'
    });
  } catch (error: any) {
    await transaction.rollback();
    console.error('Error al crear compra:', error);
    res.status(500).json({
      success: false,
      message: error?.message || 'Error interno del servidor'
    });
  }
};

export const updateCompra = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const compra = await Compra.findByPk(id);

    if (!compra) {
      res.status(404).json({
        success: false,
        message: 'Compra no encontrada'
      });
      return;
    }

    // Solo permitir actualizar ciertos campos
    const allowedFields = ['estado', 'observaciones', 'fecha_vencimiento'];
    const filteredData: any = Object.keys(updateData)
      .filter(key => allowedFields.includes(key))
      .reduce((obj: any, key) => {
        obj[key] = updateData[key];
        return obj;
      }, {});

    await compra.update(filteredData);

    res.json({
      success: true,
      data: compra,
      message: 'Compra actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar compra:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

export const deleteCompra = async (req: Request, res: Response): Promise<void> => {
  const transaction: Transaction = await sequelize.transaction();

  try {
    const { id } = req.params;

    const compra = await Compra.findByPk(id, {
      include: [{ model: DetalleCompra, as: 'detalles' }]
    });

    if (!compra) {
      res.status(404).json({
        success: false,
        message: 'Compra no encontrada'
      });
      return;
    }

    // Revertir movimientos de stock
    if (compra.detalles) {
      for (const detalle of compra.detalles) {
      const producto = await Producto.findByPk(detalle.producto_id, { transaction });
      
      if (producto) {
        const nuevoStock = producto.stock_actual - detalle.cantidad;
        
        if (nuevoStock < 0) {
          throw new Error(`No se puede revertir la compra. Stock insuficiente para el producto ${producto.nombre}`);
        }

        await producto.update({ stock_actual: nuevoStock }, { transaction });

        // Crear movimiento de reversión en KARDEX
        // tipo_movimiento_id es opcional y referencia a tipos_movimiento_kardex, no a la compra
        await MovimientoKardex.create({
          producto_id: producto.id,
          almacen_id: 1,
          tipo_movimiento: 'SALIDA_DEVOLUCION_PROVEEDOR',
          cantidad: detalle.cantidad,
          precio_unitario: detalle.precio_unitario,
          costo_total: detalle.cantidad * producto.costo_promedio,
          stock_anterior: producto.stock_actual,
          stock_nuevo: nuevoStock,
          documento_referencia: 'ANULACION_COMPRA',
          numero_documento: compra.numero_factura,
          fecha_movimiento: new Date(),
          usuario_id: (req as any).user?.id,
          observaciones: `Anulación de compra ${compra.numero_factura}`,
          estado_movimiento: 'APROBADO'
        }, { transaction });
      }
      }
    }

    // Eliminar detalles
    await DetalleCompra.destroy({
      where: { compra_id: id },
      transaction
    });

    // Eliminar compra
    await compra.destroy({ transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Compra eliminada exitosamente'
    });
  } catch (error: any) {
    await transaction.rollback();
    console.error('Error al eliminar compra:', error);
    res.status(500).json({
      success: false,
      message: error?.message || 'Error interno del servidor'
    });
  }
};

export const getEstadisticasCompras = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;

    const whereClause: any = {};
    if (fecha_inicio && fecha_fin) {
      whereClause.fecha_compra = {
        [Op.between]: [fecha_inicio, fecha_fin]
      };
    }

    const compras = await Compra.findAll({
      where: whereClause,
      attributes: [
        'fecha_compra',
        'total',
        'subtotal',
        'descuento_monto',
        'impuesto_monto'
      ]
    });

    const estadisticas = {
      total_compras: compras.length,
      total_monto: compras.reduce((sum, c) => sum + Number(c.total), 0),
      total_subtotal: compras.reduce((sum, c) => sum + Number(c.subtotal), 0),
      total_descuentos: compras.reduce((sum, c) => sum + Number(c.descuento), 0),
      total_impuestos: compras.reduce((sum, c) => sum + Number(c.impuestos), 0),
      promedio_compra: compras.length > 0 ? compras.reduce((sum, c) => sum + Number(c.total), 0) / compras.length : 0
    };

    res.json({
      success: true,
      data: estadisticas
    });
  } catch (error) {
    console.error('Error al obtener estadísticas de compras:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};