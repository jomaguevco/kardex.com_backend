import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validation';
import Joi from 'joi';
import {
  getMovimientosKardex,
  getMovimientoById,
  getKardexProducto,
  createMovimientoManual,
  getTiposMovimiento,
  getResumenKardex
} from '../controllers/kardexController';

const router = Router();

// Esquemas de validación
const createMovimientoManualSchema = Joi.object({
  producto_id: Joi.number().integer().required(),
  almacen_id: Joi.number().integer().optional(),
  tipo_movimiento: Joi.string().valid(
    'ENTRADA_COMPRA',
    'ENTRADA_DEVOLUCION_CLIENTE',
    'ENTRADA_AJUSTE_POSITIVO',
    'ENTRADA_TRANSFERENCIA',
    'SALIDA_VENTA',
    'SALIDA_DEVOLUCION_PROVEEDOR',
    'SALIDA_AJUSTE_NEGATIVO',
    'SALIDA_TRANSFERENCIA',
    'SALIDA_MERMA'
  ).required(),
  cantidad: Joi.number().min(0.01).required(),
  precio_unitario: Joi.number().min(0).required(),
  documento_referencia: Joi.string().max(100).required(),
  numero_documento: Joi.string().max(50).optional(),
  fecha_movimiento: Joi.date().optional(),
  observaciones: Joi.string().optional(),
  motivo_movimiento: Joi.string().optional()
});

// Rutas
router.get('/', authenticateToken, getMovimientosKardex);
router.get('/resumen', authenticateToken, getResumenKardex);
router.get('/tipos-movimiento', authenticateToken, getTiposMovimiento);
router.get('/producto/:producto_id', authenticateToken, getKardexProducto);
router.get('/:id', authenticateToken, getMovimientoById);
router.post('/manual', authenticateToken, validate(createMovimientoManualSchema), createMovimientoManual);

export default router;