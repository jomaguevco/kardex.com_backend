import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validation';
import Joi from 'joi';
import {
  getVentas,
  getVentaById,
  createVenta,
  updateVenta,
  deleteVenta,
  getEstadisticasVentas
} from '../controllers/ventaController';

const router = Router();

// Esquemas de validación
const detalleVentaSchema = Joi.object({
  producto_id: Joi.number().integer().required(),
  cantidad: Joi.number().min(0.01).required(),
  precio_unitario: Joi.number().min(0).required(),
  descuento: Joi.number().min(0).optional(), // Campo que envía el frontend
  subtotal: Joi.number().min(0).optional(), // Campo que envía el frontend
  descuento_porcentaje: Joi.number().min(0).max(100).optional(),
  descuento_monto: Joi.number().min(0).optional()
});

const createVentaSchema = Joi.object({
  cliente_id: Joi.number().integer().required(),
  numero_factura: Joi.string().max(50).optional(),
  numero_control: Joi.string().max(50).optional(),
  fecha_venta: Joi.alternatives().try(Joi.date(), Joi.string()).optional(), // Acepta fecha o string ISO
  subtotal: Joi.number().min(0).optional(),
  descuento: Joi.number().min(0).optional(), // Campo que envía el frontend
  impuestos: Joi.number().min(0).optional(), // Campo que envía el frontend
  descuento_porcentaje: Joi.number().min(0).max(100).optional(),
  descuento_monto: Joi.number().min(0).optional(),
  impuesto_porcentaje: Joi.number().min(0).max(100).optional(),
  impuesto_monto: Joi.number().min(0).optional(),
  total: Joi.number().min(0).optional(),
  metodo_pago: Joi.string().valid('EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'CHEQUE').optional(),
  estado: Joi.string().valid('PENDIENTE', 'COMPLETADA', 'CANCELADA').optional(),
  observaciones: Joi.string().optional(),
  detalles: Joi.array().items(detalleVentaSchema).min(1).required()
});

const updateVentaSchema = Joi.object({
  estado: Joi.string().valid('PENDIENTE', 'COMPLETADA', 'CANCELADA').optional(),
  observaciones: Joi.string().optional(),
  metodo_pago: Joi.string().valid('EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'CHEQUE').optional()
});

// Rutas
router.get('/', authenticateToken, getVentas);
router.get('/estadisticas', authenticateToken, getEstadisticasVentas);
router.get('/:id', authenticateToken, getVentaById);
router.post('/', authenticateToken, validate(createVentaSchema), createVenta);
router.put('/:id', authenticateToken, validate(updateVentaSchema), updateVenta);
router.delete('/:id', authenticateToken, deleteVenta);

export default router;