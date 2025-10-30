import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validation';
import Joi from 'joi';
import {
  getProveedores,
  getProveedorById,
  createProveedor,
  updateProveedor,
  deleteProveedor,
  getProveedoresActivos
} from '../controllers/proveedorController';

const router = Router();

// Esquemas de validación
const createProveedorSchema = Joi.object({
  codigo: Joi.string().max(20).optional(),
  nombre: Joi.string().max(200).required(),
  tipo_documento: Joi.string().valid('RUC', 'DNI', 'CE', 'PASAPORTE').optional(),
  numero_documento: Joi.string().max(20).required(),
  direccion: Joi.string().optional(),
  telefono: Joi.string().max(20).optional(),
  email: Joi.string().email().optional(),
  contacto: Joi.string().max(100).optional(),
  tipo_proveedor: Joi.string().valid('NACIONAL', 'INTERNACIONAL').optional()
});

const updateProveedorSchema = Joi.object({
  codigo: Joi.string().max(20).optional(),
  nombre: Joi.string().max(200).optional(),
  tipo_documento: Joi.string().valid('RUC', 'DNI', 'CE', 'PASAPORTE').optional(),
  numero_documento: Joi.string().max(20).optional(),
  direccion: Joi.string().optional(),
  telefono: Joi.string().max(20).optional(),
  email: Joi.string().email().optional(),
  contacto: Joi.string().max(100).optional(),
  tipo_proveedor: Joi.string().valid('NACIONAL', 'INTERNACIONAL').optional()
});

// Rutas
router.get('/', authenticateToken, getProveedores);
router.get('/activos', authenticateToken, getProveedoresActivos);
router.get('/:id', authenticateToken, getProveedorById);
router.post('/', authenticateToken, validate(createProveedorSchema), createProveedor);
router.put('/:id', authenticateToken, validate(updateProveedorSchema), updateProveedor);
router.delete('/:id', authenticateToken, deleteProveedor);

export default router;

