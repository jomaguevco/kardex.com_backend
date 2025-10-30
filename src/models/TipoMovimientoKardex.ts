import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface TipoMovimientoKardexAttributes {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipo_operacion: 'ENTRADA' | 'SALIDA' | 'TRANSFERENCIA';
  afecta_stock: boolean;
  requiere_documento: boolean;
  requiere_autorizacion: boolean;
  activo: boolean;
  fecha_creacion?: Date;
  fecha_actualizacion?: Date;
}

interface TipoMovimientoKardexCreationAttributes extends Optional<TipoMovimientoKardexAttributes, 'id' | 'activo' | 'fecha_creacion' | 'fecha_actualizacion'> {}

class TipoMovimientoKardex extends Model<TipoMovimientoKardexAttributes, TipoMovimientoKardexCreationAttributes> implements TipoMovimientoKardexAttributes {
  public id!: number;
  public codigo!: string;
  public nombre!: string;
  public descripcion?: string;
  public tipo_operacion!: 'ENTRADA' | 'SALIDA' | 'TRANSFERENCIA';
  public afecta_stock!: boolean;
  public requiere_documento!: boolean;
  public requiere_autorizacion!: boolean;
  public activo!: boolean;
  public readonly fecha_creacion!: Date;
  public readonly fecha_actualizacion!: Date;
}

TipoMovimientoKardex.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    codigo: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    tipo_operacion: {
      type: DataTypes.ENUM('ENTRADA', 'SALIDA', 'TRANSFERENCIA'),
      allowNull: false
    },
    afecta_stock: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    requiere_documento: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    requiere_autorizacion: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  },
  {
    sequelize,
    tableName: 'tipos_movimiento_kardex',
    timestamps: true,
    createdAt: 'fecha_creacion',
    updatedAt: 'fecha_actualizacion',
    underscored: true
  }
);

export default TipoMovimientoKardex;
