import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validation';
import Joi from 'joi';
import {
  getClientes,
  getClienteById,
  createCliente,
  updateCliente,
  deleteCliente,
  getClientesActivos
} from '../controllers/clienteController';

const router = Router();

// Esquemas de validación
const createClienteSchema = Joi.object({
  nombre: Joi.string().max(200).required(),
  numero_documento: Joi.string().max(20).required(),
  tipo_documento: Joi.string().valid('RUC', 'DNI', 'CE', 'PASAPORTE').optional(),
  direccion: Joi.string().optional(),
  telefono: Joi.string().max(20).optional(),
  email: Joi.string().email().optional(),
  contacto: Joi.string().max(100).optional(),
  tipo_cliente: Joi.string().valid('NATURAL', 'JURIDICA').optional()
});

const updateClienteSchema = Joi.object({
  nombre: Joi.string().max(200).optional(),
  numero_documento: Joi.string().max(20).optional(),
  tipo_documento: Joi.string().valid('RUC', 'DNI', 'CE', 'PASAPORTE').optional(),
  direccion: Joi.string().optional(),
  telefono: Joi.string().max(20).optional(),
  email: Joi.string().email().optional(),
  contacto: Joi.string().max(100).optional(),
  tipo_cliente: Joi.string().valid('NATURAL', 'JURIDICA').optional()
});

// Rutas
router.get('/', authenticateToken, getClientes);
router.get('/activos', authenticateToken, getClientesActivos);
router.get('/:id', authenticateToken, getClienteById);
router.post('/', authenticateToken, validate(createClienteSchema), createCliente);
router.put('/:id', authenticateToken, validate(updateClienteSchema), updateCliente);
router.delete('/:id', authenticateToken, deleteCliente);

export default router;



