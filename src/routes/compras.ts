import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validation';
import Joi from 'joi';
import {
  getCompras,
  getCompraById,
  createCompra,
  updateCompra,
  deleteCompra,
  getEstadisticasCompras
} from '../controllers/compraController';

const router = Router();

// Esquemas de validación
const detalleCompraSchema = Joi.object({
  producto_id: Joi.number().integer().required(),
  cantidad: Joi.number().min(0.01).required(),
  precio_unitario: Joi.number().min(0).required(),
  descuento: Joi.number().min(0).optional()
});

const createCompraSchema = Joi.object({
  proveedor_id: Joi.number().integer().required(),
  numero_factura: Joi.string().max(50).optional(),
  fecha_compra: Joi.date().optional(),
  fecha_vencimiento: Joi.date().optional(),
  subtotal: Joi.number().min(0).optional(),
  descuento: Joi.number().min(0).optional(),
  impuestos: Joi.number().min(0).optional(),
  total: Joi.number().min(0).optional(),
  estado: Joi.string().valid('PENDIENTE', 'PROCESADA', 'ANULADA').optional(),
  observaciones: Joi.string().optional(),
  detalles: Joi.array().items(detalleCompraSchema).min(1).required()
});

const updateCompraSchema = Joi.object({
  estado: Joi.string().valid('PENDIENTE', 'PROCESADA', 'ANULADA').optional(),
  observaciones: Joi.string().optional(),
  fecha_vencimiento: Joi.date().optional()
});

// Rutas
router.get('/', authenticateToken, getCompras);
router.get('/estadisticas', authenticateToken, getEstadisticasCompras);
router.get('/:id', authenticateToken, getCompraById);
router.post('/', authenticateToken, validate(createCompraSchema), createCompra);
router.put('/:id', authenticateToken, validate(updateCompraSchema), updateCompra);
router.delete('/:id', authenticateToken, deleteCompra);

export default router;