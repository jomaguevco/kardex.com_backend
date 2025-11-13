import { Request, Response } from 'express';
import notificacionService from '../services/notificacionService';

export const getNotificaciones = async (req: Request, res: Response): Promise<void> => {
  try {
    const usuarioId = (req as any).user?.id;
    if (!usuarioId) {
      res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
      return;
    }

    const { tipo, leido, limit } = req.query;

    const notificaciones = await notificacionService.obtenerNotificaciones(usuarioId, {
      tipo: tipo as string,
      leido: leido === 'true' ? true : leido === 'false' ? false : undefined,
      limit: limit ? parseInt(limit as string) : undefined
    });

    res.json({
      success: true,
      data: notificaciones
    });
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

export const getResumen = async (req: Request, res: Response): Promise<void> => {
  try {
    const usuarioId = (req as any).user?.id;
    if (!usuarioId) {
      res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
      return;
    }

    // Generar notificaciones automáticas antes de obtener el resumen
    await notificacionService.generarNotificacionesAutomaticas(usuarioId);

    const resumen = await notificacionService.obtenerResumen(usuarioId);

    res.json({
      success: true,
      data: resumen
    });
  } catch (error) {
    console.error('Error al obtener resumen de notificaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

export const marcarComoLeida = async (req: Request, res: Response): Promise<void> => {
  try {
    const usuarioId = (req as any).user?.id;
    if (!usuarioId) {
      res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
      return;
    }

    const { id } = req.params;
    const notificacion = await notificacionService.marcarComoLeida(parseInt(id), usuarioId);

    res.json({
      success: true,
      data: notificacion,
      message: 'Notificación marcada como leída'
    });
  } catch (error: any) {
    console.error('Error al marcar notificación como leída:', error);
    res.status(error.message === 'Notificación no encontrada' ? 404 : 500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
};

export const marcarTodasComoLeidas = async (req: Request, res: Response): Promise<void> => {
  try {
    const usuarioId = (req as any).user?.id;
    if (!usuarioId) {
      res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
      return;
    }

    await notificacionService.marcarTodasComoLeidas(usuarioId);

    res.json({
      success: true,
      message: 'Todas las notificaciones marcadas como leídas'
    });
  } catch (error) {
    console.error('Error al marcar todas como leídas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

export const generarNotificaciones = async (req: Request, res: Response): Promise<void> => {
  try {
    const usuarioId = (req as any).user?.id;
    if (!usuarioId) {
      res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
      return;
    }

    await notificacionService.generarNotificacionesAutomaticas(usuarioId);

    res.json({
      success: true,
      message: 'Notificaciones generadas'
    });
  } catch (error) {
    console.error('Error al generar notificaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

