# Stock — Sistema de gestión de inventario

Sistema web para administrar stock, productos, proveedores y movimientos de inventario. Estética industrial/logística premium, pensado para operación diaria de depósitos.

- **Dashboard** con KPIs, gráficos de movimientos, alertas y ranking de productos.
- **Productos** con SKU, categoría, stock mínimo, vencimientos y múltiples proveedores.
- **Movimientos** de ingreso, salida y ajuste con trazabilidad completa (usuario, fecha, stock anterior/nuevo).
- **Alertas** automáticas por bajo stock, sin stock y vencimientos próximos (30 días).
- **Reportes** de stock, valorización, movimientos por período y desempeño de proveedores.
- **Áreas** (materias, cátedras y dependencias) como destino del stock, vinculadas a los movimientos.
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
9. [Importar inventario de librería (CSV)](#importar-inventario-de-librería-csv)
10. [Importar movimientos históricos (TSV)](#importar-movimientos-históricos-tsv)
11. [Áreas (catálogo COD → ÁREA)](#áreas-catálogo-cod--área)
12. [Deploy en Dokploy](#deploy-en-dokploy)

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16.2.9 (App Router, Turbopack) |
| UI | React 19, Tailwind CSS 4, Recharts 3 |
| Base de datos | PostgreSQL con Prisma ORM 6 |
| Autenticación | Sesiones propias con cookie `httpOnly` + bcryptjs |
| Tipos | TypeScript estricto |

## Estructura del proyecto

```
stock/
├── prisma/
│   ├── schema.prisma          # Modelos: User, Session, Category, Supplier, Product, StockMovement, Area
│   ├── catalog.mjs            # Catálogo real: 455 productos (SKU + nombre) agrupados por letra
│   ├── areas.tsv              # Catálogo COD → ÁREA (186 áreas, dependencias O1–O48)
│   ├── inventario.csv         # Inventario de librería (stock y precios)
│   ├── import-areas.mjs       # Importador del catálogo de áreas (idempotente)
│   ├── import-inventario.mjs  # Importador del inventario CSV (stock y precios)
│   ├── import-movimientos.mjs # Importador del historial TSV (sin tocar stock)
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

Crear el archivo `.env` en la raíz apuntando al servicio PostgreSQL:

```env
# Hostname interno del servicio Postgres dentro de Dokploy
DATABASE_URL="postgresql://brandall:TU_PASSWORD@basededato-6cfbai:5432/stock"
# IP pública del servidor Postgres (para herramientas externas / local)
DB_HOST=186.153.163.188
```

> Para correr desde una máquina local usar la **IP pública** en `DATABASE_URL` (`postgresql://brandall:TU_PASSWORD@186.153.163.188:5432/stock`); el hostname `basededato-6cfbai` solo resuelve dentro de Dokploy.

### 3. Base de datos y datos iniciales

```bash
# Genera el cliente Prisma
npx prisma generate

# Crea las tablas (equivalente a migración inicial)
npm run db:push

# Carga usuarios + catálogo (idempotente: puede ejecutarse varias veces)
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

El seed crea las **7 categorías** del catálogo (**Librería, Limpieza, Eléctricos, Pinturería, Sanitarios, Informática, Electrodomésticos**), los **455 productos** del catálogo real (con stock y precio en 0) y los usuarios de prueba. Después se cargan los datos de la librería:

```bash
npm run db:areas        # catálogo de áreas (186)
npm run db:inventario   # stock y precios reales (A01–A198)
npm run db:movimientos  # historial de movimientos (requiere prisma/movimientos.tsv)
```

## Roles y permisos

| Permiso | Administrador | Operador | Consulta |
|---|:---:|:---:|:---:|
| Ver inventario, movimientos y alertas | ✅ | ✅ | ✅ |
| Registrar ingresos, salidas y ajustes | ✅ | ✅ | — |
| Crear/editar productos | ✅ | ✅ | — |
| Categorías, áreas y proveedores | ✅ | — | — |
| Usuarios y configuración | ✅ | — | — |
| Reportes | ✅ | ✅ | ✅ (solo lectura) |

## Variables de entorno

| Variable | Obligatoria | Descripción | Ejemplo |
|---|---|---|---|
| `DATABASE_URL` | ✅ | Conexión a PostgreSQL (hostname interno en Dokploy; IP pública desde local) | `postgresql://brandall:pass@basededato-6cfbai:5432/stock` |
| `DB_HOST` | no | IP pública del servidor Postgres (para herramientas externas) | `186.153.163.188` |
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
| `npm run db:inventario` | Importa `prisma/inventario.csv` (stock y precios de la librería) |
| `npm run db:movimientos` | Importa `prisma/movimientos.tsv` (historial, sin tocar stock) |
| `npm run db:areas` | Importa `prisma/areas.tsv` (catálogo COD → ÁREA) |

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
DATABASE_URL=postgresql://brandall:TU_PASSWORD@basededato-6cfbai:5432/stock
PORT=3000
NODE_ENV=production
```

> El hostname `basededato-6cfbai` es el nombre del servicio **PostgreSQL** de Dokploy y solo resuelve dentro de la red interna. `DB_HOST` con la IP pública se usa para herramientas externas, no en la app.

### 3. Base de datos

La aplicación usa un servicio **PostgreSQL** de Dokploy (no SQLite): los datos viven en el servicio, por lo que **no hace falta volumen en la app**. Solo asegurarse de que:

1. El servicio Postgres exista y esté corriendo.
2. La base `stock` esté creada (`CREATE DATABASE "stock";`). Si no existe, el `docker-entrypoint.sh` fallará al conectar.
3. El usuario tenga permisos sobre esa base.

### 4. Primer arranque

El `docker-entrypoint.sh` ejecuta automáticamente en cada inicio:

1. `prisma db push` → crea/actualiza las tablas.
2. `node prisma/seed.mjs` → crea los usuarios y carga el catálogo (es idempotente: no duplica productos).
3. `node prisma/import-areas.mjs` → carga el catálogo de áreas `COD → ÁREA` (idempotente).
4. `node prisma/import-inventario.mjs` → carga stock y precios del inventario CSV (idempotente).

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
| `P1001: Can't reach database server` | La app no llega al servicio Postgres. Verificar que el servicio esté corriendo y que `DATABASE_URL` use el hostname interno correcto. |
| `Database "stock" does not exist` | Crear la base en el servicio Postgres: `CREATE DATABASE "stock";` (el entrypoint no la crea). |
| `Error: listen EADDRINUSE :::3000` | Puerto 3000 ocupado en el host. En Dokploy no ocurre (aislamiento por contenedor). |
| Login no funciona / 401 | Revisar que `DATABASE_URL` apunte a la base correcta y que el seed del entrypoint se haya ejecutado (ver logs del arranque). |
| Certificado SSL no emitido | Verificar registro DNS A y que el server tenga el puerto 443 abierto; reiniciar traefik en el host (`docker restart dokploy-traefik`) para limpiar autorizaciones fallidas. |

## Importar inventario de librería (CSV)

El repositorio incluye `prisma/inventario.csv` (catálogo A01–A198 con stock y precios) y un importador idempotente que hace **upsert por SKU** (código interno `COD. INT`, o código de barras si falta), tomando el nombre del inventario como autoridad:

```bash
npm run db:inventario
```

Qué hace:

- Crea la categoría `Librería` si no existe.
- Para cada fila con código: actualiza (o crea) el producto con `name`, `barcode`, `stock` (decimales redondeados a entero) y `salePrice` (el `PRECIO UNIT.`).
- Los `#N/A`, `$ -` y celdas vacías se tratan como 0/null.
- Los códigos repetidos dentro del archivo mantienen la primera fila (ej. `A07` aparece como "Nº2" y "Nº3"; se conserva el que tiene stock).
- Las filas sin código ni barcode se omiten (ej. `LLAVEROS IDENTIFICADORES ACRIMET`).

> El `campo barcode` se agregó al modelo `Product` (visible en el formulario, ficha y buscador). Requiere `prisma db push` antes de correr el importador.

## Importar movimientos históricos (TSV)

El módulo de movimientos se puede poblar con el historial de la librería (alta de stock inicial + entradas/salidas posteriores). Preparación:

1. Guardar el movimiento original (texto separado por **tabs**, con su fila de encabezado) en `prisma/movimientos.tsv`. Columnas esperadas (en orden):

   `Nº · FECHA · AÑO · MES · CÓDIGO · PRODUCTO · ENTRADAS · SALIDAS · NETO · COD.2 · DEPARTAMENTO · RETIRA/ENTREGA · OBSERVACIONES`

2. Ejecutar:

```bash
npm run db:movimientos
```

Qué hace:

- **Solo historial**: crea los `StockMovement` (INGRESO/SALIDA/AJUSTE según `ENTRADAS`/`SALIDAS`/`NETO`) sin modificar el `stock` actual de los productos (que queda como lo dejó el inventario).
- Asigna la fecha real cuando existe (ej. `03/02/2025` en el ALTA STOCK INICIAL); los movimientos sin fecha (AÑO `1899` de Excel) se cargan con `31/12/2025` (constante `FECHA_DEFECTO` al inicio del script, editable).
- Crea automáticamente los productos que no existen (nombre del catálogo o del archivo, categoría por prefijo `A`–`G`).
- Las filas sin código (incluidos los `#N/A`) o con importes vacíos se omiten con aviso por consola.
- `reason` combina `OBSERVACIONES`, `RETIRA/ENTREGA` y `DEPARTAMENTO` con el prefijo `[Importado]`.
- Es **idempotente**: si ya hay movimientos `[Importado]`, aborta avisando; para reimportar tras cambiar el archivo: `node prisma/import-movimientos.mjs --reset`.
- El `stock` anterior/nuevo se reconstruye en memoria desde el ALTA STOCK INICIAL.

> El importador busca `prisma/movimientos.tsv`; si el archivo no existe, avisa sin tocar nada. El `prisma/movimientos.tsv` incluido en el repo es un **ejemplo de prueba**: reemplazarlo con el movimiento real antes de importar en producción. El entrypoint de deploy **no** corre este importador.

## Áreas (catálogo COD → ÁREA)

Las **áreas** son las materias, cátedras y dependencias a las que se destina el stock. Se importan desde `prisma/areas.tsv` (186 áreas: materias con prefijo `A/C/D/E/M/H/L/P/TE` y dependencias `O1`–`O48`):

```bash
npm run db:areas
```

- Es **idempotente**: hace upsert por código, no duplica ni borra nada.
- El archivo `prisma/areas.tsv` puede tener una tercera columna opcional `EMAIL` (formato `COD\tÁREA\tEMAIL`); si está presente, se guarda en el área para los avisos de salida.
- Las áreas quedan disponibles en `/areas` (CRUD solo administrador, con campo **Email** para avisos) y como destino en los formularios de **Ingreso** y **Salida** (selector "Área / destino").
- Cada movimiento guarda su `areaId`; la página **Movimientos** permite filtrar por área y muestra la columna correspondiente.
- El importador de movimientos (`db:movimientos`) mapea la columna `COD.2` del TSV al área usando este catálogo; si no se corrió `db:areas`, avisa por consola y deja esos movimientos sin área.

## Avisos por email en salidas

Al registrar una **salida**, si el área destino tiene un **email** cargado, se envía una notificación automática (producto, cantidad, área, motivo y stock). Requiere configurar SMTP en el entorno:

| Variable | Descripción |
| --- | --- |
| `MAIL_ENABLED` | `true` para activar el envío |
| `SMTP_HOST` | servidor SMTP (ej. `smtp.gmail.com`) |
| `SMTP_PORT` | 587 (STARTTLS) o 465 (SSL), default 587 |
| `SMTP_USER` / `SMTP_PASS` | credenciales del remitente |
| `SMTP_FROM` | remitente visible (opcional) |

Si `MAIL_ENABLED` no es `true` o falta `SMTP_HOST`, el envío se omite y solo se registra en el log; el registro de la salida nunca se bloquea por un fallo de mail.
