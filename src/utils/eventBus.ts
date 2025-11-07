import { EventEmitter } from 'events';

/**
 * EventBus actúa como un Message Oriented Middleware ligero.
 * Permite desacoplar productores (servicios) y consumidores (monitores)
 * mediante eventos asincrónicos.
 */
class EventBus extends EventEmitter {}

const eventBus = new EventBus();

export default eventBus;

