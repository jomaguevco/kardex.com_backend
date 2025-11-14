# Checklist de Deployment - Sistema KARDEX

## 📋 Resumen

Este documento contiene todos los pasos necesarios para desplegar el sistema KARDEX en producción, incluyendo backend (Railway), frontend (Vercel) y base de datos (MySQL en Railway).

---

## 🚀 Backend - Railway

### Requisitos Previos
- Cuenta de Railway activa
- Repositorio GitHub conectado a Railway
- Base de datos MySQL provisionada en Railway

### Variables de Entorno Requeridas

```env
# Base de datos (auto-generadas por Railway)
DB_HOST=shortline.proxy.rlwy.net
DB_PORT=43112
DB_USER=root
DB_PASSWORD=<tu_password>
DB_NAME=railway

# Configuración de la aplicación
NODE_ENV=production
PORT=3000

# JWT
JWT_SECRET=<tu_secret_key_seguro>

# CORS
CORS_ORIGIN=https://kardex-com.vercel.app

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=500

# Registro de clientes
ALLOW_CLIENT_REGISTRATION=true
```

### Pasos de Deployment

1. **Conectar Repositorio**
   ```bash
   # En Railway Dashboard:
   # 1. New Project → Deploy from GitHub
   # 2. Seleccionar repositorio: kardex.com_backend
   # 3. Configurar variables de entorno
   ```

2. **Ejecutar Migración de Base de Datos**
   ```bash
   # Localmente, con credenciales de Railway:
   cd kardex.com_backend
   npx tsx src/scripts/migrateProduction.ts
   ```

   **Verificar que se crearon:**
   - ✅ Columna `es_cliente_publico` en tabla `usuarios`
   - ✅ Enum `rol` incluye 'CLIENTE'
   - ✅ Tabla `cliente_usuario`
   - ✅ Tabla `pedidos`
   - ✅ Tabla `detalle_pedidos`

3. **Verificar Deployment**
   ```bash
   # Verificar que el servidor inicia correctamente
   curl https://kardexaplicacion.up.railway.app/api/health
   ```

   **Salida esperada:**
   ```json
   {
     "success": true,
     "message": "Sistema de Ventas KARDEX - API funcionando correctamente",
     "timestamp": "2025-11-14T..."
   }
   ```

4. **Verificar Logs**
   ```
   ✅ Conexión a la base de datos establecida
   ✅ Modelos sincronizados (tablas verificadas)
   ✅ Schema de base de datos verificado correctamente
   ✅ Usuario admin ya existe
   ```

---

## 🎨 Frontend - Vercel

### Requisitos Previos
- Cuenta de Vercel activa
- Repositorio GitHub conectado a Vercel

### Variables de Entorno Requeridas

```env
# API Backend
NEXT_PUBLIC_API_URL=https://kardexaplicacion.up.railway.app/api
```

### Pasos de Deployment

1. **Conectar Repositorio**
   ```bash
   # En Vercel Dashboard:
   # 1. New Project → Import Git Repository
   # 2. Seleccionar repositorio: kardex.com
   # 3. Framework Preset: Next.js
   # 4. Root Directory: ./
   ```

2. **Configurar Build Settings**
   ```
   Build Command: npm run build
   Output Directory: .next
   Install Command: npm install
   ```

3. **Verificar Deployment**
   ```bash
   # Abrir en navegador:
   https://kardex-com.vercel.app
   ```

   **Verificar:**
   - ✅ Página de login carga correctamente
   - ✅ Conexión con backend funciona (health check)
   - ✅ No hay errores en consola del navegador

---

## 🗄️ Base de Datos - MySQL en Railway

### Credenciales de Conexión

```
Host: shortline.proxy.rlwy.net
Port: 43112
User: root
Password: xYAOlvsfKbmcuSSDTOFJZmFBxpBVMHOI
Database: railway
```

### Conexión desde CLI

```bash
# Usando MySQL CLI
mysql -h shortline.proxy.rlwy.net -P 43112 -u root -p railway

# Usando Railway CLI
railway connect MySQL
```

### Verificar Tablas

```sql
-- Ver todas las tablas
SHOW TABLES;

-- Verificar estructura de usuarios
DESCRIBE usuarios;

-- Verificar columna es_cliente_publico
SELECT COLUMN_NAME, DATA_TYPE, COLUMN_DEFAULT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'usuarios' 
AND COLUMN_NAME = 'es_cliente_publico';

-- Verificar tablas del sistema de roles
SHOW TABLES LIKE '%pedido%';
SHOW TABLES LIKE 'cliente_usuario';
```

---

## 🧪 Testing Post-Deployment

### 1. Testing de Autenticación

```bash
# Login Admin
curl -X POST https://kardexaplicacion.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"nombre_usuario":"admin","contrasena":"admin123"}'

# Login Vendedor
curl -X POST https://kardexaplicacion.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"nombre_usuario":"vendedor1","contrasena":"vendedor123"}'
```

