import { Request, Response } from 'express';
import { Pedido, DetallePedido, Cliente, ClienteUsuario, Producto, Venta, DetalleVenta, Usuario } from '../models';
import sequelize from '../config/database';
import { Op } from 'sequelize';
import notificacionService from '../services/notificacionService';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Generar número de pedido único
 */
const generarNumeroPedido = async (): Promise<string> => {
  const fecha = new Date();
  const año = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  
  const ultimoPedido = await Pedido.findOne({
    where: {
      numero_pedido: {
        [Op.like]: `PED-${año}${mes}%`
      }
    } as any,
    order: [['id', 'DESC']]
  });

  let correlativo = 1;
  if (ultimoPedido) {
    const partes = ultimoPedido.numero_pedido.split('-');
    correlativo = parseInt(partes[2]) + 1;
  }

  return `PED-${año}${mes}-${String(correlativo).padStart(6, '0')}`;
};

/**
 * Crear un nuevo pedido (Cliente)
 */
export const crearPedido = async (req: Request, res: Response): Promise<void> => {
  const transaction = await sequelize.transaction();
  
  try {
    const usuarioId = (req as any).user?.id;
    const { tipo_pedido, detalles, observaciones } = req.body;

    if (!usuarioId) {
      await transaction.rollback();
      res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
      return;
    }

    // Validaciones
    if (!detalles || !Array.isArray(detalles) || detalles.length === 0) {
      await transaction.rollback();
      res.status(400).json({
        success: false,
        message: 'Debe incluir al menos un producto'
      });
      return;
    }

    if (!['PEDIDO_APROBACION', 'COMPRA_DIRECTA'].includes(tipo_pedido)) {
      await transaction.rollback();
      res.status(400).json({
        success: false,
        message: 'Tipo de pedido inválido'
      });
      return;
    }

    // Buscar la relación cliente-usuario
    const clienteUsuario = await ClienteUsuario.findOne({
      where: { usuario_id: usuarioId },
      transaction
    });

    if (!clienteUsuario) {
      await transaction.rollback();
      res.status(404).json({
        success: false,
        message: 'No se encontró información de cliente asociada'
      });
      return;
    }

    // Calcular totales y validar stock
    let subtotal = 0;
    const detallesValidados = [];

    for (const item of detalles) {
      const producto = await Producto.findByPk(item.producto_id, { transaction });
      
      if (!producto) {
        await transaction.rollback();
        res.status(404).json({
          success: false,
          message: `Producto con ID ${item.producto_id} no encontrado`
        });
        return;
      }

      if (!producto.activo) {
        await transaction.rollback();
        res.status(400).json({
          success: false,
          message: `Producto ${producto.nombre} no está disponible`
        });
        return;
      }

      if (producto.stock_actual < item.cantidad) {
        await transaction.rollback();
        res.status(400).json({
          success: false,
          message: `Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stock_actual}`
        });
        return;
      }

      const precioUnitario = producto.precio_venta;
      const descuento = item.descuento || 0;
      const subtotalProducto = (precioUnitario * item.cantidad) - descuento;
      
      subtotal += subtotalProducto;

      detallesValidados.push({
        producto_id: producto.id,
        cantidad: item.cantidad,
        precio_unitario: precioUnitario,
        descuento,
        subtotal: subtotalProducto
      });
    }

    const impuesto = subtotal * 0.18; // IGV 18%
    const total = subtotal + impuesto;

    // Crear pedido
    const numeroPedido = await generarNumeroPedido();
    const estadoInicial = tipo_pedido === 'COMPRA_DIRECTA' ? 'APROBADO' : 'PENDIENTE';

    const pedido = await Pedido.create({
      cliente_id: clienteUsuario.cliente_id,
      usuario_id: usuarioId,
      numero_pedido: numeroPedido,
      tipo_pedido,
      estado: estadoInicial,
      subtotal,
      descuento: 0,
      impuesto,
      total,
      observaciones,
      fecha_pedido: new Date()
    }, { transaction });

    // Crear detalles del pedido
    for (const item of detallesValidados) {
      await DetallePedido.create({
        pedido_id: pedido.id,
        ...item
      }, { transaction });
    }

    // Si es compra directa, procesar inmediatamente
    if (tipo_pedido === 'COMPRA_DIRECTA') {
      // TODO: Convertir en venta automáticamente
      // Por ahora solo marcar como aprobado
      await pedido.update({
        aprobado_por: usuarioId,
        fecha_aprobacion: new Date()
      }, { transaction });
    } else {
      // Notificar a administradores sobre nuevo pedido pendiente
      await notificacionService.notificarAdministradores(
        'SISTEMA',
        '🛒 Nuevo pedido pendiente',
        `Pedido ${numeroPedido} requiere aprobación por un total de S/. ${total.toFixed(2)}`,
        pedido.id,
        'pedido'
      );
    }

    await transaction.commit();

    // Cargar el pedido completo con relaciones
    const pedidoCompleto = await Pedido.findByPk(pedido.id, {
      include: [
        {
          model: DetallePedido,
          as: 'detalles',
          include: [
            {
              model: Producto,
              as: 'producto'
            }
          ]
        },
        {
          model: Cliente,
          as: 'cliente'
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: `Pedido ${tipo_pedido === 'COMPRA_DIRECTA' ? 'procesado' : 'creado'} correctamente`,
      data: pedidoCompleto
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error al crear pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear pedido',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Obtener pedidos pendientes (Vendedor/Admin)
 */
export const getPedidosPendientes = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '10' } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    const { count, rows: pedidos } = await Pedido.findAndCountAll({
      where: {
        estado: 'PENDIENTE'
      },
      include: [
        {
          model: Cliente,
          as: 'cliente',
          attributes: ['id', 'nombre', 'numero_documento']
        },
        {
          model: Usuario,
          as: 'usuario',
          attributes: ['id', 'nombre_completo']
        },
        {
          model: DetallePedido,
          as: 'detalles',
          include: [
            {
              model: Producto,
              as: 'producto',
              attributes: ['id', 'nombre', 'codigo']
            } as any
          ]
        }
      ],
      order: [['fecha_pedido', 'DESC']],
      limit: parseInt(limit as string),
      offset
    });

    res.json({
      success: true,
      data: pedidos,
      pagination: {
        total: count,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        pages: Math.ceil(count / parseInt(limit as string))
      }
    });
  } catch (error) {
    console.error('Error al obtener pedidos pendientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener pedidos pendientes',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Obtener mis pedidos (Cliente)
 */
export const getMisPedidos = async (req: Request, res: Response): Promise<void> => {
  try {
    const usuarioId = (req as any).user?.id;

    if (!usuarioId) {
      res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
      return;
    }

    const pedidos = await Pedido.findAll({
      where: {
        usuario_id: usuarioId
      },
      include: [
        {
          model: DetallePedido,
          as: 'detalles',
          include: [
            {
              model: Producto,
              as: 'producto',
              attributes: ['id', 'nombre', 'codigo', 'imagen_url']
            } as any
          ]
        }
      ],
      order: [['fecha_pedido', 'DESC']]
    });

    res.json({
      success: true,
      data: pedidos
    });
  } catch (error) {
    console.error('Error al obtener mis pedidos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener pedidos',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Aprobar pedido y convertir en venta (Vendedor/Admin)
 */
export const aprobarPedido = async (req: Request, res: Response): Promise<void> => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const usuarioAprobadorId = (req as any).user?.id;
    const { metodo_pago = 'EFECTIVO' } = req.body;

    if (!usuarioAprobadorId) {
      await transaction.rollback();
      res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
      return;
    }

    const pedido = await Pedido.findByPk(id, {
      include: [
        {
          model: DetallePedido,
          as: 'detalles'
        }
      ],
      transaction
    });

    if (!pedido) {
      await transaction.rollback();
      res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
      return;
    }

    if (pedido.estado !== 'PENDIENTE') {
      await transaction.rollback();
      res.status(400).json({
        success: false,
        message: `El pedido ya está ${pedido.estado.toLowerCase()}`
      });
      return;
    }

    // Generar número de factura para la venta
    const fecha = new Date();
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    
    const ultimaVenta = await Venta.findOne({
      where: {
        numero_factura: {
          [Op.like]: `F001-${año}${mes}%`
        }
      } as any,
      order: [['id', 'DESC']],
      transaction
    });

    let correlativo = 1;
    if (ultimaVenta && ultimaVenta.numero_factura) {
      const partes = ultimaVenta.numero_factura.split('-');
      correlativo = parseInt(partes[2]) + 1;
    }

    const numeroFactura = `F001-${año}${mes}${String(correlativo).padStart(6, '0')}`;

    // Crear venta a partir del pedido
    const venta = await Venta.create({
      cliente_id: pedido.cliente_id,
      usuario_id: usuarioAprobadorId,
      numero_factura: numeroFactura,
      fecha_venta: new Date(),
      subtotal: pedido.subtotal,
      descuento: pedido.descuento,
      impuestos: pedido.impuesto,
      total: pedido.total,
      estado: 'PROCESADA',
      observaciones: `Generado desde pedido ${pedido.numero_pedido}`
    }, { transaction });

    // Copiar detalles del pedido a detalles de venta y actualizar stock
    if (!pedido.detalles || pedido.detalles.length === 0) {
      throw new Error('El pedido no tiene detalles');
    }

    for (const detalle of pedido.detalles) {
      await DetalleVenta.create({
        venta_id: venta.id,
        producto_id: detalle.producto_id,
        cantidad: detalle.cantidad,
        precio_unitario: detalle.precio_unitario,
        descuento: detalle.descuento,
        subtotal: detalle.subtotal
      }, { transaction });

      // Actualizar stock del producto
      const producto = await Producto.findByPk(detalle.producto_id, { transaction });
      if (producto) {
        const nuevoStock = producto.stock_actual - detalle.cantidad;
        await producto.update({ stock_actual: nuevoStock }, { transaction });

        // Verificar stock bajo
        if (nuevoStock <= producto.stock_minimo) {
          setTimeout(() => {
            notificacionService.notificarStockBajo(
              producto.id,
              producto.nombre,
              nuevoStock,
              usuarioAprobadorId
            );
          }, 100);
        }
      }
    }

    // Actualizar estado del pedido
    await pedido.update({
      estado: 'PROCESADO',
      aprobado_por: usuarioAprobadorId,
      fecha_aprobacion: new Date(),
      venta_id: venta.id
    }, { transaction });

    // Notificar al cliente
    await notificacionService.notificarVenta(
      venta.id,
      numeroFactura,
      venta.total,
      pedido.usuario_id
    );

    await transaction.commit();

    res.json({
      success: true,
      message: 'Pedido aprobado y venta generada correctamente',
      data: {
        pedido,
        venta
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error al aprobar pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error al aprobar pedido',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Rechazar pedido (Vendedor/Admin)
 */
export const rechazarPedido = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { motivo_rechazo } = req.body;
    const usuarioId = (req as any).user?.id;

    if (!motivo_rechazo) {
      res.status(400).json({
        success: false,
        message: 'Debe proporcionar un motivo de rechazo'
      });
      return;
    }

    const pedido = await Pedido.findByPk(id);

    if (!pedido) {
      res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
      return;
    }

    if (pedido.estado !== 'PENDIENTE') {
      res.status(400).json({
        success: false,
        message: `El pedido ya está ${pedido.estado.toLowerCase()}`
      });
      return;
    }

    await pedido.update({
      estado: 'RECHAZADO',
      motivo_rechazo,
      aprobado_por: usuarioId,
      fecha_aprobacion: new Date()
    });

    // Notificar al cliente
    await notificacionService.crearNotificacion({
      usuario_id: pedido.usuario_id,
      tipo: 'SISTEMA',
      titulo: '❌ Pedido rechazado',
      mensaje: `Tu pedido ${pedido.numero_pedido} ha sido rechazado. Motivo: ${motivo_rechazo}`,
      referencia_id: pedido.id,
      referencia_tipo: 'pedido'
    });

    res.json({
      success: true,
      message: 'Pedido rechazado correctamente',
      data: pedido
    });
  } catch (error) {
    console.error('Error al rechazar pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error al rechazar pedido',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Obtener detalle de un pedido
 */
export const getDetallePedido = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const usuarioId = (req as any).user?.id;
    const userRole = (req as any).user?.rol;

    const pedido = await Pedido.findByPk(id, {
      include: [
        {
          model: Cliente,
          as: 'cliente'
        },
        {
          model: Usuario,
          as: 'usuario',
          attributes: ['id', 'nombre_completo', 'email']
        },
        {
          model: Usuario,
          as: 'aprobador',
          attributes: ['id', 'nombre_completo']
        },
        {
          model: DetallePedido,
          as: 'detalles',
          include: [
            {
              model: Producto,
              as: 'producto'
            } as any
          ]
        },
        {
          model: Venta,
          as: 'venta'
        }
      ]
    });

    if (!pedido) {
      res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
      return;
    }

    // Si es cliente, solo puede ver sus propios pedidos
    if (userRole === 'CLIENTE' && pedido.usuario_id !== usuarioId) {
      res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver este pedido'
      });
      return;
    }

    res.json({
      success: true,
      data: pedido
    });
  } catch (error) {
    console.error('Error al obtener detalle del pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener detalle del pedido',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Crear pedido desde WhatsApp (sin autenticación de usuario)
 * Requiere token especial del chatbot
 */
export const crearPedidoWhatsApp = async (req: Request, res: Response): Promise<void> => {
  const transaction = await sequelize.transaction();
  
  try {
    // Verificar token especial para chatbot
    const chatToken = req.headers['x-chatbot-token'] || req.body.token;
    const expectedToken = process.env.CHATBOT_API_TOKEN;

    if (expectedToken && chatToken !== expectedToken) {
      await transaction.rollback();
      res.status(401).json({
        success: false,
        message: 'Token inválido para chatbot'
      });
      return;
    }

    const { cliente_id, tipo_pedido, detalles, observaciones, telefono } = req.body;

    // Validaciones
    if (!cliente_id) {
      await transaction.rollback();
      res.status(400).json({
        success: false,
        message: 'cliente_id es requerido'
      });
      return;
    }

    if (!detalles || !Array.isArray(detalles) || detalles.length === 0) {
      await transaction.rollback();
      res.status(400).json({
        success: false,
        message: 'Debe incluir al menos un producto'
      });
      return;
    }

    if (!['PEDIDO_APROBACION', 'COMPRA_DIRECTA'].includes(tipo_pedido)) {
      await transaction.rollback();
      res.status(400).json({
        success: false,
        message: 'Tipo de pedido inválido'
      });
      return;
    }

    // Verificar que el cliente existe
    const cliente = await Cliente.findByPk(cliente_id, { transaction });
    if (!cliente) {
      await transaction.rollback();
      res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
      return;
    }

    // Calcular totales y validar stock
    let subtotal = 0;
    const detallesValidados = [];

    for (const item of detalles) {
      const producto = await Producto.findByPk(item.producto_id, { transaction });
      
      if (!producto) {
        await transaction.rollback();
        res.status(404).json({
          success: false,
          message: `Producto con ID ${item.producto_id} no encontrado`
        });
        return;
      }

      if (!producto.activo) {
        await transaction.rollback();
        res.status(400).json({
          success: false,
          message: `Producto ${producto.nombre} no está disponible`
        });
        return;
      }

      if (producto.stock_actual < item.cantidad) {
        await transaction.rollback();
        res.status(400).json({
          success: false,
          message: `Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stock_actual}`
        });
        return;
      }

      const precioUnitario = producto.precio_venta;
      const descuento = item.descuento || 0;
      const subtotalProducto = (precioUnitario * item.cantidad) - descuento;
      
      subtotal += subtotalProducto;

      detallesValidados.push({
        producto_id: producto.id,
        cantidad: item.cantidad,
        precio_unitario: precioUnitario,
        descuento,
        subtotal: subtotalProducto
      });
    }

    const impuesto = subtotal * 0.18; // IGV 18%
    const total = subtotal + impuesto;

    // Crear pedido (sin usuario_id ya que viene de WhatsApp)
    const numeroPedido = await generarNumeroPedido();
    const estadoInicial = tipo_pedido === 'COMPRA_DIRECTA' ? 'APROBADO' : 'PENDIENTE';

    const pedido = await Pedido.create({
      cliente_id: cliente_id,
      usuario_id: null, // No hay usuario para pedidos de WhatsApp
      numero_pedido: numeroPedido,
      tipo_pedido,
      estado: estadoInicial,
      subtotal,
      descuento: 0,
      impuesto,
      total,
      observaciones: observaciones || `Pedido desde WhatsApp - ${telefono || 'N/A'}`,
      fecha_pedido: new Date()
    }, { transaction });

    // Crear detalles del pedido
    for (const item of detallesValidados) {
      await DetallePedido.create({
        pedido_id: pedido.id,
        ...item
      }, { transaction });
    }

    // Si es compra directa, procesar inmediatamente
    if (tipo_pedido === 'COMPRA_DIRECTA') {
      // Buscar un usuario administrador para asignar como aprobador
      const admin = await Usuario.findOne({
        where: { rol: 'ADMINISTRADOR', activo: true },
        transaction
      });
      
      if (admin) {
        await pedido.update({
          aprobado_por: admin.id,
          fecha_aprobacion: new Date()
        }, { transaction });
      }
    } else {
      // Notificar a administradores sobre nuevo pedido pendiente
      await notificacionService.notificarAdministradores(
        'SISTEMA',
        '🛒 Nuevo pedido desde WhatsApp',
        `Pedido ${numeroPedido} requiere aprobación por un total de S/. ${total.toFixed(2)}`,
        pedido.id,
        'pedido'
      );
    }

    await transaction.commit();

    // Cargar el pedido completo con relaciones
    const pedidoCompleto = await Pedido.findByPk(pedido.id, {
      include: [
        {
          model: DetallePedido,
          as: 'detalles',
          include: [
            {
              model: Producto,
              as: 'producto'
            }
          ]
        },
        {
          model: Cliente,
          as: 'cliente'
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: `Pedido ${tipo_pedido === 'COMPRA_DIRECTA' ? 'procesado' : 'creado'} correctamente`,
      data: pedidoCompleto
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error al crear pedido desde WhatsApp:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear pedido',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

