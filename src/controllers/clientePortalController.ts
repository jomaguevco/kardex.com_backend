import { Request, Response } from 'express';
import { Venta, DetalleVenta, Producto, Cliente, ClienteUsuario } from '../models';
import { Op } from 'sequelize';
import sequelize from '../config/database';

/**
 * Obtener historial de compras del cliente
 */
export const getMisCompras = async (req: Request, res: Response): Promise<void> => {
  try {
    const usuarioId = (req as any).user?.id;

    if (!usuarioId) {
      res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
      return;
    }

    // Buscar la relación cliente-usuario
    const clienteUsuario = await ClienteUsuario.findOne({
      where: { usuario_id: usuarioId }
    });

    if (!clienteUsuario) {
      res.status(404).json({
        success: false,
        message: 'No se encontró información de cliente asociada'
      });
      return;
    }

    const { page = '1', limit = '10', fecha_desde, fecha_hasta } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    // Filtros de fecha
    const whereClause: any = {
      cliente_id: clienteUsuario.cliente_id,
      estado: 'PROCESADA'
    };

    if (fecha_desde || fecha_hasta) {
      whereClause.fecha_venta = {};
      if (fecha_desde) {
        whereClause.fecha_venta[Op.gte] = new Date(fecha_desde as string);
      }
      if (fecha_hasta) {
        whereClause.fecha_venta[Op.lte] = new Date(fecha_hasta as string);
      }
    }

    const { count, rows: ventas } = await Venta.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: DetalleVenta,
          as: 'detalles',
          include: [
            {
              model: Producto,
              as: 'producto',
              attributes: ['id', 'nombre', 'codigo_interno']
            }
          ]
        }
      ],
      order: [['fecha_venta', 'DESC']],
      limit: parseInt(limit as string),
      offset
    });

    res.json({
      success: true,
      data: ventas,
      pagination: {
        total: count,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        pages: Math.ceil(count / parseInt(limit as string))
      }
    });
  } catch (error) {
    console.error('Error al obtener mis compras:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener historial de compras',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Obtener catálogo de productos disponibles
 */
export const getCatalogo = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '20', search, categoria_id } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    const whereClause: any = {
      activo: true,
      stock_actual: {
        [Op.gt]: 0  // Solo productos con stock
      }
    };

    if (search) {
      whereClause[Op.or] = [
        { nombre: { [Op.like]: `%${search}%` } },
        { codigo_interno: { [Op.like]: `%${search}%` } },
        { descripcion: { [Op.like]: `%${search}%` } }
      ];
    }

    if (categoria_id) {
      whereClause.categoria_id = categoria_id;
    }

    const { count, rows: productos } = await Producto.findAndCountAll({
      where: whereClause as any,
      attributes: [
        'id',
        'codigo_interno',
        'nombre',
        'descripcion',
        'precio_venta',
        'stock_actual',
        'stock_minimo',
        'imagen_url',
        'categoria_id',
        'marca_id'
      ],
      order: [['nombre', 'ASC']],
      limit: parseInt(limit as string),
      offset
    });

    res.json({
      success: true,
      data: productos,
      pagination: {
        total: count,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        pages: Math.ceil(count / parseInt(limit as string))
      }
    });
  } catch (error) {
    console.error('Error al obtener catálogo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener catálogo de productos',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Obtener facturas del cliente
 */
export const getMisFacturas = async (req: Request, res: Response): Promise<void> => {
  try {
    const usuarioId = (req as any).user?.id;

    if (!usuarioId) {
      res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
      return;
    }

    // Buscar la relación cliente-usuario
    const clienteUsuario = await ClienteUsuario.findOne({
      where: { usuario_id: usuarioId }
    });

    if (!clienteUsuario) {
      res.status(404).json({
        success: false,
        message: 'No se encontró información de cliente asociada'
      });
      return;
    }

    const ventas = await Venta.findAll({
      where: {
        cliente_id: clienteUsuario.cliente_id,
        estado: 'PROCESADA',
        numero_factura: {
          [Op.ne]: null
        }
      } as any,
      attributes: [
        'id',
        'numero_factura',
        'fecha_venta',
        'subtotal',
        'descuento',
        'impuestos',
        'total'
      ],
      order: [['fecha_venta', 'DESC']]
    });

    res.json({
      success: true,
      data: ventas
    });
  } catch (error) {
    console.error('Error al obtener facturas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener facturas',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Obtener estado de cuenta del cliente
 */
export const getEstadoCuenta = async (req: Request, res: Response): Promise<void> => {
  try {
    const usuarioId = (req as any).user?.id;

    if (!usuarioId) {
      res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
      return;
    }

    // Buscar la relación cliente-usuario
    const clienteUsuario = await ClienteUsuario.findOne({
      where: { usuario_id: usuarioId },
      include: [
        {
          model: Cliente,
          as: 'cliente',
          attributes: ['id', 'nombre', 'numero_documento']
        }
      ]
    });

    if (!clienteUsuario) {
      res.status(404).json({
        success: false,
        message: 'No se encontró información de cliente asociada'
      });
      return;
    }

    // Estadísticas generales
    const totalCompras = await Venta.count({
      where: {
        cliente_id: clienteUsuario.cliente_id,
        estado: 'PROCESADA'
      } as any
    });

    const totalGastado = await Venta.sum('total', {
      where: {
        cliente_id: clienteUsuario.cliente_id,
        estado: 'PROCESADA'
      } as any
    }) || 0;

    // Compras por mes (últimos 6 meses)
    const seisMesesAtras = new Date();
    seisMesesAtras.setMonth(seisMesesAtras.getMonth() - 6);

    const comprasPorMes = await Venta.findAll({
      where: {
        cliente_id: clienteUsuario.cliente_id,
        estado: 'PROCESADA',
        fecha_venta: {
          [Op.gte]: seisMesesAtras
        }
      } as any,
      attributes: [
        [sequelize.fn('DATE_FORMAT', sequelize.col('fecha_venta'), '%Y-%m'), 'mes'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'cantidad'],
        [sequelize.fn('SUM', sequelize.col('total')), 'total']
      ],
      group: [sequelize.fn('DATE_FORMAT', sequelize.col('fecha_venta'), '%Y-%m')],
      order: [[sequelize.fn('DATE_FORMAT', sequelize.col('fecha_venta'), '%Y-%m'), 'ASC']],
      raw: true
    });

    // Productos más comprados
    const productosMasComprados = await DetalleVenta.findAll({
      include: [
        {
          model: Venta,
          as: 'venta',
          where: {
            cliente_id: clienteUsuario.cliente_id,
            estado: 'PROCESADA'
          } as any,
          attributes: []
        },
        {
          model: Producto,
          as: 'producto',
          attributes: ['id', 'nombre', 'codigo']
        }
      ],
      attributes: [
        'producto_id',
        [sequelize.fn('SUM', sequelize.col('cantidad')), 'total_cantidad'],
        [sequelize.fn('SUM', sequelize.col('subtotal')), 'total_gastado']
      ],
      group: ['producto_id'],
      order: [[sequelize.fn('SUM', sequelize.col('cantidad')), 'DESC']],
      limit: 10,
      raw: false
    });

    res.json({
      success: true,
      data: {
        cliente: clienteUsuario.cliente,
        resumen: {
          total_compras: totalCompras,
          total_gastado: Number(totalGastado).toFixed(2)
        },
        compras_por_mes: comprasPorMes,
        productos_mas_comprados: productosMasComprados
      }
    });
  } catch (error) {
    console.error('Error al obtener estado de cuenta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estado de cuenta',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Obtener detalle de una compra específica
 */
export const getDetalleCompra = async (req: Request, res: Response): Promise<void> => {
  try {
    const usuarioId = (req as any).user?.id;
    const { id } = req.params;

    if (!usuarioId) {
      res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
      return;
    }

    // Buscar la relación cliente-usuario
    const clienteUsuario = await ClienteUsuario.findOne({
      where: { usuario_id: usuarioId }
    });

    if (!clienteUsuario) {
      res.status(404).json({
        success: false,
        message: 'No se encontró información de cliente asociada'
      });
      return;
    }

    const venta = await Venta.findOne({
      where: {
        id,
        cliente_id: clienteUsuario.cliente_id
      } as any,
      include: [
        {
          model: DetalleVenta,
          as: 'detalles',
          include: [
            {
              model: Producto,
              as: 'producto'
            }
          ]
        }
      ]
    });

    if (!venta) {
      res.status(404).json({
        success: false,
        message: 'Compra no encontrada'
      });
      return;
    }

    res.json({
      success: true,
      data: venta
    });
  } catch (error) {
    console.error('Error al obtener detalle de compra:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener detalle de compra',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

