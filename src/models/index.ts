import sequelize from '../config/database';
import Usuario from './Usuario';
import Producto from './Producto';
import Venta from './Venta';
import DetalleVenta from './DetalleVenta';
import Compra from './Compra';
import DetalleCompra from './DetalleCompra';
import Cliente from './Cliente';
import Proveedor from './Proveedor';
import MovimientoKardex from './MovimientoKardex';
import TipoMovimientoKardex from './TipoMovimientoKardex';
import Almacen from './Almacen';
import Categoria from './Categoria';
import Marca from './Marca';
import UnidadMedida from './UnidadMedida';
import PasswordResetToken from './PasswordResetToken';
import MonitoreoTransaccion from './MonitoreoTransaccion';
import Notificacion from './Notificacion';
import ClienteUsuario from './ClienteUsuario';
import Pedido from './Pedido';
import DetallePedido from './DetallePedido';

// Definir asociaciones
// Usuario
Usuario.hasMany(Venta, { foreignKey: 'usuario_id', as: 'ventas' });
Usuario.hasMany(Compra, { foreignKey: 'usuario_id', as: 'compras' });
Usuario.hasMany(MovimientoKardex, { foreignKey: 'usuario_id', as: 'movimientos' });
Usuario.hasMany(MovimientoKardex, { foreignKey: 'autorizado_por', as: 'movimientosAutorizados' });
Usuario.hasMany(PasswordResetToken, { foreignKey: 'usuario_id', as: 'passwordResetTokens' });
Usuario.hasMany(Notificacion, { foreignKey: 'usuario_id', as: 'notificaciones' });
Usuario.hasOne(ClienteUsuario, { foreignKey: 'usuario_id', as: 'clienteUsuario' });
Usuario.hasMany(Pedido, { foreignKey: 'usuario_id', as: 'pedidos' });
Usuario.hasMany(Pedido, { foreignKey: 'aprobado_por', as: 'pedidosAprobados' });

// Producto
Producto.belongsTo(Categoria, { foreignKey: 'categoria_id', as: 'categoria' });
Producto.belongsTo(Marca, { foreignKey: 'marca_id', as: 'marca' });
Producto.belongsTo(UnidadMedida, { foreignKey: 'unidad_medida_id', as: 'unidadMedida' });
Producto.hasMany(DetalleVenta, { foreignKey: 'producto_id', as: 'detallesVenta' });
Producto.hasMany(DetalleCompra, { foreignKey: 'producto_id', as: 'detallesCompra' });
Producto.hasMany(MovimientoKardex, { foreignKey: 'producto_id', as: 'movimientosKardex' });
Producto.hasMany(DetallePedido, { foreignKey: 'producto_id', as: 'detallesPedido' });

// Venta
Venta.belongsTo(Cliente, { foreignKey: 'cliente_id', as: 'cliente' });
Venta.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
Venta.hasMany(DetalleVenta, { foreignKey: 'venta_id', as: 'detalles' });

// DetalleVenta
DetalleVenta.belongsTo(Venta, { foreignKey: 'venta_id', as: 'venta' });
DetalleVenta.belongsTo(Producto, { foreignKey: 'producto_id', as: 'producto' });

// Compra
Compra.belongsTo(Proveedor, { foreignKey: 'proveedor_id', as: 'proveedor' });
Compra.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
Compra.hasMany(DetalleCompra, { foreignKey: 'compra_id', as: 'detalles' });

// DetalleCompra
DetalleCompra.belongsTo(Compra, { foreignKey: 'compra_id', as: 'compra' });
DetalleCompra.belongsTo(Producto, { foreignKey: 'producto_id', as: 'producto' });

// Cliente
Cliente.hasMany(Venta, { foreignKey: 'cliente_id', as: 'ventas' });
Cliente.hasOne(ClienteUsuario, { foreignKey: 'cliente_id', as: 'clienteUsuario' });
Cliente.hasMany(Pedido, { foreignKey: 'cliente_id', as: 'pedidos' });

// Proveedor
Proveedor.hasMany(Compra, { foreignKey: 'proveedor_id', as: 'compras' });

// MovimientoKardex
MovimientoKardex.belongsTo(Producto, { foreignKey: 'producto_id', as: 'producto' });
MovimientoKardex.belongsTo(Almacen, { foreignKey: 'almacen_id', as: 'almacen' });
MovimientoKardex.belongsTo(Almacen, { foreignKey: 'almacen_destino_id', as: 'almacenDestino' });
MovimientoKardex.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
MovimientoKardex.belongsTo(Usuario, { foreignKey: 'autorizado_por', as: 'autorizadoPor' });
MovimientoKardex.belongsTo(TipoMovimientoKardex, { foreignKey: 'tipo_movimiento_id', as: 'tipoMovimiento' });

// TipoMovimientoKardex
TipoMovimientoKardex.hasMany(MovimientoKardex, { foreignKey: 'tipo_movimiento_id', as: 'movimientos' });

// Almacen
Almacen.hasMany(MovimientoKardex, { foreignKey: 'almacen_id', as: 'movimientosOrigen' });
Almacen.hasMany(MovimientoKardex, { foreignKey: 'almacen_destino_id', as: 'movimientosDestino' });

// Categoria
Categoria.hasMany(Producto, { foreignKey: 'categoria_id', as: 'productos' });

// Marca
Marca.hasMany(Producto, { foreignKey: 'marca_id', as: 'productos' });

// UnidadMedida
UnidadMedida.hasMany(Producto, { foreignKey: 'unidad_medida_id', as: 'productos' });

// Sincronizar modelos con la base de datos
sequelize.sync({ alter: false });

// PasswordResetToken
PasswordResetToken.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

// Notificacion
Notificacion.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

// ClienteUsuario
ClienteUsuario.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
ClienteUsuario.belongsTo(Cliente, { foreignKey: 'cliente_id', as: 'cliente' });

// Pedido
Pedido.belongsTo(Cliente, { foreignKey: 'cliente_id', as: 'cliente' });
Pedido.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
Pedido.belongsTo(Usuario, { foreignKey: 'aprobado_por', as: 'aprobador' });
Pedido.belongsTo(Venta, { foreignKey: 'venta_id', as: 'venta' });
Pedido.hasMany(DetallePedido, { foreignKey: 'pedido_id', as: 'detalles' });

// DetallePedido
DetallePedido.belongsTo(Pedido, { foreignKey: 'pedido_id', as: 'pedido' });
DetallePedido.belongsTo(Producto, { foreignKey: 'producto_id', as: 'producto' });

export {
  sequelize,
  Usuario,
  Producto,
  Venta,
  DetalleVenta,
  Compra,
  DetalleCompra,
  Cliente,
  Proveedor,
  MovimientoKardex,
  TipoMovimientoKardex,
  Almacen,
  Categoria,
  Marca,
  UnidadMedida,
  PasswordResetToken,
  MonitoreoTransaccion,
  Notificacion,
  ClienteUsuario,
  Pedido,
  DetallePedido
};
