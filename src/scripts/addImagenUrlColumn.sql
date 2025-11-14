-- Agregar columna imagen_url a la tabla productos
ALTER TABLE productos 
ADD COLUMN imagen_url VARCHAR(500) NULL COMMENT 'URL de la imagen del producto';

