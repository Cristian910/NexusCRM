# NexusCRM — Backend API

NestJS REST API powering [NexusCRM](../README.md) — multi-tenant auth, deals pipeline, clients, tasks, analytics, and background jobs.

> For deployment (Render + Neon + Upstash) and the project overview, see the [root README](../README.md).

## Stack

- **Runtime**: Node.js 20+
- **Framework**: NestJS 10 + TypeScript
- **ORM**: Prisma 5
- **Base de datos**: PostgreSQL 15+
- **Auth**: JWT (access + refresh) via Passport
- **Validación**: class-validator + class-transformer
- **Rate limiting**: @nestjs/throttler

---

## Estructura del proyecto

```
src/
├── auth/
│   ├── __tests__/
│   │   ├── auth.controller.spec.ts
│   │   ├── auth.service.spec.ts
│   │   └── jwt-access.guard.spec.ts
│   ├── dto/
│   │   ├── login.dto.ts
│   │   ├── refresh-token.dto.ts
│   │   └── register.dto.ts
│   ├── guards/
│   │   ├── jwt-access.guard.ts     ← global, todos los routes
│   │   ├── jwt-refresh.guard.ts
│   │   └── roles.guard.ts          ← global, jerarquía OWNER>ADMIN>MEMBER>VIEWER
│   ├── interfaces/
│   │   ├── auth-tokens.interface.ts
│   │   └── jwt-payload.interface.ts
│   ├── strategies/
│   │   ├── jwt-access.strategy.ts
│   │   └── jwt-refresh.strategy.ts
│   ├── auth.controller.ts
│   ├── auth.module.ts
│   └── auth.service.ts
├── common/
│   ├── decorators/
│   │   ├── current-user.decorator.ts
│   │   ├── public.decorator.ts     ← @Public() para rutas sin auth
│   │   └── roles.decorator.ts      ← @Roles(Role.ADMIN)
│   ├── filters/
│   │   └── all-exceptions.filter.ts
│   ├── interceptors/
│   │   └── response.interceptor.ts ← envelope { success, data, timestamp }
│   └── pipes/
│       └── sanitize.pipe.ts
├── config/
│   ├── app.config.ts
│   ├── config.validation.ts
│   └── jwt.config.ts
├── modules/
│   ├── organizations/
│   │   ├── dto/organization.dto.ts
│   │   ├── organizations.controller.ts
│   │   ├── organizations.module.ts
│   │   └── organizations.service.ts
│   └── users/
│       ├── dto/user.dto.ts
│       ├── users.controller.ts
│       ├── users.module.ts
│       └── users.service.ts
├── prisma/
│   ├── prisma.module.ts
│   └── prisma.service.ts
├── app.module.ts
└── main.ts
prisma/
├── schema.prisma
└── seed.ts
```

---

## Setup

### 1. Instalar dependencias

```bash
npm install
```

### 2. Variables de entorno

```bash
cp .env.example .env
# Editar .env con tus valores reales
```

Variables requeridas:

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | URL de conexión a PostgreSQL |
| `JWT_ACCESS_SECRET` | Secreto para access tokens (mín. 32 chars en prod) |
| `JWT_REFRESH_SECRET` | Secreto para refresh tokens (mín. 32 chars en prod) |
| `BCRYPT_ROUNDS` | Rondas bcrypt (recomendado: 12) |
| `FRONTEND_URL` | Origen del frontend, usado para armar el link del email de reset-password (default: `http://localhost:3000`) |

### 3. Base de datos

```bash
# Generar cliente Prisma
npm run prisma:generate

# Ejecutar migraciones (esto también agrega los campos de reset-password
# al modelo User — necesario si vienes de una versión anterior del schema)
npm run prisma:migrate

# Cargar datos iniciales, incluida la cuenta demo con pipeline completo
npm run prisma:seed
```

El seed crea dos organizaciones:

| Org (slug) | Email | Password | Notas |
|---|---|---|---|
| `demo` | `demo@nexuscrm.io` | `Demo1234!` | Cuenta recomendada para explorar — 5 usuarios, 18 clientes, 36 deals distribuidos en todas las etapas, tareas, notificaciones y actividad histórica. Accesible con un click desde "Explore the live demo" en el login. |
| `acme-corp` | `admin@acme.com` | `Admin1234!` | Organización mínima, vacía, para probar el flujo de onboarding desde cero. |

