-- Migración: Agregar campos de pago y envío a la tabla pedidos
-- Agregar estados PAGADO y EN_CAMINO al enum de estados

-- Primero, modificar el enum de estados
ALTER TABLE pedidos 
  MODIFY COLUMN estado ENUM('PENDIENTE', 'EN_PROCESO', 'APROBADO', 'PAGADO', 'PROCESADO', 'EN_CAMINO', 'CANCELADO', 'RECHAZADO') 
  NOT NULL DEFAULT 'PENDIENTE';

-- Agregar campos de pago
ALTER TABLE pedidos 
  ADD COLUMN metodo_pago VARCHAR(50) NULL COMMENT 'Método de pago: EFECTIVO, TARJETA, TRANSFERENCIA, YAPE, PLIN',
  ADD COLUMN fecha_pago DATETIME NULL COMMENT 'Fecha en que se realizó el pago',
  ADD COLUMN comprobante_pago TEXT NULL COMMENT 'URL o ruta del comprobante de pago (imagen)',
  ADD COLUMN fecha_envio DATETIME NULL COMMENT 'Fecha en que se procesó el envío del pedido';

