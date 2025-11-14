# Sistema de Roles - Resumen de Implementación

## 🎯 Objetivo Completado

Se ha implementado exitosamente un sistema completo de control de acceso basado en roles (RBAC) para el Sistema KARDEX, diferenciando tres roles principales: **ADMINISTRADOR**, **VENDEDOR** y **CLIENTE**.

---

## 📊 Arquitectura del Sistema

### Roles Implementados

| Rol | Descripción | Acceso |
|-----|-------------|--------|
| **ADMINISTRADOR** | Control total del sistema | Todos los módulos y funcionalidades |
| **VENDEDOR** | Gestión de ventas y clientes | Ventas (propias), Clientes, Productos (lectura), Pedidos (aprobar) |
| **CLIENTE** | Portal de autoservicio | Catálogo, Mis Compras, Pedidos, Facturas, Estado de Cuenta |
| ALMACENERO* | Legacy (futuro) | Productos, Compras, KARDEX |
| CONTADOR* | Legacy (futuro) | Ventas, Compras, Reportes |

*Roles mantenidos en el sistema pero no activamente utilizados

---

## 🗄️ Base de Datos

### Tablas Nuevas

#### 1. `cliente_usuario`
Relación entre clientes del sistema y usuarios con login.

```sql
CREATE TABLE cliente_usuario (
  id INT PRIMARY KEY AUTO_INCREMENT,
  usuario_id INT NOT NULL UNIQUE,
  cliente_id INT NOT NULL UNIQUE,
  fecha_vinculacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  FOREIGN KEY (cliente_id) REFERENCES clientes(id)
);
```

#### 2. `pedidos`
Pedidos realizados por clientes que requieren aprobación de vendedores.

```sql
CREATE TABLE pedidos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  cliente_id INT NOT NULL,
  usuario_id INT NOT NULL,
  numero_pedido VARCHAR(50) UNIQUE NOT NULL,
  estado ENUM('PENDIENTE', 'APROBADO', 'PROCESADO', 'CANCELADO', 'RECHAZADO'),
  tipo_pedido ENUM('PEDIDO_APROBACION', 'COMPRA_DIRECTA'),
  subtotal DECIMAL(10,2),
  descuento DECIMAL(10,2),
  impuesto DECIMAL(10,2),
  total DECIMAL(10,2),
  observaciones TEXT,
  fecha_pedido DATE,
  aprobado_por INT,
  fecha_aprobacion DATETIME,
  venta_id INT,
  motivo_rechazo VARCHAR(500)
);
```

#### 3. `detalle_pedidos`
Detalles de productos en cada pedido.

```sql
CREATE TABLE detalle_pedidos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  pedido_id INT NOT NULL,
  producto_id INT NOT NULL,
  cantidad INT NOT NULL,
  precio_unitario DECIMAL(10,2),
  subtotal DECIMAL(10,2),
  observaciones TEXT,
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
  FOREIGN KEY (producto_id) REFERENCES productos(id)
);
```

### Modificaciones a Tablas Existentes

#### Tabla `usuarios`

```sql
-- Nueva columna
ALTER TABLE usuarios 
ADD COLUMN es_cliente_publico TINYINT(1) DEFAULT 0;

-- Enum actualizado
ALTER TABLE usuarios 
MODIFY COLUMN rol ENUM('ADMINISTRADOR', 'VENDEDOR', 'CLIENTE', 'ALMACENERO', 'CONTADOR');
```

---

## 🔐 Sistema de Permisos

### Matriz de Permisos

```typescript
const PERMISSIONS = {
  ADMINISTRADOR: [
    'admin:all',
    'productos:*', 'ventas:*', 'compras:*', 
    'clientes:*', 'proveedores:*', 'kardex:*',
    'reportes:*', 'usuarios:*', 'notificaciones:*',
    'pedidos:*', 'cliente_portal:all'
  ],
  
  VENDEDOR: [
    'ventas:read', 'ventas:write',
    'productos:read',
    'clientes:read', 'clientes:write',
    'pedidos:read', 'pedidos:approve', 'pedidos:reject',
    'notificaciones:read'
  ],
  
  CLIENTE: [
    'cliente_portal:read_profile', 'cliente_portal:update_profile',
    'cliente_portal:read_compras', 'cliente_portal:read_facturas',
    'cliente_portal:read_catalogo', 'cliente_portal:create_pedido',
    'cliente_portal:read_pedidos', 'cliente_portal:cancel_pedido',
    'notificaciones:read'
  ]
};
```

### Middleware de Autorización

