import Notificacion from '../models/Notificacion';
import Producto from '../models/Producto';
import Compra from '../models/Compra';
import Venta from '../models/Venta';
import { MonitoreoTransaccion } from '../models';
import { Op } from 'sequelize';
import sequelize from '../config/database';

class NotificacionService {
  async generarNotificacionesAutomaticas(usuarioId: number): Promise<void> {
    try {
      // Detectar productos con stock bajo
      const productosStockBajo = await Producto.findAll({
        where: {
          stock_actual: {
            [Op.lte]: sequelize.col('stock_minimo')
          },
          activo: true
        }
      });

      for (const producto of productosStockBajo) {
        const existente = await Notificacion.findOne({
          where: {
            usuario_id: usuarioId,
            tipo: 'STOCK_BAJO',
            referencia_id: producto.id,
            leido: false
          }
        });

        if (!existente) {
          await Notificacion.create({
            usuario_id: usuarioId,
            tipo: 'STOCK_BAJO',
            titulo: '⚠️ Stock bajo',
            mensaje: `El producto "${producto.nombre}" tiene stock bajo (${producto.stock_actual} unidades)`,
            referencia_id: producto.id,
            referencia_tipo: 'producto'
          });
        }
      }

      // Detectar compras pendientes
      const comprasPendientes = await Compra.count({
        where: {
          estado: 'PENDIENTE'
        }
      });

      if (comprasPendientes > 0) {
        const existente = await Notificacion.findOne({
          where: {
            usuario_id: usuarioId,
            tipo: 'COMPRA_PENDIENTE',
            leido: false,
            fecha_creacion: {
              [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24 horas
            }
          }
        });

        if (!existente) {
          await Notificacion.create({
            usuario_id: usuarioId,
            tipo: 'COMPRA_PENDIENTE',
            titulo: '📦 Compras pendientes',
            mensaje: `Tienes ${comprasPendientes} compra(s) pendiente(s) de procesar`,
            referencia_tipo: 'compras'
          });
        }
      }

      // Detectar ventas pendientes
      const ventasPendientes = await Venta.count({
        where: {
          estado: 'PENDIENTE'
        }
      });

      if (ventasPendientes > 0) {
        const existente = await Notificacion.findOne({
          where: {
            usuario_id: usuarioId,
            tipo: 'VENTA_PENDIENTE',
            leido: false,
            fecha_creacion: {
              [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000)
            }
          }
        });

        if (!existente) {
          await Notificacion.create({
            usuario_id: usuarioId,
            tipo: 'VENTA_PENDIENTE',
            titulo: '💰 Ventas pendientes',
            mensaje: `Tienes ${ventasPendientes} venta(s) pendiente(s) de procesar`,
            referencia_tipo: 'ventas'
          });
        }
      }
    } catch (error) {
      console.error('Error generando notificaciones automáticas:', error);
    }
  }

  async obtenerNotificaciones(usuarioId: number, filtros?: {
    tipo?: string;
    leido?: boolean;
    limit?: number;
  }) {
    const whereClause: any = { usuario_id: usuarioId };

    if (filtros?.tipo) {
      whereClause.tipo = filtros.tipo;
    }

    if (filtros?.leido !== undefined) {
      whereClause.leido = filtros.leido;
    }

    const notificaciones = await Notificacion.findAll({
      where: whereClause,
      order: [['fecha_creacion', 'DESC']],
      limit: filtros?.limit || 50
    });

    return notificaciones;
  }

  async obtenerResumen(usuarioId: number) {
    const total = await Notificacion.count({
      where: { usuario_id: usuarioId }
    });

    const noLeidas = await Notificacion.count({
      where: {
        usuario_id: usuarioId,
        leido: false
      }
    });

    const porTipo = await Notificacion.findAll({
      where: { usuario_id: usuarioId, leido: false },
      attributes: [
        'tipo',
        [sequelize.fn('COUNT', sequelize.col('id')), 'cantidad']
      ],
      group: ['tipo']
    });

    return {
      total,
      noLeidas,
      porTipo: porTipo.map((item: any) => ({
        tipo: item.tipo,
        cantidad: parseInt(item.get('cantidad') as string)
      }))
    };
  }

  async marcarComoLeida(notificacionId: number, usuarioId: number) {
    const notificacion = await Notificacion.findOne({
      where: {
        id: notificacionId,
        usuario_id: usuarioId
      }
    });

    if (!notificacion) {
      throw new Error('Notificación no encontrada');
    }

    await notificacion.update({ leido: true });
    return notificacion;
  }

  async marcarTodasComoLeidas(usuarioId: number) {
    await Notificacion.update(
      { leido: true },
      {
        where: {
          usuario_id: usuarioId,
          leido: false
        }
      }
    );
  }

  async crearNotificacion(data: {
    usuario_id: number;
    tipo: 'STOCK_BAJO' | 'COMPRA_PENDIENTE' | 'VENTA_PENDIENTE' | 'TRANSACCION' | 'SISTEMA';
    titulo: string;
    mensaje: string;
    referencia_id?: number;
    referencia_tipo?: string;
  }) {
    return await Notificacion.create(data);
  }

  /**
   * Notificar cuando se registra una nueva venta
   */
  async notificarVenta(ventaId: number, numeroFactura: string, total: number, usuarioId: number) {
    try {
      await this.crearNotificacion({
        usuario_id: usuarioId,
        tipo: 'TRANSACCION',
        titulo: '✅ Venta registrada',
        mensaje: `Venta ${numeroFactura} registrada exitosamente por un total de S/. ${total.toFixed(2)}`,
        referencia_id: ventaId,
        referencia_tipo: 'venta'
      });
    } catch (error) {
      console.error('Error al notificar venta:', error);
    }
  }

  /**
   * Notificar cuando se registra una nueva compra
   */
  async notificarCompra(compraId: number, numeroFactura: string, total: number, usuarioId: number) {
    try {
      await this.crearNotificacion({
        usuario_id: usuarioId,
        tipo: 'TRANSACCION',
        titulo: '📦 Compra registrada',
        mensaje: `Compra ${numeroFactura} registrada exitosamente por un total de S/. ${total.toFixed(2)}`,
        referencia_id: compraId,
        referencia_tipo: 'compra'
      });
    } catch (error) {
      console.error('Error al notificar compra:', error);
    }
  }

  /**
   * Notificar cuando un producto tiene stock bajo después de una operación
   */
  async notificarStockBajo(productoId: number, nombreProducto: string, stockActual: number, usuarioId: number) {
    try {
      // Verificar si ya existe una notificación no leída para este producto
      const existente = await Notificacion.findOne({
        where: {
          usuario_id: usuarioId,
          tipo: 'STOCK_BAJO',
          referencia_id: productoId,
          leido: false
        }
      });

      if (!existente) {
        await this.crearNotificacion({
          usuario_id: usuarioId,
          tipo: 'STOCK_BAJO',
          titulo: '⚠️ Stock bajo',
          mensaje: `El producto "${nombreProducto}" tiene stock bajo (${stockActual} unidades)`,
          referencia_id: productoId,
          referencia_tipo: 'producto'
        });
      }
    } catch (error) {
      console.error('Error al notificar stock bajo:', error);
    }
  }

  /**
   * Notificar a todos los administradores sobre eventos importantes
   */
  async notificarAdministradores(tipo: 'STOCK_BAJO' | 'COMPRA_PENDIENTE' | 'VENTA_PENDIENTE' | 'TRANSACCION' | 'SISTEMA', titulo: string, mensaje: string, referenciaId?: number, referenciaTipo?: string) {
    try {
      // Importar Usuario solo cuando se necesite para evitar dependencias circulares
      const Usuario = (await import('../models/Usuario')).default;
      
      const administradores = await Usuario.findAll({
        where: {
          rol: 'ADMINISTRADOR',
          activo: true
        }
      });

      for (const admin of administradores) {
        await this.crearNotificacion({
          usuario_id: admin.id,
          tipo,
          titulo,
          mensaje,
          referencia_id: referenciaId,
          referencia_tipo: referenciaTipo
        });
      }
    } catch (error) {
      console.error('Error al notificar administradores:', error);
    }
  }

  /**
   * Notificar a administradores y vendedores sobre pedido desde WhatsApp
   * NO crea pedido directamente, solo notifica
   */
  async notificarPedidoWhatsApp(titulo: string, mensaje: string, metadata?: any) {
    try {
      // Importar Usuario solo cuando se necesite para evitar dependencias circulares
      const Usuario = (await import('../models/Usuario')).default;
      
      const usuarios = await Usuario.findAll({
        where: {
          rol: {
            [Op.in]: ['ADMINISTRADOR', 'VENDEDOR']
          },
          activo: true
        } as any
      });

      let notificacionesCreadas = 0;

      for (const usuario of usuarios) {
        await this.crearNotificacion({
          usuario_id: usuario.id,
          tipo: 'SISTEMA',
          titulo,
          mensaje,
          referencia_tipo: 'whatsapp_pedido'
        });
        notificacionesCreadas++;
      }

      return notificacionesCreadas;
    } catch (error) {
      console.error('Error al notificar pedido WhatsApp:', error);
      throw error;
    }
  }
}

export default new NotificacionService();

