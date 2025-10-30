import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validation';
import Joi from 'joi';
import {
  getProductos,
  getProductoById,
  createProducto,
  updateProducto,
  deleteProducto,
  ajustarStock,
  getProductosStockBajo
} from '../controllers/productoController';

const router = Router();

// Esquemas de validación
const createProductoSchema = Joi.object({
  codigo_barras: Joi.string().max(50).optional(),
  codigo_interno: Joi.string().max(50).required(),
  nombre: Joi.string().max(200).required(),
  descripcion: Joi.string().optional(),
  categoria_id: Joi.number().integer().optional(),
  marca_id: Joi.number().integer().optional(),
  unidad_medida_id: Joi.number().integer().optional(),
  precio_venta: Joi.number().min(0).optional(),
  costo_promedio: Joi.number().min(0).optional(),
  precio_compra: Joi.number().min(0).optional(),
  stock_minimo: Joi.number().integer().min(0).optional(),
  stock_maximo: Joi.number().integer().min(0).optional(),
  punto_reorden: Joi.number().integer().min(0).optional(),
  stock_actual: Joi.number().integer().min(0).optional(),
  peso: Joi.number().min(0).optional(),
  volumen: Joi.number().min(0).optional(),
  dimensiones: Joi.string().max(100).optional(),
  tiene_caducidad: Joi.boolean().optional(),
  dias_caducidad: Joi.number().integer().min(0).optional()
});

const updateProductoSchema = Joi.object({
  codigo_barras: Joi.string().max(50).optional(),
  codigo_interno: Joi.string().max(50).optional(),
  nombre: Joi.string().max(200).optional(),
  descripcion: Joi.string().optional(),
  categoria_id: Joi.number().integer().optional(),
  marca_id: Joi.number().integer().optional(),
  unidad_medida_id: Joi.number().integer().optional(),
  precio_venta: Joi.number().min(0).optional(),
  costo_promedio: Joi.number().min(0).optional(),
  precio_compra: Joi.number().min(0).optional(),
  stock_minimo: Joi.number().integer().min(0).optional(),
  stock_maximo: Joi.number().integer().min(0).optional(),
  punto_reorden: Joi.number().integer().min(0).optional(),
  stock_actual: Joi.number().integer().min(0).optional(),
  peso: Joi.number().min(0).optional(),
  volumen: Joi.number().min(0).optional(),
  dimensiones: Joi.string().max(100).optional(),
  tiene_caducidad: Joi.boolean().optional(),
  dias_caducidad: Joi.number().integer().min(0).optional()
});

const ajustarStockSchema = Joi.object({
  cantidad: Joi.number().required(),
  motivo: Joi.string().max(200).optional(),
  observaciones: Joi.string().optional()
});

// Rutas
router.get('/', authenticateToken, getProductos);
router.get('/stock-bajo', authenticateToken, getProductosStockBajo);
router.get('/:id', authenticateToken, getProductoById);
router.post('/', authenticateToken, validate(createProductoSchema), createProducto);
router.put('/:id', authenticateToken, validate(updateProductoSchema), updateProducto);
router.delete('/:id', authenticateToken, deleteProducto);
router.post('/:id/ajustar-stock', authenticateToken, validate(ajustarStockSchema), ajustarStock);

export default router;