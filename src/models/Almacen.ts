import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface AlmacenAttributes {
  id: number;
  codigo: string;
  nombre: string;
  direccion?: string;
  responsable?: string;
  telefono?: string;
  activo: boolean;
  fecha_creacion?: Date;
  fecha_actualizacion?: Date;
}

interface AlmacenCreationAttributes extends Optional<AlmacenAttributes, 'id' | 'activo' | 'fecha_creacion' | 'fecha_actualizacion'> {}

class Almacen extends Model<AlmacenAttributes, AlmacenCreationAttributes> implements AlmacenAttributes {
  public id!: number;
  public codigo!: string;
  public nombre!: string;
  public direccion?: string;
  public responsable?: string;
  public telefono?: string;
  public activo!: boolean;
  public readonly fecha_creacion!: Date;
  public readonly fecha_actualizacion!: Date;
}

Almacen.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    codigo: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    direccion: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    responsable: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    telefono: {
      type: DataTypes.STRING(20),
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
    tableName: 'almacenes',
    timestamps: true,
    createdAt: 'fecha_creacion',
    updatedAt: 'fecha_actualizacion',
    underscored: true
  }
);

export default Almacen;
