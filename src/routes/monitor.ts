import { Router } from 'express';
import { listarTransacciones } from '../controllers/monitorController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Requiere autenticación para consultar el monitor
router.get('/', authenticateToken, listarTransacciones);

export default router;

