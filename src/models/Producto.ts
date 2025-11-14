import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface ProductoAttributes {
  id: number;
  codigo_barras?: string;
  codigo_interno: string;
  nombre: string;
  descripcion?: string;
  categoria_id?: number;
  marca_id?: number;
  unidad_medida_id?: number;
  precio_venta: number;
  costo_promedio: number;
  precio_compra: number;
  stock_minimo: number;
  stock_maximo: number;
  punto_reorden: number;
  stock_actual: number;
  peso?: number;
  volumen?: number;
  dimensiones?: string;
  tiene_caducidad: boolean;
  dias_caducidad: number;
  imagen_url?: string;
  activo: boolean;
  fecha_creacion?: Date;
  fecha_actualizacion?: Date;
}

interface ProductoCreationAttributes extends Optional<ProductoAttributes, 'id' | 'activo' | 'fecha_creacion' | 'fecha_actualizacion'> {}

class Producto extends Model<ProductoAttributes, ProductoCreationAttributes> implements ProductoAttributes {
  public id!: number;
  public codigo_barras?: string;
  public codigo_interno!: string;
  public nombre!: string;
  public descripcion?: string;
  public categoria_id?: number;
  public marca_id?: number;
  public unidad_medida_id?: number;
  public precio_venta!: number;
  public costo_promedio!: number;
  public precio_compra!: number;
  public stock_minimo!: number;
  public stock_maximo!: number;
  public punto_reorden!: number;
  public stock_actual!: number;
  public peso?: number;
  public volumen?: number;
  public dimensiones?: string;
  public tiene_caducidad!: boolean;
  public dias_caducidad!: number;
  public imagen_url?: string;
  public activo!: boolean;
  public readonly fecha_creacion!: Date;
  public readonly fecha_actualizacion!: Date;

  // Asociaciones (se definen en index.ts para evitar importaciones circulares)
  public categoria?: any;
  public marca?: any;
  public unidadMedida?: any;
  public detallesVenta?: any[];
  public detallesCompra?: any[];
  public movimientosKardex?: any[];
}

Producto.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    codigo_barras: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true
    },
    codigo_interno: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    nombre: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    categoria_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    marca_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    unidad_medida_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    precio_venta: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    costo_promedio: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    precio_compra: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    stock_minimo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    stock_maximo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    punto_reorden: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    stock_actual: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    peso: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: true,
      defaultValue: 0.000
    },
    volumen: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: true,
      defaultValue: 0.000
    },
    dimensiones: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    tiene_caducidad: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    dias_caducidad: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    imagen_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  },
  {
    sequelize,
    tableName: 'productos',
    timestamps: true,
    createdAt: 'fecha_creacion',
    updatedAt: 'fecha_actualizacion',
    underscored: true
  }
);

export default Producto;
