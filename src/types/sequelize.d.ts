// Tipos globales para Sequelize y asociaciones
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        nombre_usuario: string;
        nombre: string;
        rol: string;
      };
    }
  }
}

// Tipos para modelos con asociaciones
export interface ModelWithAssociations {
  [key: string]: any;
}

// Tipos específicos para cada modelo
export interface VentaWithAssociations extends ModelWithAssociations {
  detalles?: DetalleVentaWithAssociations[];
  cliente?: ClienteWithAssociations;
  usuario?: UsuarioWithAssociations;
}

export interface DetalleVentaWithAssociations extends ModelWithAssociations {
  venta?: VentaWithAssociations;
  producto?: ProductoWithAssociations;
}

export interface ProductoWithAssociations extends ModelWithAssociations {
  categoria?: CategoriaWithAssociations;
  marca?: MarcaWithAssociations;
  unidadMedida?: UnidadMedidaWithAssociations;
  detallesVenta?: DetalleVentaWithAssociations[];
  detallesCompra?: DetalleCompraWithAssociations[];
  movimientosKardex?: MovimientoKardexWithAssociations[];
}

export interface CompraWithAssociations extends ModelWithAssociations {
  detalles?: DetalleCompraWithAssociations[];
  proveedor?: ProveedorWithAssociations;
  usuario?: UsuarioWithAssociations;
}

export interface DetalleCompraWithAssociations extends ModelWithAssociations {
  compra?: CompraWithAssociations;
  producto?: ProductoWithAssociations;
}

export interface ClienteWithAssociations extends ModelWithAssociations {
  ventas?: VentaWithAssociations[];
}

export interface ProveedorWithAssociations extends ModelWithAssociations {
  compras?: CompraWithAssociations[];
}

export interface UsuarioWithAssociations extends ModelWithAssociations {
  ventas?: VentaWithAssociations[];
  compras?: CompraWithAssociations[];
  movimientos?: MovimientoKardexWithAssociations[];
  movimientosAutorizados?: MovimientoKardexWithAssociations[];
}

export interface MovimientoKardexWithAssociations extends ModelWithAssociations {
  producto?: ProductoWithAssociations;
  almacen?: AlmacenWithAssociations;
  almacenDestino?: AlmacenWithAssociations;
  usuario?: UsuarioWithAssociations;
  autorizadoPor?: UsuarioWithAssociations;
  tipoMovimiento?: TipoMovimientoKardexWithAssociations;
}

export interface TipoMovimientoKardexWithAssociations extends ModelWithAssociations {
  movimientos?: MovimientoKardexWithAssociations[];
}

export interface AlmacenWithAssociations extends ModelWithAssociations {
  movimientosOrigen?: MovimientoKardexWithAssociations[];
  movimientosDestino?: MovimientoKardexWithAssociations[];
}

export interface CategoriaWithAssociations extends ModelWithAssociations {
  productos?: ProductoWithAssociations[];
}

export interface MarcaWithAssociations extends ModelWithAssociations {
  productos?: ProductoWithAssociations[];
}

export interface UnidadMedidaWithAssociations extends ModelWithAssociations {
  productos?: ProductoWithAssociations[];
}

export {};
