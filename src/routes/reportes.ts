import { Router } from 'express';
import {
  getReporteVentas,
  getReporteCompras,
  getReporteInventario,
  getReporteRentabilidad,
  getReporteMovimientos
} from '../controllers/reporteController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Rutas
router.get('/ventas', authenticateToken, getReporteVentas);
router.get('/compras', authenticateToken, getReporteCompras);
router.get('/inventario', authenticateToken, getReporteInventario);
router.get('/rentabilidad', authenticateToken, getReporteRentabilidad);
router.get('/movimientos', authenticateToken, getReporteMovimientos);

export default router;