### 4. Correr el servidor

```bash
# Desarrollo con hot-reload
npm run start:dev

# Producción
npm run build && npm run start:prod
```

### 5. Tests

```bash
# Correr todos los tests
npm test

# Con coverage
npm run test:cov
```

---

## Endpoints

Todos los endpoints tienen el prefijo `/api/v1`.

### Auth (público)

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/v1/auth/register` | Registro: crea organización + usuario OWNER |
| POST | `/api/v1/auth/login` | Login: retorna access + refresh token |
| POST | `/api/v1/auth/refresh` | Renueva access token via refresh token |
| POST | `/api/v1/auth/logout` | Invalida el refresh token (requiere auth) |
| POST | `/api/v1/auth/forgot-password` | Solicita link de reseteo de contraseña (rate-limited: 3/min) |
| POST | `/api/v1/auth/reset-password` | Confirma el nuevo password con el token recibido por email (rate-limited: 5/min) |
| POST | `/api/v1/auth/me` | Retorna payload del token actual (requiere auth) |

### Users (requiere auth)

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| GET | `/api/v1/users` | ADMIN+ | Lista todos los usuarios de la org |
| GET | `/api/v1/users/me` | Cualquiera | Perfil propio |
| PATCH | `/api/v1/users/me` | Cualquiera | Actualiza nombre propio |
| PATCH | `/api/v1/users/me/password` | Cualquiera | Cambia contraseña propia |
| POST | `/api/v1/users/invite` | ADMIN+ | Invita usuario a la org |
| GET | `/api/v1/users/:id` | ADMIN+ | Ver usuario por ID |
| PATCH | `/api/v1/users/:id/role` | ADMIN+ | Cambiar rol de usuario |
| DELETE | `/api/v1/users/:id` | ADMIN+ | Desactivar usuario |

### Organizations (requiere auth)

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| GET | `/api/v1/organizations/me` | Cualquiera | Ver la organización propia |
| PATCH | `/api/v1/organizations/me` | ADMIN+ | Actualizar nombre de org |

---

## Ejemplos de uso

### Registro

```bash
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "admin@miempresa.com",
  "password": "SecurePass1!",
  "firstName": "Carlos",
  "lastName": "García",
  "organizationName": "Mi Empresa SRL"
}
```

Respuesta `201`:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clx...",
      "email": "admin@miempresa.com",
      "firstName": "Carlos",
      "lastName": "García",
      "role": "OWNER",
      "isActive": true,
      "organizationId": "clx...",
      "createdAt": "2026-06-21T...",
      "updatedAt": "2026-06-21T..."
    },
    "tokens": {
      "accessToken": "eyJ...",
      "refreshToken": "eyJ..."
    }
  },
  "timestamp": "2026-06-21T..."
}
```

### Login

```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@miempresa.com",
  "password": "SecurePass1!",
  "organizationSlug": "mi-empresa-srl"
}
```

### Refresh token

```bash
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJ..."
}
```

### Rutas protegidas

```bash
GET /api/v1/users/me
Authorization: Bearer eyJ...
```

---

## Decisiones de arquitectura

### Multi-tenancy
El aislamiento de datos se aplica en la capa de servicio: cada query incluye `organizationId` extraído del JWT. Ningún usuario puede acceder a datos de otra organización aunque conozca el ID.

### Jerarquía de roles
`OWNER (4) > ADMIN (3) > MEMBER (2) > VIEWER (1)`. El `RolesGuard` usa esta escala para que `@Roles(Role.ADMIN)` permita también a OWNER.

### Refresh tokens hasheados
Los refresh tokens se almacenan **hasheados** con bcrypt. El token en claro solo vive en la respuesta HTTP; si la base de datos se filtra, los tokens no son válidos.

### Guards globales
`JwtAccessGuard` y `RolesGuard` están registrados como `APP_GUARD`, protegiendo **todas** las rutas por defecto. Las rutas públicas se marcan explícitamente con `@Public()`.
