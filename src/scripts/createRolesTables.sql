-- ================================================================
-- Script para crear tablas del sistema de roles
-- Sistema KARDEX - Gestión Multi-Rol
-- ================================================================

-- Modificar tabla usuarios para agregar campos de cliente
-- Nota: MySQL no soporta IF NOT EXISTS en ALTER TABLE ADD COLUMN
-- El script de migración manejará el error si la columna ya existe
ALTER TABLE usuarios 
ADD COLUMN es_cliente_publico TINYINT(1) DEFAULT 0 COMMENT 'Indica si el usuario se registró públicamente como cliente';

-- Modificar el ENUM de rol para incluir CLIENTE
ALTER TABLE usuarios 
MODIFY COLUMN rol ENUM('ADMINISTRADOR', 'VENDEDOR', 'CLIENTE', 'ALMACENERO', 'CONTADOR') NOT NULL DEFAULT 'VENDEDOR' 
COMMENT 'ALMACENERO y CONTADOR son roles legacy, actualmente se usan: ADMINISTRADOR, VENDEDOR, CLIENTE';

-- ================================================================
-- Tabla: cliente_usuario
-- Descripción: Relación entre clientes y usuarios del sistema
-- ================================================================
CREATE TABLE IF NOT EXISTS cliente_usuario (
  id INT PRIMARY KEY AUTO_INCREMENT,
  usuario_id INT NOT NULL,
  cliente_id INT NOT NULL,
  fecha_vinculacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_usuario (usuario_id),
  UNIQUE KEY unique_cliente (cliente_id),
  
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE ON UPDATE CASCADE,
  
  INDEX idx_usuario (usuario_id),
  INDEX idx_cliente (cliente_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tabla puente entre clientes y usuarios del sistema';

-- ================================================================
-- Tabla: pedidos
-- Descripción: Pedidos realizados por clientes
-- ================================================================
CREATE TABLE IF NOT EXISTS pedidos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  cliente_id INT NOT NULL,
  usuario_id INT NOT NULL COMMENT 'Usuario (cliente) que crea el pedido',
  numero_pedido VARCHAR(50) NOT NULL UNIQUE,
  estado ENUM('PENDIENTE', 'APROBADO', 'PROCESADO', 'CANCELADO', 'RECHAZADO') NOT NULL DEFAULT 'PENDIENTE',
  tipo_pedido ENUM('PEDIDO_APROBACION', 'COMPRA_DIRECTA') NOT NULL DEFAULT 'PEDIDO_APROBACION' 
    COMMENT 'PEDIDO_APROBACION requiere aprobación, COMPRA_DIRECTA se procesa inmediatamente',
  
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  descuento DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  impuesto DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  
  observaciones TEXT,
  fecha_pedido DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  aprobado_por INT NULL COMMENT 'Usuario (vendedor/admin) que aprobó el pedido',
  fecha_aprobacion DATETIME NULL,
  venta_id INT NULL COMMENT 'ID de la venta generada cuando el pedido se procesa',
  motivo_rechazo TEXT NULL,
  
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (aprobado_por) REFERENCES usuarios(id) ON DELETE SET NULL ON UPDATE CASCADE,
  FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE SET NULL ON UPDATE CASCADE,
  
  INDEX idx_cliente (cliente_id),
  INDEX idx_usuario (usuario_id),
  INDEX idx_estado (estado),
  INDEX idx_fecha_pedido (fecha_pedido),
  INDEX idx_numero_pedido (numero_pedido)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Pedidos realizados por clientes del sistema';

-- ================================================================
-- Tabla: detalle_pedidos
-- Descripción: Detalles de productos en cada pedido
-- ================================================================
CREATE TABLE IF NOT EXISTS detalle_pedidos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  pedido_id INT NOT NULL,
  producto_id INT NOT NULL,
  cantidad INT NOT NULL CHECK (cantidad > 0),
  precio_unitario DECIMAL(10,2) NOT NULL,
  descuento DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  subtotal DECIMAL(10,2) NOT NULL,
  
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  
  INDEX idx_pedido (pedido_id),
  INDEX idx_producto (producto_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Detalles de productos en cada pedido';

-- ================================================================
-- Datos de ejemplo (opcional - comentar si no se necesita)
-- ================================================================

-- Crear un cliente de ejemplo que puede ser vinculado a un usuario
-- INSERT INTO clientes (codigo, nombre, tipo_documento, numero_documento, tipo_cliente, activo)
-- VALUES ('CLI-999999', 'Cliente Público Ejemplo', 'DNI', '99999999', 'NATURAL', 1);

-- ================================================================
-- Verificación de las tablas creadas
-- ================================================================
SELECT 'Tablas creadas exitosamente:' AS mensaje;
SHOW TABLES LIKE '%pedido%';
SHOW TABLES LIKE 'cliente_usuario';
SELECT COLUMN_NAME, DATA_TYPE, COLUMN_COMMENT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'usuarios' 
  AND COLUMN_NAME IN ('rol', 'es_cliente_publico');

