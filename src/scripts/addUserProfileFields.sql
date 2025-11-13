-- Agregar campos de foto_perfil y preferencias a la tabla usuarios
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS foto_perfil VARCHAR(500) NULL AFTER telefono,
ADD COLUMN IF NOT EXISTS preferencias TEXT NULL AFTER foto_perfil;

