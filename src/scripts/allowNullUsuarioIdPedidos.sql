-- ================================================================
-- Migración: Permitir usuario_id NULL en pedidos
-- Descripción: Permite que pedidos desde WhatsApp tengan usuario_id null
-- Fecha: 2024
-- ================================================================

-- Modificar la columna usuario_id para permitir NULL
ALTER TABLE pedidos 
MODIFY COLUMN usuario_id INT NULL COMMENT 'Usuario (cliente) que crea el pedido. Null para pedidos desde WhatsApp';

-- Eliminar la foreign key constraint antigua (si existe)
ALTER TABLE pedidos 
DROP FOREIGN KEY IF EXISTS pedidos_ibfk_2;

-- Agregar nueva foreign key que permite NULL
ALTER TABLE pedidos 
ADD CONSTRAINT pedidos_usuario_id_fk 
FOREIGN KEY (usuario_id) REFERENCES usuarios(id) 
ON DELETE SET NULL ON UPDATE CASCADE;

