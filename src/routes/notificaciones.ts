import { Router } from 'express';
import * as notificacionController from '../controllers/notificacionController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Ruta especial para notificaciones desde WhatsApp (sin autenticación normal, requiere token especial)
router.post('/whatsapp', notificacionController.notificarPedidoWhatsApp);

// Todas las demás rutas requieren autenticación
router.use(authenticateToken);

// Obtener notificaciones del usuario
router.get('/', notificacionController.getNotificaciones);

// Obtener resumen de notificaciones
router.get('/resumen', notificacionController.getResumen);

// Marcar una notificación como leída
router.put('/:id/leer', notificacionController.marcarComoLeida);

// Marcar todas las notificaciones como leídas
router.put('/leer-todas', notificacionController.marcarTodasComoLeidas);

// Eliminar una notificación del usuario
router.delete('/:id', notificacionController.eliminarNotificacion);

// Generar notificaciones automáticas
router.post('/generar', notificacionController.generarNotificaciones);

export default router;

