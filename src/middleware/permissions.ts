import { Request, Response, NextFunction } from 'express';

// Tipos de roles en el sistema
export type UserRole = 'ADMINISTRADOR' | 'VENDEDOR' | 'CLIENTE' | 'ALMACENERO' | 'CONTADOR';

// Recursos del sistema
export type Resource = 
  | 'productos' 
  | 'ventas' 
  | 'compras' 
  | 'clientes' 
  | 'proveedores' 
  | 'reportes' 
  | 'kardex'
  | 'usuarios'
  | 'configuracion'
  | 'pedidos'
  | 'catalogo';

// Acciones posibles
export type Action = 'create' | 'read' | 'update' | 'delete' | 'approve';

// Matriz de permisos: Define qué rol puede realizar qué acción en qué recurso
const permissionsMatrix: Record<UserRole, Record<Resource, Action[]>> = {
  ADMINISTRADOR: {
    productos: ['create', 'read', 'update', 'delete'],
    ventas: ['create', 'read', 'update', 'delete'],
    compras: ['create', 'read', 'update', 'delete'],
    clientes: ['create', 'read', 'update', 'delete'],
    proveedores: ['create', 'read', 'update', 'delete'],
    reportes: ['read'],
    kardex: ['read'],
    usuarios: ['create', 'read', 'update', 'delete'],
    configuracion: ['read', 'update'],
    pedidos: ['read', 'approve', 'delete'],
    catalogo: ['read']
  },
  VENDEDOR: {
    productos: ['read'],
    ventas: ['create', 'read'], // Solo sus propias ventas
    compras: [],
    clientes: ['read'],
    proveedores: [],
    reportes: ['read'], // Solo sus propios reportes
    kardex: [],
    usuarios: [],
    configuracion: [],
    pedidos: ['read', 'approve'],
    catalogo: ['read']
  },
  CLIENTE: {
    productos: [],
    ventas: [], // No accede directamente a ventas
    compras: [],
    clientes: [],
    proveedores: [],
    reportes: [],
    kardex: [],
    usuarios: [],
    configuracion: [],
    pedidos: ['create', 'read'], // Sus propios pedidos
    catalogo: ['read']
  },
  // Roles legacy - sin permisos activos
  ALMACENERO: {
    productos: ['read'],
    ventas: [],
    compras: ['read'],
    clientes: [],
    proveedores: [],
    reportes: [],
    kardex: ['read'],
    usuarios: [],
    configuracion: [],
    pedidos: [],
    catalogo: []
  },
  CONTADOR: {
    productos: ['read'],
    ventas: ['read'],
    compras: ['read'],
    clientes: ['read'],
    proveedores: ['read'],
    reportes: ['read'],
    kardex: ['read'],
    usuarios: [],
    configuracion: [],
    pedidos: ['read'],
    catalogo: []
  }
};

/**
 * Middleware para requerir un rol específico o varios roles
 */
export const requireRole = (roles: UserRole | UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user;

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
      return;
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(user.rol)) {
      res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a este recurso',
        required: allowedRoles,
        current: user.rol
      });
      return;
    }

    next();
  };
};

/**
 * Verifica si el usuario tiene permiso para realizar una acción en un recurso
 */
export const canAccessResource = (role: UserRole, resource: Resource, action: Action): boolean => {
  const permissions = permissionsMatrix[role]?.[resource];
  return permissions ? permissions.includes(action) : false;
};

/**
 * Middleware para verificar permisos específicos de recurso y acción
 */
export const requirePermission = (resource: Resource, action: Action) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user;

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
      return;
    }

    if (!canAccessResource(user.rol, resource, action)) {
      res.status(403).json({
        success: false,
        message: `No tienes permisos para ${action} en ${resource}`,
        role: user.rol,
        resource,
        action
      });
      return;
    }

    next();
  };
};

/**
 * Helper: Verifica si el usuario es administrador
 */
export const isAdmin = (req: Request): boolean => {
  const user = (req as any).user;
  return user && user.rol === 'ADMINISTRADOR';
};

/**
 * Helper: Verifica si el usuario es vendedor
 */
export const isVendedor = (req: Request): boolean => {
  const user = (req as any).user;
  return user && user.rol === 'VENDEDOR';
};

/**
 * Helper: Verifica si el usuario es cliente
 */
export const isCliente = (req: Request): boolean => {
  const user = (req as any).user;
  return user && user.rol === 'CLIENTE';
};

/**
 * Middleware para verificar que el recurso pertenece al usuario
 * Útil para vendedores que solo pueden ver sus propias ventas
 */
export const requireOwnership = (resourceField: string = 'usuario_id') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user;

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
      return;
    }

    // Los administradores tienen acceso a todo
    if (isAdmin(req)) {
      next();
      return;
    }

    // Para otros roles, verificar ownership en el controller
    // Este middleware solo marca que se debe verificar
    (req as any).requireOwnership = {
      field: resourceField,
      userId: user.id
    };
    
    next();
  };
};

/**
 * Obtiene todos los permisos de un rol
 */
export const getRolePermissions = (role: UserRole): Record<Resource, Action[]> => {
  return permissionsMatrix[role] || {};
};

/**
 * Middleware: Solo permite acceso a clientes públicos (auto-registrados)
 */
export const requirePublicClient = (req: Request, res: Response, next: NextFunction): void => {
  const user = (req as any).user;

  if (!user) {
    res.status(401).json({
      success: false,
      message: 'No autenticado'
    });
    return;
  }

  if (user.rol !== 'CLIENTE' || !user.es_cliente_publico) {
    res.status(403).json({
      success: false,
      message: 'Acceso solo para clientes registrados'
    });
    return;
  }

  next();
};

export default {
  requireRole,
  requirePermission,
  canAccessResource,
  isAdmin,
  isVendedor,
  isCliente,
  requireOwnership,
  getRolePermissions,
  requirePublicClient
};

