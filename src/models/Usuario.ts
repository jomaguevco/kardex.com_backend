import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface UsuarioAttributes {
  id: number;
  nombre_usuario: string;
  contrasena: string;
  nombre_completo: string;
  email?: string;
  telefono?: string;
  foto_perfil?: string;
  preferencias?: string;
  rol: 'ADMINISTRADOR' | 'VENDEDOR' | 'CLIENTE' | 'ALMACENERO' | 'CONTADOR';
  es_cliente_publico: boolean;
  activo: boolean;
  fecha_ultimo_acceso?: Date;
  fecha_creacion?: Date;
  fecha_actualizacion?: Date;
}

interface UsuarioCreationAttributes extends Optional<UsuarioAttributes, 'id' | 'es_cliente_publico' | 'activo' | 'fecha_ultimo_acceso' | 'fecha_creacion' | 'fecha_actualizacion'> {}

class Usuario extends Model<UsuarioAttributes, UsuarioCreationAttributes> implements UsuarioAttributes {
  public id!: number;
  public nombre_usuario!: string;
  public contrasena!: string;
  public nombre_completo!: string;
  public email?: string;
  public telefono?: string;
  public foto_perfil?: string;
  public preferencias?: string;
  public rol!: 'ADMINISTRADOR' | 'VENDEDOR' | 'CLIENTE' | 'ALMACENERO' | 'CONTADOR';
  public es_cliente_publico!: boolean;
  public activo!: boolean;
  public fecha_ultimo_acceso?: Date;
  public readonly fecha_creacion!: Date;
  public readonly fecha_actualizacion!: Date;
}

Usuario.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    nombre_usuario: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    contrasena: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    nombre_completo: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true
    },
    telefono: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    foto_perfil: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    preferencias: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    rol: {
      type: DataTypes.ENUM('ADMINISTRADOR', 'VENDEDOR', 'CLIENTE', 'ALMACENERO', 'CONTADOR'),
      allowNull: false,
      defaultValue: 'VENDEDOR',
      comment: 'ALMACENERO y CONTADOR son roles legacy, actualmente se usan: ADMINISTRADOR, VENDEDOR, CLIENTE'
    },
    es_cliente_publico: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Indica si el usuario se registró públicamente como cliente'
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    fecha_ultimo_acceso: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: 'usuarios',
    timestamps: true,
    createdAt: 'fecha_creacion',
    updatedAt: 'fecha_actualizacion',
    underscored: true
  }
);

export default Usuario;
