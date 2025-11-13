import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/permissions';
import {
  crearPedido,
  getPedidosPendientes,
  getMisPedidos,
  aprobarPedido,
  rechazarPedido,
  getDetallePedido
} from '../controllers/pedidoController';

const router = express.Router();

/**
 * @route   POST /api/pedidos
 * @desc    Crear un nuevo pedido
 * @access  Private (CLIENTE)
 */
router.post('/', authenticateToken, requireRole('CLIENTE'), crearPedido);

/**
 * @route   GET /api/pedidos/mis-pedidos
 * @desc    Obtener pedidos del cliente autenticado
 * @access  Private (CLIENTE)
 */
router.get('/mis-pedidos', authenticateToken, requireRole('CLIENTE'), getMisPedidos);

/**
 * @route   GET /api/pedidos/pendientes
 * @desc    Obtener pedidos pendientes de aprobación
 * @access  Private (VENDEDOR, ADMINISTRADOR)
 */
router.get('/pendientes', authenticateToken, requireRole(['VENDEDOR', 'ADMINISTRADOR']), getPedidosPendientes);

/**
 * @route   GET /api/pedidos/:id
 * @desc    Obtener detalle de un pedido específico
 * @access  Private (CLIENTE, VENDEDOR, ADMINISTRADOR)
 */
router.get('/:id', authenticateToken, requireRole(['CLIENTE', 'VENDEDOR', 'ADMINISTRADOR']), getDetallePedido);

/**
 * @route   PUT /api/pedidos/:id/aprobar
 * @desc    Aprobar pedido y convertir en venta
 * @access  Private (VENDEDOR, ADMINISTRADOR)
 */
router.put('/:id/aprobar', authenticateToken, requireRole(['VENDEDOR', 'ADMINISTRADOR']), aprobarPedido);

/**
 * @route   PUT /api/pedidos/:id/rechazar
 * @desc    Rechazar pedido
 * @access  Private (VENDEDOR, ADMINISTRADOR)
 */
router.put('/:id/rechazar', authenticateToken, requireRole(['VENDEDOR', 'ADMINISTRADOR']), rechazarPedido);

export default router;

