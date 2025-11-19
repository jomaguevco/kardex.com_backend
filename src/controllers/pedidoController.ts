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

    console.log('crearPedido - Creando pedido:', {
      cliente_id: clienteUsuario.cliente_id,
      usuario_id: usuarioId,
      numero_pedido: numeroPedido,
      tipo_pedido,
      estado: estadoInicial
    });

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

    console.log('crearPedido - Pedido creado con ID:', pedido.id);

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
    console.log('getPedidosPendientes - Iniciando consulta');
    const userRole = (req as any).user?.rol;
    const { page = '1', limit, estado } = req.query;
    
    // Si no se especifica límite, usar uno por defecto más alto para ADMINISTRADOR
    const defaultLimit = userRole === 'ADMINISTRADOR' ? '1000' : '100';
    const limitValue = limit ? limit as string : defaultLimit;
    
    const offset = (parseInt(page as string) - 1) * parseInt(limitValue);

    console.log('getPedidosPendientes - Parámetros:', { page, limit: limitValue, estado, offset, userRole });

    // Construir filtro de estado
    const whereClause: any = {};
    if (estado && estado !== 'TODOS' && estado !== 'ALL') {
      whereClause.estado = estado;
    }

    console.log('getPedidosPendientes - whereClause:', whereClause);

    // Primero obtener el conteo total sin includes para evitar problemas con distinct
    let totalCount = 0;
    try {
      totalCount = await Pedido.count({
        where: whereClause
      });
      console.log('getPedidosPendientes - Total count:', totalCount);
    } catch (countError: any) {
      console.error('getPedidosPendientes - Error al contar pedidos:', countError);
      console.error('Error message:', countError?.message);
      console.error('Error original:', countError?.original);
      // Continuar con count = 0 si hay error
      totalCount = 0;
    }

    // Luego obtener los pedidos con sus relaciones
    // Simplificar al máximo: primero obtener solo los pedidos básicos
    let pedidosRaw;
    try {
      console.log('getPedidosPendientes - Ejecutando query de pedidos básica (sin includes)');
      // Primero obtener SOLO los pedidos sin ningún include para evitar problemas
      // NO especificar attributes para obtener todos los campos disponibles
      pedidosRaw = await Pedido.findAll({
        where: whereClause,
        order: [['fecha_pedido', 'DESC']],
        limit: parseInt(limitValue),
        offset
        // No especificar attributes para evitar problemas si falta algún campo
      });
      console.log('getPedidosPendientes - Query básica exitosa, pedidos encontrados:', pedidosRaw.length);
    } catch (queryError: any) {
      console.error('getPedidosPendientes - Error en query básica:', queryError);
      console.error('Error message:', queryError?.message);
      console.error('Error name:', queryError?.name);
      console.error('Error original:', queryError?.original);
      if (queryError?.sql) {
        console.error('SQL:', queryError.sql);
      }
      // Si hay un error en la consulta básica, intentar devolver al menos un array vacío con error
      res.status(500).json({
        success: false,
        message: 'Error al obtener pedidos',
        error: queryError?.message || 'Error desconocido',
        data: [],
        pagination: {
          total: 0,
          page: parseInt(page as string),
          limit: parseInt(limitValue),
          pages: 0
        }
      });
      return;
    }

    // Ahora cargar todas las relaciones por separado
    console.log('getPedidosPendientes - Cargando relaciones para', pedidosRaw.length, 'pedidos');
    const pedidosConAprobador = await Promise.all(
      pedidosRaw.map(async (pedido) => {
        try {
          const pedidoJson = pedido.toJSON() as any;
          
          // Cargar cliente
          if (pedido.cliente_id) {
            try {
              const cliente = await Cliente.findByPk(pedido.cliente_id, {
                attributes: ['id', 'nombre', 'numero_documento', 'telefono', 'email']
              });
              pedidoJson.cliente = cliente ? cliente.toJSON() : null;
            } catch (error: any) {
              console.error(`Error al cargar cliente ${pedido.cliente_id}:`, error?.message);
              pedidoJson.cliente = null;
            }
          } else {
            pedidoJson.cliente = null;
          }
          
          // Cargar usuario
          if (pedido.usuario_id) {
            try {
              const usuario = await Usuario.findByPk(pedido.usuario_id, {
                attributes: ['id', 'nombre_completo', 'email']
              });
              pedidoJson.usuario = usuario ? usuario.toJSON() : null;
            } catch (error: any) {
              console.error(`Error al cargar usuario ${pedido.usuario_id}:`, error?.message);
              pedidoJson.usuario = null;
            }
          } else {
            pedidoJson.usuario = null;
          }
          
          // Cargar aprobador
          if (pedido.aprobado_por) {
            try {
              const aprobador = await Usuario.findByPk(pedido.aprobado_por, {
                attributes: ['id', 'nombre_completo']
              });
              pedidoJson.aprobador = aprobador ? aprobador.toJSON() : null;
            } catch (error: any) {
              console.error(`Error al cargar aprobador ${pedido.aprobado_por}:`, error?.message);
              pedidoJson.aprobador = null;
            }
          } else {
            pedidoJson.aprobador = null;
          }
          
          // Cargar detalles con productos
          try {
            const detalles = await DetallePedido.findAll({
              where: { pedido_id: pedido.id },
              attributes: ['id', 'pedido_id', 'producto_id', 'cantidad', 'precio_unitario', 'descuento', 'subtotal']
            });
            
            pedidoJson.detalles = await Promise.all(
              detalles.map(async (detalle) => {
                const detalleJson = detalle.toJSON() as any;
                if (detalle.producto_id) {
                  try {
                    const producto = await Producto.findByPk(detalle.producto_id, {
                      attributes: ['id', 'nombre', 'codigo_interno', 'precio_venta']
                    });
                    detalleJson.producto = producto ? producto.toJSON() : null;
                  } catch (error: any) {
                    console.error(`Error al cargar producto ${detalle.producto_id}:`, error?.message);
                    detalleJson.producto = null;
                  }
                } else {
                  detalleJson.producto = null;
                }
                return detalleJson;
              })
            );
          } catch (error: any) {
            console.error(`Error al cargar detalles para pedido ${pedido.id}:`, error?.message);
            pedidoJson.detalles = [];
          }
          
          return pedidoJson;
        } catch (error: any) {
          console.error(`Error al procesar pedido ${pedido.id}:`, error?.message);
          // Devolver al menos datos básicos
          return {
            ...pedido.toJSON(),
            cliente: null,
            usuario: null,
            aprobador: null,
            detalles: [],
            error: error?.message
          };
        }
      })
    );
    
    console.log('getPedidosPendientes - Pedidos serializados:', pedidosConAprobador.length);

    console.log('getPedidosPendientes - Respondiendo con', pedidosConAprobador.length, 'pedidos');

    // Asegurar que siempre devolvemos un array
    const dataFinal = Array.isArray(pedidosConAprobador) ? pedidosConAprobador : [];

    res.json({
      success: true,
      data: dataFinal,
      pagination: {
        total: totalCount,
        page: parseInt(page as string),
        limit: parseInt(limitValue),
        pages: Math.ceil(totalCount / parseInt(limitValue))
      }
    });
  } catch (error) {
    console.error('Error al obtener pedidos pendientes:', error);
    console.error('Error tipo:', typeof error);
    console.error('Error es instancia de Error:', error instanceof Error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    if ((error as any)?.name) {
      console.error('Error name:', (error as any).name);
    }
    if ((error as any)?.original) {
      console.error('Error original:', (error as any).original);
      console.error('Error original message:', (error as any).original?.message);
      console.error('Error original code:', (error as any).original?.code);
    }
    // Devolver respuesta incluso con error para que el frontend pueda manejarlo
    const userRoleError = (req as any).user?.rol;
    const defaultLimitError = userRoleError === 'ADMINISTRADOR' ? '1000' : '100';
    const limitValueError = req.query.limit ? req.query.limit as string : defaultLimitError;
    
    res.status(500).json({
      success: false,
      message: 'Error al obtener pedidos pendientes',
      error: error instanceof Error ? error.message : 'Error desconocido',
      data: [],
      pagination: {
        total: 0,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(limitValueError),
        pages: 0
      },
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
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

    // Obtener el cliente asociado a este usuario
    const clienteUsuario = await ClienteUsuario.findOne({ where: { usuario_id: usuarioId } });
    const clienteId = clienteUsuario?.cliente_id || null;

    console.log('getMisPedidos - usuarioId:', usuarioId, 'clienteId:', clienteId);

    const whereClause: any = {};
    // Mostrar pedidos del usuario y también los del mismo cliente (incluye pedidos creados por WhatsApp con usuario_id null)
    if (clienteId) {
      // Buscar por usuario_id O cliente_id (para incluir pedidos de WhatsApp con usuario_id null)
      whereClause[Op.or] = [
        { usuario_id: usuarioId },
        { cliente_id: clienteId }
      ];
    } else {
      // Si no hay cliente asociado, solo buscar por usuario_id
      whereClause.usuario_id = usuarioId;
    }

    console.log('getMisPedidos - whereClause:', JSON.stringify(whereClause, null, 2));
    
    // Verificar también directamente por cliente_id si existe
    if (clienteId) {
      const pedidosPorCliente = await Pedido.count({
        where: { cliente_id: clienteId }
      });
      console.log('getMisPedidos - Total pedidos por cliente_id:', pedidosPorCliente);
      
      const pedidosPorUsuario = await Pedido.count({
        where: { usuario_id: usuarioId }
      });
      console.log('getMisPedidos - Total pedidos por usuario_id:', pedidosPorUsuario);
    }

    // Primero verificar si hay pedidos sin filtros para debug
    const todosLosPedidos = await Pedido.findAll({
      limit: 5,
      order: [['fecha_pedido', 'DESC']],
      attributes: ['id', 'numero_pedido', 'cliente_id', 'usuario_id', 'estado', 'fecha_pedido']
    });
    console.log('getMisPedidos - Últimos 5 pedidos en BD:', todosLosPedidos.map(p => ({
      id: p.id,
      numero: p.numero_pedido,
      cliente_id: p.cliente_id,
      usuario_id: p.usuario_id,
      estado: p.estado
    })));

    const pedidos = await Pedido.findAll({
      where: whereClause,
      include: [
        {
          model: DetallePedido,
          as: 'detalles',
          include: [
            {
              model: Producto,
              as: 'producto',
              attributes: ['id', 'nombre', 'codigo_interno', 'imagen_url']
            } as any
          ]
        }
      ],
      order: [['fecha_pedido', 'DESC']]
    });

    console.log('getMisPedidos - pedidos encontrados:', pedidos.length);
    if (pedidos.length > 0) {
      console.log('getMisPedidos - Primer pedido:', {
        id: pedidos[0].id,
        numero: pedidos[0].numero_pedido,
        cliente_id: pedidos[0].cliente_id,
        usuario_id: pedidos[0].usuario_id,
        estado: pedidos[0].estado
      });
    }

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
  try {
    const { id } = req.params;
    const usuarioAprobadorId: number | undefined = (req as any).user?.id;

    console.log('aprobarPedido - Request:', { id, usuarioAprobadorId });

    if (!usuarioAprobadorId) {
      res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
      return;
    }

    // TypeScript ahora sabe que usuarioAprobadorId es number
    const usuarioId: number = usuarioAprobadorId;

    const pedido = await Pedido.findByPk(id, {
      include: [
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
          model: Cliente,
          as: 'cliente'
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

    console.log('aprobarPedido - Pedido encontrado:', {
      id: pedido.id,
      numero: pedido.numero_pedido,
      estado: pedido.estado,
      cliente_id: pedido.cliente_id,
      detalles_count: pedido.detalles?.length || 0
    });

    if (pedido.estado !== 'PENDIENTE') {
      res.status(400).json({
        success: false,
        message: `El pedido ya está ${pedido.estado.toLowerCase()}`
      });
      return;
    }

    // Solo cambiar estado a APROBADO (NO crear venta ni descontar stock)
    // La creación de venta y descuento de stock se hace en procesarEnvio
    await pedido.update({
      estado: 'APROBADO',
      aprobado_por: usuarioId,
      fecha_aprobacion: new Date()
    });

    // Recargar el pedido actualizado con todas las relaciones
    await pedido.reload({
      include: [
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
          model: Cliente,
          as: 'cliente'
        }
      ]
    });

    // Notificar al cliente que el pedido fue aprobado y puede proceder al pago
    if (pedido.usuario_id) {
      try {
        await notificacionService.crearNotificacion({
          usuario_id: pedido.usuario_id,
          tipo: 'SISTEMA',
          titulo: '✅ Pedido aprobado',
          mensaje: `Tu pedido ${pedido.numero_pedido} ha sido aprobado. Procede al pago para completar tu compra.`,
          referencia_id: pedido.id,
          referencia_tipo: 'pedido'
        });
      } catch (notifError) {
        console.error('Error al crear notificación (no crítico):', notifError);
        // No fallar la aprobación si falla la notificación
      }
    }

    console.log('aprobarPedido - Pedido aprobado exitosamente:', {
      pedido_id: pedido.id,
      numero_pedido: pedido.numero_pedido,
      nuevo_estado: 'APROBADO'
    });

    res.json({
      success: true,
      message: 'Pedido aprobado correctamente. El cliente puede proceder al pago.',
      data: pedido
    });
  } catch (error) {
    console.error('Error al aprobar pedido:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
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
    const usuarioId: number | undefined = (req as any).user?.id;

    console.log('rechazarPedido - Request:', { id, motivo_rechazo, usuarioId });

    if (!usuarioId) {
      res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
      return;
    }

    if (!motivo_rechazo || !motivo_rechazo.trim()) {
      res.status(400).json({
        success: false,
        message: 'Debe proporcionar un motivo de rechazo'
      });
      return;
    }

    const pedido = await Pedido.findByPk(id, {
      include: [
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
          model: Cliente,
          as: 'cliente'
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

    console.log('rechazarPedido - Pedido encontrado:', {
      id: pedido.id,
      numero: pedido.numero_pedido,
      estado: pedido.estado
    });

    if (pedido.estado !== 'PENDIENTE') {
      res.status(400).json({
        success: false,
        message: `El pedido ya está ${pedido.estado.toLowerCase()}`
      });
      return;
    }

    await pedido.update({
      estado: 'RECHAZADO',
      motivo_rechazo: motivo_rechazo.trim(),
      aprobado_por: usuarioId,
      fecha_aprobacion: new Date()
    });

    console.log('rechazarPedido - Pedido actualizado exitosamente');

    // Notificar al cliente (solo si tiene usuario_id)
    if (pedido.usuario_id) {
      await notificacionService.crearNotificacion({
        usuario_id: pedido.usuario_id,
        tipo: 'SISTEMA',
        titulo: '❌ Pedido rechazado',
        mensaje: `Tu pedido ${pedido.numero_pedido} ha sido rechazado. Motivo: ${motivo_rechazo}`,
        referencia_id: pedido.id,
        referencia_tipo: 'pedido'
      });
    }

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
 * Marcar pedido como pagado (Cliente)
 */
export const marcarComoPagado = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { metodo_pago, comprobante_pago } = req.body;
    const usuarioId: number | undefined = (req as any).user?.id;

    console.log('marcarComoPagado - Request:', { id, metodo_pago, usuarioId });

    if (!usuarioId) {
      res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
      return;
    }

    if (!metodo_pago) {
      res.status(400).json({
        success: false,
        message: 'Debe proporcionar un método de pago'
      });
      return;
    }

    // Validar método de pago
    const metodosValidos = ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'YAPE', 'PLIN'];
    if (!metodosValidos.includes(metodo_pago.toUpperCase())) {
      res.status(400).json({
        success: false,
        message: `Método de pago inválido. Métodos válidos: ${metodosValidos.join(', ')}`
      });
      return;
    }

    // Buscar el pedido
    const pedido = await Pedido.findByPk(id, {
      include: [
        {
          model: Cliente,
          as: 'cliente'
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

    // Verificar que el pedido pertenece al usuario autenticado
    // Puede ser por usuario_id (pedido directo del cliente) o por cliente_id (via ClienteUsuario)
    if (pedido.usuario_id && pedido.usuario_id !== usuarioId) {
      res.status(403).json({
        success: false,
        message: 'No tienes permisos para marcar este pedido como pagado'
      });
      return;
    }

    // Si no tiene usuario_id, verificar por cliente_id
    if (!pedido.usuario_id) {
      const clienteUsuario = await ClienteUsuario.findOne({
        where: { usuario_id: usuarioId }
      });

      if (!clienteUsuario || pedido.cliente_id !== clienteUsuario.cliente_id) {
        res.status(403).json({
          success: false,
          message: 'No tienes permisos para marcar este pedido como pagado'
        });
        return;
      }
    }

    // Verificar que el pedido está en estado APROBADO
    if (pedido.estado !== 'APROBADO') {
      res.status(400).json({
        success: false,
        message: `Solo se pueden marcar como pagados pedidos en estado APROBADO. Estado actual: ${pedido.estado}`
      });
      return;
    }

    // Actualizar pedido con información de pago
    await pedido.update({
      estado: 'PAGADO',
      metodo_pago: metodo_pago.toUpperCase(),
      fecha_pago: new Date(),
      comprobante_pago: comprobante_pago || null
    });

    console.log('marcarComoPagado - Pedido marcado como pagado exitosamente:', {
      pedido_id: pedido.id,
      numero_pedido: pedido.numero_pedido,
      metodo_pago: metodo_pago.toUpperCase()
    });

    // Notificar a administradores/vendedores que el pedido fue pagado
    await notificacionService.notificarAdministradores(
      'SISTEMA',
      '💰 Pedido pagado',
      `El pedido ${pedido.numero_pedido} ha sido pagado por ${pedido.cliente?.nombre || 'Cliente'} usando ${metodo_pago.toUpperCase()}`,
      pedido.id,
      'pedido'
    );

    // Notificar al cliente que el pago fue registrado
    if (pedido.usuario_id) {
      await notificacionService.crearNotificacion({
        usuario_id: pedido.usuario_id,
        tipo: 'SISTEMA',
        titulo: '✅ Pago registrado',
        mensaje: `Tu pago para el pedido ${pedido.numero_pedido} ha sido registrado. Esperando procesamiento del envío.`,
        referencia_id: pedido.id,
        referencia_tipo: 'pedido'
      });
    }

    res.json({
      success: true,
      message: 'Pedido marcado como pagado correctamente',
      data: pedido
    });
  } catch (error) {
    console.error('Error al marcar pedido como pagado:', error);
    res.status(500).json({
      success: false,
      message: 'Error al marcar pedido como pagado',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Procesar envío de pedido - Crear venta y descontar stock (Vendedor/Admin)
 */
export const procesarEnvio = async (req: Request, res: Response): Promise<void> => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const usuarioProcesadorId: number | undefined = (req as any).user?.id;

    console.log('procesarEnvio - Request:', { id, usuarioProcesadorId });

    if (!usuarioProcesadorId) {
      await transaction.rollback();
      res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
      return;
    }

    const usuarioId: number = usuarioProcesadorId;

    const pedido = await Pedido.findByPk(id, {
      include: [
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
          model: Cliente,
          as: 'cliente'
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

    console.log('procesarEnvio - Pedido encontrado:', {
      id: pedido.id,
      numero: pedido.numero_pedido,
      estado: pedido.estado,
      cliente_id: pedido.cliente_id,
      detalles_count: pedido.detalles?.length || 0
    });

    // Verificar que el pedido está en estado PAGADO
    if (pedido.estado !== 'PAGADO') {
      await transaction.rollback();
      res.status(400).json({
        success: false,
        message: `Solo se pueden procesar envíos de pedidos en estado PAGADO. Estado actual: ${pedido.estado}`
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
      usuario_id: usuarioId,
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
              usuarioId
            );
          }, 100);
        }
      }
    }

    // Actualizar estado del pedido: PROCESADO para admin, EN_CAMINO para cliente
    // Usamos fecha_envio para indicar que está en camino
    await pedido.update({
      estado: 'PROCESADO',
      fecha_envio: new Date(),
      venta_id: venta.id
    }, { transaction });

    // Notificar al cliente que su pedido está en camino
    if (pedido.usuario_id) {
      await notificacionService.crearNotificacion({
        usuario_id: pedido.usuario_id,
        tipo: 'SISTEMA',
        titulo: '🚚 Pedido en camino',
        mensaje: `Tu pedido ${pedido.numero_pedido} ha sido procesado y está en camino. Factura: ${numeroFactura}`,
        referencia_id: pedido.id,
        referencia_tipo: 'pedido'
      });
    }

    await transaction.commit();

    console.log('procesarEnvio - Pedido procesado y venta generada exitosamente:', {
      pedido_id: pedido.id,
      venta_id: venta.id,
      numero_factura: venta.numero_factura,
      fecha_envio: new Date()
    });

    res.json({
      success: true,
      message: 'Pedido procesado y venta generada correctamente. El pedido está en camino.',
      data: {
        pedido,
        venta
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error al procesar envío:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    res.status(500).json({
      success: false,
      message: 'Error al procesar envío',
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
          as: 'cliente',
          required: true
        },
        {
          model: Usuario,
          as: 'usuario',
          attributes: ['id', 'nombre_completo', 'email'],
          required: false // Permitir null para pedidos desde WhatsApp
        },
        {
          model: Usuario,
          as: 'aprobador',
          attributes: ['id', 'nombre_completo'],
          required: false
        },
        {
          model: DetallePedido,
          as: 'detalles',
          required: false,
          include: [
            {
              model: Producto,
              as: 'producto'
            } as any
          ]
        },
        {
          model: Venta,
          as: 'venta',
          required: false
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


/**
 * Crear pedido vacío para WhatsApp (en proceso)
 */
export const crearPedidoVacio = async (req: Request, res: Response): Promise<void> => {
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

    const { cliente_id, telefono } = req.body;

    if (!cliente_id) {
      await transaction.rollback();
      res.status(400).json({
        success: false,
        message: 'cliente_id es requerido'
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

    // Generar número de pedido
    const numeroPedido = await generarNumeroPedido();

    // Crear pedido vacío con estado EN_PROCESO
    const pedido = await Pedido.create({
      cliente_id: cliente_id,
      usuario_id: null, // Pedido desde WhatsApp
      numero_pedido: numeroPedido,
      tipo_pedido: 'COMPRA_DIRECTA',
      estado: 'EN_PROCESO',
      subtotal: 0,
      descuento: 0,
      impuesto: 0,
      total: 0,
      observaciones: `Pedido en proceso desde WhatsApp - ${telefono || 'N/A'}`,
      fecha_pedido: new Date()
    }, { transaction });

    await transaction.commit();

    res.status(201).json({
      success: true,
      data: {
        id: pedido.id,
        numero_pedido: pedido.numero_pedido,
        estado: pedido.estado,
        total: 0,
        detalles: []
      }
    });
  } catch (error: any) {
    await transaction.rollback();
    console.error('Error al crear pedido vacío:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear pedido vacío',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Agregar producto a pedido en proceso
 */
export const agregarProductoAPedido = async (req: Request, res: Response): Promise<void> => {
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

    const { pedido_id, producto_id, cantidad } = req.body;

    if (!pedido_id || !producto_id || !cantidad) {
      await transaction.rollback();
      res.status(400).json({
        success: false,
        message: 'pedido_id, producto_id y cantidad son requeridos'
      });
      return;
    }

    // Verificar que el pedido existe y está en proceso
    const pedido = await Pedido.findByPk(pedido_id, { transaction });
    if (!pedido) {
      await transaction.rollback();
      res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
      return;
    }

    if (pedido.estado !== 'EN_PROCESO') {
      await transaction.rollback();
      res.status(400).json({
        success: false,
        message: `El pedido no está en proceso. Estado actual: ${pedido.estado}`
      });
      return;
    }

    // Verificar producto
    const producto = await Producto.findByPk(producto_id, { transaction });
    if (!producto) {
      await transaction.rollback();
      res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
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

    if (producto.stock_actual < cantidad) {
      await transaction.rollback();
      res.status(400).json({
        success: false,
        message: `Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stock_actual}`
      });
      return;
    }

    // Verificar si el producto ya está en el pedido
    const detalleExistente = await DetallePedido.findOne({
      where: {
        pedido_id: pedido_id,
        producto_id: producto_id
      },
      transaction
    });

    let detallePedido;
    if (detalleExistente) {
      // Actualizar cantidad existente
      const nuevaCantidad = detalleExistente.cantidad + cantidad;
      if (producto.stock_actual < nuevaCantidad) {
        await transaction.rollback();
        res.status(400).json({
          success: false,
          message: `Stock insuficiente. Ya tienes ${detalleExistente.cantidad} en el pedido. Disponible: ${producto.stock_actual}`
        });
        return;
      }

      const precioUnitario = producto.precio_venta;
      const subtotal = precioUnitario * nuevaCantidad;

      await detalleExistente.update({
        cantidad: nuevaCantidad,
        precio_unitario: precioUnitario,
        subtotal: subtotal
      }, { transaction });

      detallePedido = detalleExistente;
    } else {
      // Crear nuevo detalle
      const precioUnitario = producto.precio_venta;
      const subtotal = precioUnitario * cantidad;

      detallePedido = await DetallePedido.create({
        pedido_id: pedido_id,
        producto_id: producto_id,
        cantidad: cantidad,
        precio_unitario: precioUnitario,
        descuento: 0,
        subtotal: subtotal
      }, { transaction });
    }

    // Recalcular totales del pedido
    const detalles = await DetallePedido.findAll({
      where: { pedido_id: pedido_id },
      transaction
    });

    let subtotal = 0;
    for (const det of detalles) {
      subtotal += parseFloat(det.subtotal.toString());
    }

    const impuesto = subtotal * 0.18; // IGV 18%
    const total = subtotal + impuesto;

    await pedido.update({
      subtotal: subtotal,
      impuesto: impuesto,
      total: total
    }, { transaction });

    await transaction.commit();

    // Cargar pedido completo con detalles
    const pedidoCompleto = await Pedido.findByPk(pedido_id, {
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
        }
      ]
    });

    res.status(200).json({
      success: true,
      data: pedidoCompleto,
      message: 'Producto agregado al pedido'
    });
  } catch (error: any) {
    await transaction.rollback();
    console.error('Error al agregar producto al pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error al agregar producto al pedido',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Eliminar producto de pedido en proceso
 */
export const eliminarProductoDePedido = async (req: Request, res: Response): Promise<void> => {
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

    const { pedido_id, detalle_id } = req.body;

    if (!pedido_id || !detalle_id) {
      await transaction.rollback();
      res.status(400).json({
        success: false,
        message: 'pedido_id y detalle_id son requeridos'
      });
      return;
    }

    // Verificar que el pedido existe y está en proceso
    const pedido = await Pedido.findByPk(pedido_id, { transaction });
    if (!pedido) {
      await transaction.rollback();
      res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
      return;
    }

    if (pedido.estado !== 'EN_PROCESO') {
      await transaction.rollback();
      res.status(400).json({
        success: false,
        message: `El pedido no está en proceso. Estado actual: ${pedido.estado}`
      });
      return;
    }

    // Eliminar detalle
    const detalle = await DetallePedido.findByPk(detalle_id, { transaction });
    if (!detalle || detalle.pedido_id !== pedido_id) {
      await transaction.rollback();
      res.status(404).json({
        success: false,
        message: 'Detalle de pedido no encontrado'
      });
      return;
    }

    await detalle.destroy({ transaction });

    // Recalcular totales del pedido
    const detalles = await DetallePedido.findAll({
      where: { pedido_id: pedido_id },
      transaction
    });

    let subtotal = 0;
    for (const det of detalles) {
      subtotal += parseFloat(det.subtotal.toString());
    }

    const impuesto = subtotal * 0.18;
    const total = subtotal + impuesto;

    await pedido.update({
      subtotal: subtotal,
      impuesto: impuesto,
      total: total
    }, { transaction });

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: 'Producto eliminado del pedido'
    });
  } catch (error: any) {
    await transaction.rollback();
    console.error('Error al eliminar producto del pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar producto del pedido',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Obtener pedido en proceso
 */
export const getPedidoEnProceso = async (req: Request, res: Response): Promise<void> => {
  try {
    // Verificar token especial para chatbot
    const chatToken = req.headers['x-chatbot-token'] || req.params.token || req.query.token;
    const expectedToken = process.env.CHATBOT_API_TOKEN;

    if (expectedToken && chatToken !== expectedToken) {
      res.status(401).json({
        success: false,
        message: 'Token inválido para chatbot'
      });
      return;
    }

    const { pedido_id } = req.params;

    const pedido = await Pedido.findByPk(pedido_id, {
      include: [
        {
          model: DetallePedido,
          as: 'detalles',
          include: [
            {
              model: Producto,
              as: 'producto',
              attributes: ['id', 'nombre', 'codigo_interno', 'precio_venta', 'stock_actual']
            }
          ]
        },
        {
          model: Cliente,
          as: 'cliente',
          required: false
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

    res.json({
      success: true,
      data: pedido
    });
  } catch (error: any) {
    console.error('Error al obtener pedido en proceso:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener pedido',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Cancelar pedido en proceso
 */
export const cancelarPedidoEnProceso = async (req: Request, res: Response): Promise<void> => {
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

    const { pedido_id } = req.body;

    if (!pedido_id) {
      await transaction.rollback();
      res.status(400).json({
        success: false,
        message: 'pedido_id es requerido'
      });
      return;
    }

    const pedido = await Pedido.findByPk(pedido_id, { transaction });
    if (!pedido) {
      await transaction.rollback();
      res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
      return;
    }

    if (pedido.estado !== 'EN_PROCESO') {
      await transaction.rollback();
      res.status(400).json({
        success: false,
        message: `El pedido no está en proceso. Estado actual: ${pedido.estado}`
      });
      return;
    }

    // Cambiar estado a CANCELADO
    await pedido.update({
      estado: 'CANCELADO',
      observaciones: `${pedido.observaciones || ''} - Cancelado desde WhatsApp`
    }, { transaction });

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: 'Pedido cancelado exitosamente'
    });
  } catch (error: any) {
    await transaction.rollback();
    console.error('Error al cancelar pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cancelar pedido',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};
