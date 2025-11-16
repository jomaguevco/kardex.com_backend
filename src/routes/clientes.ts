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
  getClientesActivos,
  getClienteByPhone,
  linkPhoneToCliente,
  registerClienteLite
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

const linkPhoneSchema = Joi.object({
  clientId: Joi.number().required(),
  phone: Joi.string().max(20).required()
});

const registerLiteSchema = Joi.object({
  name: Joi.string().max(200).required(),
  dni: Joi.string().max(20).required(),
  phone: Joi.string().max(20).required()
});

// Rutas
router.get('/', authenticateToken, getClientes);
router.get('/activos', authenticateToken, getClientesActivos);
router.get('/by-phone/:phone', authenticateToken, getClienteByPhone);
router.get('/:id', authenticateToken, getClienteById);
router.post('/', authenticateToken, validate(createClienteSchema), createCliente);
router.put('/:id', authenticateToken, validate(updateClienteSchema), updateCliente);
router.delete('/:id', authenticateToken, deleteCliente);
router.post('/link-phone', authenticateToken, validate(linkPhoneSchema), linkPhoneToCliente);
router.post('/register-lite', authenticateToken, validate(registerLiteSchema), registerClienteLite);

export default router;



