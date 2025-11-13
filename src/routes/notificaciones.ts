import { Router } from 'express';
import * as notificacionController from '../controllers/notificacionController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Obtener notificaciones del usuario
router.get('/', notificacionController.getNotificaciones);

// Obtener resumen de notificaciones
router.get('/resumen', notificacionController.getResumen);

// Marcar una notificación como leída
router.put('/:id/marcar-leida', notificacionController.marcarComoLeida);

// Marcar todas las notificaciones como leídas
router.put('/marcar-todas-leidas', notificacionController.marcarTodasComoLeidas);

// Generar notificaciones automáticas
router.post('/generar', notificacionController.generarNotificaciones);

export default router;

