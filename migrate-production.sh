#!/bin/bash

# Script para ejecutar migración en Railway
# Base de datos: MySQL en Railway

echo "🚀 Iniciando migración del sistema de roles en Railway..."
echo ""

# Credenciales de Railway
HOST="shortline.proxy.rlwy.net"
PORT="43112"
USER="root"
PASSWORD="xYAOlvsfKbmcuSSDTOFJZmFBxpBVMHOI"
DATABASE="railway"

# Ejecutar el script SQL
mysql -h $HOST -P $PORT -u $USER -p$PASSWORD --protocol=TCP $DATABASE < src/scripts/createRolesTables.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migración completada exitosamente!"
    echo ""
    echo "📋 Tablas creadas:"
    echo "   - cliente_usuario"
    echo "   - pedidos"
    echo "   - detalle_pedidos"
    echo ""
    echo "📝 Columnas agregadas a usuarios:"
    echo "   - rol (ahora incluye CLIENTE)"
    echo "   - es_cliente_publico"
    echo ""
else
    echo ""
    echo "❌ Error al ejecutar la migración"
    exit 1
fi

