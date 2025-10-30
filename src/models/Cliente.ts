import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface ClienteAttributes {
  id: number;
  codigo: string;
  nombre: string;
  tipo_documento: 'RUC' | 'DNI' | 'CE' | 'PASAPORTE';
  numero_documento: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  contacto?: string;
  tipo_cliente: 'NATURAL' | 'JURIDICA';
  activo: boolean;
  fecha_creacion?: Date;
  fecha_actualizacion?: Date;
}

interface ClienteCreationAttributes extends Optional<ClienteAttributes, 'id' | 'activo' | 'fecha_creacion' | 'fecha_actualizacion'> {}

class Cliente extends Model<ClienteAttributes, ClienteCreationAttributes> implements ClienteAttributes {
  public id!: number;
  public codigo!: string;
  public nombre!: string;
  public tipo_documento!: 'RUC' | 'DNI' | 'CE' | 'PASAPORTE';
  public numero_documento!: string;
  public direccion?: string;
  public telefono?: string;
  public email?: string;
  public contacto?: string;
  public tipo_cliente!: 'NATURAL' | 'JURIDICA';
  public activo!: boolean;
  public readonly fecha_creacion!: Date;
  public readonly fecha_actualizacion!: Date;
}

Cliente.init(
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
      type: DataTypes.STRING(200),
      allowNull: false
    },
    tipo_documento: {
      type: DataTypes.ENUM('RUC', 'DNI', 'CE', 'PASAPORTE'),
      allowNull: false,
      defaultValue: 'DNI'
    },
    numero_documento: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    direccion: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    telefono: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    contacto: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    tipo_cliente: {
      type: DataTypes.ENUM('NATURAL', 'JURIDICA'),
      allowNull: false,
      defaultValue: 'NATURAL'
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  },
  {
    sequelize,
    tableName: 'clientes',
    timestamps: true,
    createdAt: 'fecha_creacion',
    updatedAt: 'fecha_actualizacion',
    underscored: true
  }
);

export default Cliente;
