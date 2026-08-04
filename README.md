# Stock — Sistema de gestión de inventario

Sistema web para administrar stock, productos, proveedores y movimientos de inventario. Estética industrial/logística premium, pensado para operación diaria de depósitos.

- **Dashboard** con KPIs, gráficos de movimientos, alertas y ranking de productos.
- **Productos** con SKU, categoría, stock mínimo, vencimientos y múltiples proveedores.
- **Movimientos** de ingreso, salida y ajuste con trazabilidad completa (usuario, fecha, stock anterior/nuevo).
- **Alertas** automáticas por bajo stock, sin stock y vencimientos próximos (30 días).
- **Reportes** de stock, valorización, movimientos por período y desempeño de proveedores.
- **Usuarios y roles** (Administrador, Operador, Consulta) con permisos diferenciados.

---

## Índice

1. [Stack tecnológico](#stack-tecnológico)
2. [Estructura del proyecto](#estructura-del-proyecto)
3. [Requisitos](#requisitos)
4. [Puesta en marcha local](#puesta-en-marcha-local)
5. [Usuarios de prueba](#usuarios-de-prueba)
6. [Roles y permisos](#roles-y-permisos)
7. [Variables de entorno](#variables-de-entorno)
8. [Scripts disponibles](#scripts-disponibles)
9. [Deploy en Dokploy](#deploy-en-dokploy)
10. [Migrar a PostgreSQL (opcional)](#migrar-a-postgresql-opcional)

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16.2.9 (App Router, Turbopack) |
| UI | React 19, Tailwind CSS 4, Recharts 3 |
| Base de datos | SQLite con Prisma ORM 6 |
| Autenticación | Sesiones propias con cookie `httpOnly` + bcryptjs |
| Tipos | TypeScript estricto |

## Estructura del proyecto

```
stock/
├── prisma/
│   ├── schema.prisma          # Modelos: User, Session, Category, Supplier, Product, StockMovement
│   ├── catalog.mjs            # Catálogo real: 455 productos (SKU + nombre) agrupados por letra
│   └── seed.mjs               # Seed idempotente: usuarios + catálogo (corre en cada arranque)
├── src/
│   ├── actions/               # Server Actions (auth, productos, movimientos, usuarios, …)
│   ├── app/
│   │   ├── (app)/             # Páginas protegidas (dashboard, productos, reportes, …)
│   │   ├── login/             # Pantalla de acceso
│   │   ├── globals.css        # Theme Tailwind 4 y paleta
│   │   └── layout.tsx         # Layout raíz + fuentes
│   ├── components/            # UI kit, charts, formularios
│   └── lib/                   # auth, db, queries, format
├── Dockerfile                 # Build multi-stage para Dokploy
├── docker-entrypoint.sh       # Aplica esquema y arranca la app
└── .dockerignore
```

## Requisitos

- Node.js **20** o superior (probado con Node 20.20).
- npm (se usa `npm ci`).
- Opcional: cuenta de GitHub y un servidor con [Dokploy](https://dokploy.com) instalado.

## Puesta en marcha local

### 1. Instalar dependencias

```bash
npm install
```

### 2. Variables de entorno

Crear el archivo `.env` en la raíz:

```env
# Ruta relativa al directorio prisma/ → crea prisma/stock.db
DATABASE_URL="file:./stock.db"
```

### 3. Base de datos y datos iniciales

```bash
# Genera el cliente Prisma
npx prisma generate

# Crea las tablas (equivalente a migración inicial)
npm run db:push

# Carga datos de ejemplo (idempotente: puede ejecutarse varias veces)
npm run db:seed
```

### 4. Desarrollo

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000). El login redirige a `/login`.

### 5. Producción local

```bash
npm run build
npm start
```

## Usuarios de prueba

| Email | Contraseña | Rol |
|---|---|---|
| `admin@stock.local` | `Admin123!` | Administrador |
| `operador@stock.local` | `Admin123!` | Operador |

> **Importante:** en el primer deploy a Dokploy hay que cambiar estas contraseñas.

El seed también crea las 7 categorías del catálogo (**Librería, Limpieza, Eléctricos, Pinturería, Sanitarios, Informática, Electrodomésticos**) y los **455 productos** del catálogo real (todo con stock y precio en 0, para cargar luego con movimientos de ingreso).

## Roles y permisos

| Permiso | Administrador | Operador | Consulta |
|---|:---:|:---:|:---:|
| Ver inventario, movimientos y alertas | ✅ | ✅ | ✅ |
| Registrar ingresos, salidas y ajustes | ✅ | ✅ | — |
| Crear/editar productos | ✅ | ✅ | — |
| Categorías y proveedores | ✅ | — | — |
| Usuarios y configuración | ✅ | — | — |
| Reportes | ✅ | ✅ | ✅ (solo lectura) |

## Variables de entorno

| Variable | Obligatoria | Descripción | Ejemplo |
|---|---|---|---|
| `DATABASE_URL` | ✅ | Conexión a SQLite (relativa al dir `prisma/` en local; absoluta con volumen en Dokploy) | `file:./stock.db` / `file:/data/stock.db` |
| `PORT` | no | Puerto HTTP (por defecto 3000) | `3000` |
| `NODE_ENV` | no | Modo de ejecución (se fija en el contenedor) | `production` |

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm start` | Servir el build de producción |
| `npm run typecheck` | Verificación de tipos (`tsc --noEmit`) |
| `npm run lint` | ESLint |
| `npm run db:push` | Aplica el esquema Prisma a la base |
| `npm run db:seed` | Carga datos iniciales |

---

## Deploy en Dokploy

### Requisitos previos

1. El repositorio subido a GitHub (rama `main`).
2. Un servidor con Dokploy instalado y acceso por dominio.
3. (Recomendado) Un dominio o subdominio propio; Dokploy igual asigna uno automático `*.sslip.io` con HTTPS.

### 1. Crear la aplicación

En Dokploy:

1. **Proyectos** → crear un proyecto (p. ej. `stock`).
2. Dentro del proyecto, **Servicios → Nueva aplicación**.
3. En **Fuente** elegir **Git**:
   - Proveedor: **GitHub** (con la conexión de la cuenta).
   - Repositorio: `brandall2021/stock`.
   - Rama: `main`.
4. **Build Type**: **Dockerfile** (el repo incluye uno multi-stage listo).
5. **Build context / dockerContextPath**: `.` (raíz del repositorio).
6. Crear la aplicación.

> El `Dockerfile` ya expone el puerto **3000**, así que Dokploy enruta el dominio al contenedor automáticamente.

### 2. Variables de entorno

En **Configuración → Environment** de la app en Dokploy:

```env
DATABASE_URL=file:/data/stock.db
PORT=3000
NODE_ENV=production
```

> Usar la ruta **absoluta `/data/stock.db`** porque la base de datos vive en un volumen persistente (ver paso siguiente). En local se usa la ruta relativa `file:./stock.db`.

### 3. Volumen persistente (SQLite)

Sin volumen, la base de datos se pierde en cada redeploy. Agregar:

1. Ir a **Volumes** de la aplicación.
2. Agregar un volumen **persistente**:
   - **Mount Path**: `/data`
   - **Volumen**: crear uno nuevo (p. ej. `stock-data`) o usar un volumen de host.

Dokploy monta `/data` de forma persistente → el archivo `stock.db` sobrevive entre deploys y reinicios.

### 4. Primer arranque

El `docker-entrypoint.sh` ejecuta automáticamente en cada inicio:

1. `prisma db push` → crea/actualiza las tablas.
2. `node prisma/seed.mjs` → crea los usuarios y carga el catálogo (es idempotente: no duplica productos).

No hace falta ejecutar nada a mano. Al terminar el arranque ya se puede ingresar con `admin@stock.local` / `Admin123!`. **Cambiar la contraseña del admin apenas se ingrese.**

### 5. Dominio y HTTPS

Dokploy asigna automáticamente un dominio tipo:

```
stock-<hash>-<ip-del-servidor>.sslip.io
```

con certificado Let's Encrypt automático. Para usar un dominio propio:

1. En **Domains** de la app, agregar el dominio (p. ej. `stock.midominio.com.ar`).
2. En el DNS del dominio, crear un registro **A** apuntando a la IP del servidor.
3. Dokploy emite el certificado SSL automáticamente (o generar certificado manual si es necesario).

> **Nota sobre Let's Encrypt:** si la emisión falla, revisar que el registro DNS **A** (y no solo un AAAA) apunte a la IP correcta. Un registro AAAA a una IPv6 sin soporte rompe la validación HTTP-01.

### 6. Redeploy / actualizaciones

- Cada push a `main` se puede publicar con **Redeploy** (botón) o configurando un **webhook** en GitHub → ajustes de la aplicación → URL de deploy.
- El webhook debe enviar `Content-Type: application/json` con el payload `{"ref":"refs/heads/main"}`.
- Como `prisma db push` corre en cada arranque, los cambios de esquema se aplican automáticamente en el redeploy (ideal para desarrollo; para producción con datos reales se recomienda migraciones versionadas).

### 7. Solución de problemas

| Síntoma | Causa / solución |
|---|---|
| `Error: Failed to load chunk` | Build previo obsoleto. Hacer **Clean build** (limpiar caché de Docker) y redeploy. |
| `unable to open database file` | Falta el volumen en `/data` o `DATABASE_URL` apunta a una ruta sin montar. Verificar volumen. |
| `Error: listen EADDRINUSE :::3000` | Puerto 3000 ocupado en el host. En Dokploy no ocurre (aislamiento por contenedor). |
| Login no funciona / 401 | Revisar que `DATABASE_URL` coincida con la del volumen y que el seed del entrypoint se haya ejecutado (ver logs del arranque). |
| Certificado SSL no emitido | Verificar registro DNS A y que el server tenga el puerto 443 abierto; reiniciar traefik en el host (`docker restart dokploy-traefik`) para limpiar autorizaciones fallidas. |

## Migrar a PostgreSQL (opcional)

El modelo soporta migrar de SQLite a PostgreSQL:

1. En `prisma/schema.prisma` cambiar el provider:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

2. Cambiar `DATABASE_URL` a una conexión Postgres, por ejemplo:

```env
DATABASE_URL="postgresql://user:password@host:5432/stock"
```

3. Regenerar y aplicar esquema:

```bash
npx prisma generate
npx prisma db push
npm run db:seed
```

4. En Dokploy, quitar el volumen SQLite y apuntar `DATABASE_URL` al servicio Postgres (se puede usar un servicio **PostgreSQL** de Dokploy).

> Al cambiar de motor, eliminar el archivo SQLite local si quedó como respaldo. Los datos no se migran automáticamente.