```typescript
// Verificar rol
export const requireRole = (roles: UserRole[]) => {
  return (req, res, next) => {
    if (roles.includes(req.user.rol)) {
      next();
    } else {
      res.status(403).json({ message: 'No autorizado' });
    }
  };
};

// Verificar permiso específico
export const requirePermission = (permission: string) => {
  return (req, res, next) => {
    const userPermissions = getRolePermissions(req.user.rol);
    if (userPermissions.includes(permission) || userPermissions.includes('admin:all')) {
      next();
    } else {
      res.status(403).json({ message: 'No tienes permisos' });
    }
  };
};
```

---

## 🛣️ Endpoints del API

### Autenticación

```
POST   /api/auth/login                    - Login universal
POST   /api/auth/register-cliente         - Registro público de clientes
POST   /api/auth/logout                   - Cerrar sesión
GET    /api/auth/me                       - Obtener usuario actual
GET    /api/auth/permissions              - Obtener permisos del usuario
```

### Portal de Cliente

```
GET    /api/cliente-portal/mis-compras         - Historial de compras
GET    /api/cliente-portal/catalogo            - Catálogo de productos
GET    /api/cliente-portal/mis-facturas        - Facturas del cliente
GET    /api/cliente-portal/estado-cuenta       - Dashboard y estadísticas
GET    /api/cliente-portal/factura/:id         - Detalle de factura
```

### Gestión de Pedidos

```
POST   /api/pedidos                       - Crear pedido (Cliente)
GET    /api/pedidos/mis-pedidos           - Mis pedidos (Cliente)
GET    /api/pedidos/pendientes            - Pedidos pendientes (Vendedor/Admin)
GET    /api/pedidos/:id                   - Detalle de pedido
PUT    /api/pedidos/:id/aprobar           - Aprobar pedido (Vendedor/Admin)
PUT    /api/pedidos/:id/rechazar          - Rechazar pedido (Vendedor/Admin)
PUT    /api/pedidos/:id/cancelar          - Cancelar pedido (Cliente)
```

### Ventas (Filtrado por Rol)

```
GET    /api/ventas                        - Listar ventas
                                            * Admin: todas las ventas
                                            * Vendedor: solo sus ventas
POST   /api/ventas                        - Crear venta (Admin/Vendedor)
GET    /api/ventas/:id                    - Detalle de venta
PUT    /api/ventas/:id                    - Actualizar venta
DELETE /api/ventas/:id                    - Anular venta
```

---

## 🎨 Frontend - Rutas y Componentes

### Rutas Públicas

```
/                  - Login
/registro          - Registro de clientes
/forgot-password   - Recuperar contraseña
/reset-password    - Restablecer contraseña
```

### Rutas de Administrador

```
/dashboard         - Dashboard principal
/productos         - Gestión de productos
/ventas            - Gestión de ventas
/compras           - Gestión de compras
/kardex            - Movimientos de inventario
/clientes          - Gestión de clientes
/proveedores       - Gestión de proveedores
/reportes          - Reportes y análisis
/perfil            - Perfil de usuario
/configuracion     - Configuración del sistema
```

### Rutas de Vendedor

```
/dashboard         - Dashboard (métricas propias)
/ventas            - Sus ventas únicamente
/clientes          - Gestión de clientes
/productos         - Catálogo (solo lectura)
/reportes          - Reportes de sus ventas
/perfil            - Perfil de usuario
```

### Rutas de Cliente

```
/cliente-portal                - Dashboard del cliente
/cliente-portal/mis-compras    - Historial de compras
/cliente-portal/catalogo       - Catálogo de productos
/cliente-portal/pedidos        - Mis pedidos
/cliente-portal/facturas       - Mis facturas
/cliente-portal/estado-cuenta  - Estadísticas y análisis
/perfil                        - Perfil de usuario
```

### Componentes Principales

#### Sidebar Dinámico
```typescript
// src/components/layout/Sidebar.tsx
// Se adapta automáticamente según el rol del usuario
const menuItems = allMenuItems.filter(item => 
  user?.rol && item.roles.includes(user.rol)
);
```

#### Protección de Rutas
```typescript
// src/hooks/usePermissions.ts
export const usePermissions = () => {
  const { permisos } = useAuthStore();
  
  const hasPermission = (permission: string) => {
    return permisos?.includes(permission) || permisos?.includes('admin:all');
  };
  
  return { hasPermission };
};
```

#### Redirección por Rol
```typescript
// src/store/authStore.ts
getRedirectPath: () => {
  const { user } = get();
  switch (user?.rol) {
    case 'ADMINISTRADOR': return '/dashboard';
    case 'VENDEDOR': return '/ventas';
    case 'CLIENTE': return '/cliente-portal';
    default: return '/';
  }
}
```

---

## 🔄 Flujo de Trabajo

