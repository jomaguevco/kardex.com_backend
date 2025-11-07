# Implementación de Mediación, Monitoreo de Transacciones y Arquitectura Orientada a Servicios

Este documento resume los ajustes realizados para cumplir con los puntos **2.8** y **2.9** del temario solicitado.

## 2.8 Servicios de lógica de mediación y Message Oriented Middleware

- **Middleware de mediación (`src/middleware/mediator.ts`)**: intercepta todas las peticiones, genera un `requestId`, clasifica el servicio invocado y emite eventos a través del bus interno. Esto representa la lógica de mediación de acceso a datos y prepara la información para el resto de la cadena.
- **Bus de eventos (`src/utils/eventBus.ts`)**: se añadió un `EventEmitter` centralizado que opera como *Message Oriented Middleware* ligero. Los servicios publican eventos y los monitores se suscriben sin acoplamiento directo.
- **Suscriptores (`src/index.ts`)**: el servidor escucha los eventos `mediator:*` y `monitor:*` para registrar actividad y tiempos de respuesta.

## 2.8 Monitores de procesamiento de transacciones

- **Modelo `MonitoreoTransaccion`** (`src/models/MonitoreoTransaccion.ts`): guarda inicio, fin, estado, duración y metadatos de cada operación crítica.
- **Servicio `transactionMonitor`** (`src/services/transactionMonitor.ts`): expone funciones `iniciarMonitoreo` y `finalizarMonitoreo` que encapsulan la lógica de registro.
- **Integración en ventas** (`src/controllers/ventaController.ts`): las operaciones de creación y anulación de ventas ahora registran su ciclo completo en el monitor, incluyendo errores.
- **Endpoint de consulta** (`src/routes/monitor.ts`): permite revisar el historial de transacciones registradas de forma autenticada.

## 2.9 Arquitectura orientada a servicios

- **API segmentada por dominios** (`src/routes/index.ts`): cada módulo (ventas, compras, monitor, etc.) se expone como un servicio especializado dentro del mismo backend. El nuevo monitor mantiene la consistencia del enfoque.
- **Frontend desacoplado** (`kardex.com/src/app/dashboard/page.tsx`): el tablero consume el servicio de monitoreo vía `monitorService`, mostrando evidencia visual del flujo orientado a servicios y de la mediación aplicada.

## Cómo demostrarlo

1. Realiza una venta o una anulación desde el sistema.
2. Visita el tablero (`/dashboard`) e ingresa con un usuario autorizado: verás la tarjeta de “Monitor de Transacciones” con los últimos eventos.
3. Desde herramientas como Postman, puedes consultar `GET /api/monitor-transacciones` (con token) para revisar el log detallado.

Estos cambios incorporan mediación, mensajería orientada a eventos y monitoreo transaccional sin añadir complejidad excesiva, cumpliendo los requisitos académicos solicitados.