### 2. Testing de Roles

**ADMINISTRADOR (admin / admin123)**
- ✅ Login → Redirige a `/dashboard`
- ✅ Acceso a todos los módulos
- ✅ Sidebar muestra: Dashboard, Productos, Ventas, Compras, KARDEX, Clientes, Proveedores, Reportes, Perfil

**VENDEDOR (vendedor1 / vendedor123)**
- ✅ Login → Redirige a `/ventas`
- ✅ Solo ve sus propias ventas
- ✅ Sidebar muestra: Dashboard, Ventas, Clientes, Productos (lectura), Perfil

**CLIENTE (registro nuevo)**
- ✅ Registro público funciona en `/registro`
- ✅ Login → Redirige a `/cliente-portal`
- ✅ Sidebar muestra: Mi Portal, Mis Compras, Catálogo, Mis Pedidos, Facturas, Estado de Cuenta

### 3. Testing de Endpoints Nuevos

```bash
# Registro de cliente
curl -X POST https://kardexaplicacion.up.railway.app/api/auth/register-cliente \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Cliente Test",
    "email": "cliente@test.com",
    "telefono": "987654321",
    "numero_documento": "12345678",
    "contrasena": "cliente123"
  }'

# Catálogo (requiere token de cliente)
curl https://kardexaplicacion.up.railway.app/api/cliente-portal/catalogo \
  -H "Authorization: Bearer <TOKEN>"

# Mis compras (requiere token de cliente)
curl https://kardexaplicacion.up.railway.app/api/cliente-portal/mis-compras \
  -H "Authorization: Bearer <TOKEN>"
```

---

## 🔧 Troubleshooting

### Error: "Unknown column 'es_cliente_publico'"

**Causa:** La migración SQL no se ejecutó correctamente.

**Solución:**
```bash
cd kardex.com_backend
npx tsx src/scripts/migrateProduction.ts
```

### Error: "ER_BAD_FIELD_ERROR"

**Causa:** Modelo de Sequelize no sincronizado con la base de datos.

**Solución:**
1. Verificar que la migración se ejecutó
2. Reiniciar el servidor en Railway
3. Verificar logs del servidor

### Error de CORS

**Causa:** Frontend no está en la lista de orígenes permitidos.

**Solución:**
```env
# En Railway, agregar/actualizar:
CORS_ORIGIN=https://kardex-com.vercel.app
```

### Rate Limiting Excesivo

**Causa:** Límite de requests muy bajo.

**Solución:**
```env
# En Railway, aumentar:
RATE_LIMIT_MAX_REQUESTS=500
RATE_LIMIT_WINDOW_MS=900000
```

---

## 📊 Monitoreo

### Railway
- **Logs:** Railway Dashboard → Service → Logs
- **Métricas:** Railway Dashboard → Service → Metrics
- **Base de datos:** Railway Dashboard → MySQL → Data

### Vercel
- **Logs:** Vercel Dashboard → Project → Deployments → View Function Logs
- **Analytics:** Vercel Dashboard → Project → Analytics
- **Performance:** Vercel Dashboard → Project → Speed Insights

---

## 🔄 Actualización del Sistema

### Backend

```bash
# 1. Hacer cambios en el código
git add .
git commit -m "feat: nueva funcionalidad"
git push origin main

# 2. Railway detecta el push y redeploya automáticamente

# 3. Si hay cambios en la base de datos:
npx tsx src/scripts/migrateProduction.ts
```

### Frontend

```bash
# 1. Hacer cambios en el código
git add .
git commit -m "feat: nueva funcionalidad"
git push origin main

# 2. Vercel detecta el push y redeploya automáticamente
```

---

## 📝 Credenciales de Usuarios Demo

```
ADMINISTRADOR:
Usuario: admin
Contraseña: admin123

VENDEDOR:
Usuario: vendedor1
Contraseña: vendedor123

Usuario: vendedor2
Contraseña: vendedor123

CLIENTE:
(Registro público en /registro)
```

---

## ✅ Checklist Final

- [ ] Backend desplegado en Railway
- [ ] Frontend desplegado en Vercel
- [ ] Base de datos migrada correctamente
- [ ] Variables de entorno configuradas
- [ ] Health check del backend funciona
- [ ] Login de admin funciona
- [ ] Login de vendedor funciona
- [ ] Registro de cliente funciona
- [ ] Sidebar dinámico según rol
- [ ] Redirección automática según rol
- [ ] Portal de cliente accesible
- [ ] Endpoints protegidos por permisos
- [ ] Rate limiting configurado
- [ ] CORS configurado correctamente
- [ ] Logs sin errores críticos

---

## 🆘 Soporte

Si encuentras problemas durante el deployment:

1. Verificar logs en Railway y Vercel
2. Ejecutar script de verificación de schema
3. Revisar variables de entorno
4. Consultar sección de Troubleshooting

---

**Última actualización:** 14 de Noviembre, 2025
**Versión del sistema:** 1.0.0