### Registro de Cliente

1. Cliente accede a `/registro`
2. Completa formulario (nombre, email, teléfono, documento, contraseña)
3. Sistema crea:
   - Registro en tabla `clientes`
   - Registro en tabla `usuarios` (rol: CLIENTE)
   - Vinculación en tabla `cliente_usuario`
4. Cliente puede hacer login inmediatamente

### Creación de Pedido

1. Cliente navega al catálogo
2. Agrega productos al carrito
3. Crea pedido con estado `PENDIENTE`
4. Vendedor recibe notificación
5. Vendedor aprueba o rechaza pedido
6. Si aprueba: se genera venta automáticamente
7. Cliente recibe notificación del estado

### Venta por Vendedor

1. Vendedor crea venta en `/ventas`
2. Sistema registra `usuario_id` del vendedor
3. En listado de ventas:
   - Admin ve todas las ventas
   - Vendedor solo ve sus propias ventas (filtro automático)

---

## 📈 Estadísticas del Sistema

### Código Implementado

- **Backend:**
  - 2 nuevos controllers (clientePortalController, pedidoController)
  - 3 nuevos modelos (ClienteUsuario, Pedido, DetallePedido)
  - 1 middleware de permisos (permissions.ts)
  - 2 nuevos módulos de rutas
  - ~1,500 líneas de código

- **Frontend:**
  - 6 páginas del portal de cliente
  - 1 página de registro público
  - 2 services (clientePortalService, pedidoService)
  - 1 hook de permisos (usePermissions)
  - Sidebar dinámico
  - ~2,000 líneas de código

- **Base de Datos:**
  - 3 tablas nuevas
  - 2 columnas modificadas en usuarios
  - 1 script de migración

### Funcionalidades

- ✅ 3 roles principales implementados
- ✅ Sistema de permisos granular
- ✅ Registro público de clientes
- ✅ Portal completo de cliente (6 páginas)
- ✅ Sistema de pedidos con aprobación
- ✅ Filtrado automático por rol
- ✅ Redirección automática según rol
- ✅ Sidebar dinámico
- ✅ Protección de rutas y endpoints
- ✅ Documentación completa

---

## 🚀 Deployment

### Estado Actual

- ✅ Backend desplegado en Railway
- ✅ Frontend desplegado en Vercel
- ✅ Base de datos migrada correctamente
- ✅ Variables de entorno configuradas
- ✅ Sistema funcionando en producción

### URLs

- **Frontend:** https://kardex-com.vercel.app
- **Backend:** https://kardexaplicacion.up.railway.app
- **API Docs:** https://kardexaplicacion.up.railway.app/api

---

## 👥 Usuarios Demo

```
ADMINISTRADOR:
Usuario: admin
Contraseña: admin123
Acceso: Completo

VENDEDOR:
Usuario: vendedor1
Contraseña: vendedor123
Acceso: Ventas, Clientes, Productos (lectura)

Usuario: vendedor2
Contraseña: vendedor123
Acceso: Ventas, Clientes, Productos (lectura)

CLIENTE:
Registro público en: /registro
Acceso: Portal de cliente
```

---

## 📝 Próximos Pasos (Opcional)

### Mejoras Futuras

1. **Página de Aprobación de Pedidos para Vendedores**
   - Vista dedicada en `/pedidos-pendientes`
   - Filtros por estado y fecha
   - Acciones rápidas de aprobar/rechazar

2. **Dashboard Mejorado por Rol**
   - Métricas específicas para cada rol
   - Gráficos interactivos
   - Comparativas temporales

3. **Sistema de Notificaciones en Tiempo Real**
   - WebSockets para notificaciones push
   - Alertas de pedidos pendientes
   - Notificaciones de stock bajo

4. **Integración con Chatbot**
   - Preparado para integración futura
   - Endpoint `/api/chatbot` reservado
   - Contexto de cliente disponible

5. **Reportes Avanzados**
   - Exportación a PDF/Excel
   - Reportes personalizados por rol
   - Análisis predictivo

---

## 🎉 Conclusión

El sistema de roles está **100% funcional** y desplegado en producción. Todos los objetivos principales fueron alcanzados:

- ✅ Control de acceso basado en roles
- ✅ Portal completo de cliente
- ✅ Sistema de pedidos con aprobación
- ✅ Filtrado automático por rol
- ✅ Registro público de clientes
- ✅ Documentación completa
- ✅ Deployment exitoso

El sistema está listo para ser utilizado y puede ser extendido fácilmente con nuevas funcionalidades.

---

**Fecha de Implementación:** 14 de Noviembre, 2025
**Versión:** 1.0.0
**Estado:** ✅ Producción

