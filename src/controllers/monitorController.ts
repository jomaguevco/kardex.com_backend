import { Request, Response } from 'express';
import MonitoreoTransaccion from '@/models/MonitoreoTransaccion';

export const listarTransacciones = async (req: Request, res: Response) => {
  try {
    const { limit = 20 } = req.query;

    const registros = await MonitoreoTransaccion.findAll({
      order: [['id', 'DESC']],
      limit: Number(limit)
    });

    res.json({
      success: true,
      data: registros
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'No se pudo obtener el monitoreo de transacciones',
      error: error.message
    });
  }
};

