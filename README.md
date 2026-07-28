<div align="center">

<img src="front/app/icon.svg" width="64" height="64" alt="NexusCRM" />

# NexusCRM

### El CRM que un equipo de ventas realmente usaría — no una maqueta.

Multi-tenant, con roles reales, tiempo real, colas en background y un sistema de diseño construido desde cero. De punta a punta: base de datos, API, frontend y despliegue en producción.

<br/>

[![Ver demo en vivo](https://img.shields.io/badge/🚀_VER_DEMO_EN_VIVO-14B8A6?style=for-the-badge&logoColor=white)](https://nexus-crm-blond.vercel.app)

**org:** `demo` &nbsp;·&nbsp; **email:** `demo@nexuscrm.io` &nbsp;·&nbsp; **password:** `Demo1234!`
&nbsp;— o entra directo con el botón **"Explore the live demo"** en el login, sin registrarte.

<br/>

![Next.js](https://img.shields.io/badge/Next.js_16-black?style=flat-square&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React_19-149ECA?style=flat-square&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS_10-E0234E?style=flat-square&logo=nestjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma_5-2D3748?style=flat-square&logo=prisma&logoColor=white)
![Redis](https://img.shields.io/badge/Redis_+_BullMQ-DC382D?style=flat-square&logo=redis&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-black?style=flat-square&logo=socket.io&logoColor=white)

</div>

<br/>

## Por qué este proyecto

La mayoría de los CRM de portafolio son un CRUD con login. Este resuelve los problemas que aparecen cuando el producto tiene que sostenerse solo:

- **Multi-tenancy real** — cada organización está aislada a nivel de base de datos; el mismo correo puede existir en dos empresas distintas sin chocar.
- **Permisos aplicados en el servidor**, no solo escondidos en la UI — un `VIEWER` que intenta mover un negocio por la API directamente recibe un 403, sin importar lo que muestre el frontend.
- **Nada bloquea el request principal** — emails, recordatorios de tareas y notificaciones corren en colas de BullMQ, no en línea dentro del controller.
- **Tiempo real de verdad** — WebSockets, no polling: mover un negocio lo actualiza al instante para todo el equipo.
- **Sistema de diseño propio**, no una plantilla de shadcn sin tocar — paleta, tipografía y hasta la marca están diseñadas y documentadas ([ver el porqué](./front/app/globals.css)).
- **Bilingüe de verdad** — español/inglés en toda la app, incluso antes de iniciar sesión, no solo tres textos traducidos.
- **Desplegado con una arquitectura real de producción** — no "corre en mi máquina": tres proveedores distintos, cada uno elegido por una razón concreta (ver más abajo).

<br/>

## Vista previa

![Dashboard](docs/dashboard.png)

<br/>

## ¿Para quién es esto y qué problema resuelve?

Un equipo de ventas pequeño (5-15 personas) —una agencia, una consultora, una startup en etapa temprana— necesita llevar su pipeline de algún lado. Las opciones típicas son un spreadsheet compartido que nadie actualiza a tiempo, o pagar $20-80 USD por usuario/mes en Salesforce o HubSpot por funciones que van a usar al 10%.

NexusCRM cubre el punto medio: lo esencial de un CRM real —pipeline visual, clientes, tareas de seguimiento, y métricas de qué tan bien está yendo el equipo— sin la curva de aprendizaje ni el costo de las plataformas enterprise. Cada organización que se registra está completamente aislada de las demás (multi-tenant real, no una casilla de "empresa" en una tabla compartida), así que el mismo código sirve para una organización o para mil, sin cambiar una línea.

Como pieza de portafolio, existe para demostrar algo más específico: que puedo llevar un producto completo —no un CRUD de ejemplo— desde el modelo de datos hasta producción, incluyendo las decisiones incómodas que un tutorial nunca cubre (¿qué pasa si dos usuarios mueven el mismo negocio a la vez? ¿qué le muestro a un rol que no tiene permiso? ¿qué pasa si el proveedor de email está caído?).

<br/>

## Arquitectura de despliegue

**Ningún proveedor de esta lista fue elegido solo "porque es gratis" — cada uno es gratis *y* tiene la capacidad real que esta parte del proyecto necesita.** Eso fue deliberado: es fácil armar un stack gratuito que se rompe en cuanto el proyecto hace algo mínimamente serio (una cola de trabajos, una conexión persistente, una base de datos que no se borre sola). Este no se rompe.

```mermaid
flowchart LR
    U(("👤 Usuario")) -->|HTTPS| V

    subgraph V["▲ Vercel"]
        F["Next.js 16<br/>Frontend"]
    end

    V -->|"REST · JSON"| R

    subgraph R["🎨 Render"]
        A["NestJS 10<br/>API + WebSockets + BullMQ"]
    end

    R -->|"SQL · TLS"| N[("🐘 Neon<br/>PostgreSQL")]
    R -->|"Redis protocol · TLS"| UP[("⚡ Upstash<br/>Redis")]
    R -.->|"SMTP"| E["✉️ Proveedor de email<br/>(reset de contraseña)"]

    style V fill:#000,stroke:#14B8A6,color:#fff
    style R fill:#0f0f0f,stroke:#14B8A6,color:#fff
    style N fill:#0f0f0f,stroke:#4169E1,color:#fff
    style UP fill:#0f0f0f,stroke:#DC382D,color:#fff
```

| Capa | Dónde vive | Alcance |
|---|---|---|---|
| **Frontend** | [Vercel](https://vercel.com) | CDN global, HTTPS automático, build optimizado de Next.js sin tocar configuración |
| **API** | [Render](https://render.com) | Proceso Node persistente de verdad (no funciones serverless con límite de duración) — necesario porque este backend mantiene WebSockets abiertos y workers de BullMQ corriendo en segundo plano |
| **Base de datos** | [Neon](https://neon.tech) | Postgres real (no una versión recortada), branching de bases de datos incluido, **el plan nunca expira ni se borra** |
| **Redis** | [Upstash](https://upstash.com) | Redis real vía protocolo estándar (compatible con BullMQ tal cual, sin adaptar código), facturación por comando en vez de por servidor encendido, **permanente** |

> 📍 **Demo en vivo:** frontend en `https://nexus-crm-blond.vercel.app`
>

<br/>

## Funcionalidades

<table>
<tr><td width="50%" valign="top">

**Pipeline**
- Kanban drag-and-drop entre 5 etapas
- Historial completo de cada cambio de etapa
- Métricas de valor y tasa de conversión por etapa
- Creación rápida de cliente sin salir del formulario de negocio

**Clientes y tareas**
- Tablas con búsqueda, filtros y paginación real (server-side)
- Tareas vinculadas a negocios y responsables
- Vista de detalle de cliente con sus negocios y tareas reales

</td><td width="50%" valign="top">

**Equipo y seguridad**
- Roles Owner / Admin / Member / Viewer aplicados en cada endpoint
- Invitaciones por email, activación de cuenta, desactivación
- Recuperación de contraseña con token de un solo uso (30 min de vida)

**Analítica y producto**
- Conversión, valor de pipeline y rendimiento del equipo por rango de fechas (incluso personalizado)
- Notificaciones en tiempo real vía WebSockets
- Onboarding guiado la primera vez, reabrible desde el header
- Español/Inglés en toda la aplicación

</td></tr>
</table>

<br/>

## Stack técnico

| Capa | Tecnologías |
|---|---|
| **Frontend** | Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Radix UI · Framer Motion · TanStack Query & Table · React Hook Form + Zod · Zustand · Recharts |
| **Backend** | NestJS 10 · TypeScript · Prisma 5 · PostgreSQL · Redis (BullMQ + cache) · Passport JWT · class-validator · Socket.IO |
| **Infraestructura** | Vercel · Render · Neon · Upstash — ver diagrama arriba |

<br/>

## Estructura del repositorio

Monorepo de dos aplicaciones que se despliegan **por separado**, cada una a su propio proveedor:

```
crm/
├── front/          App de Next.js  → se despliega en Vercel
├── back/           API de NestJS   → se despliega en Render
├── render.yaml      Blueprint de infraestructura-como-código para Render
└── LICENSE
```

<br/>

## Correrlo en local

Requiere Node 20+, PostgreSQL 15+ y Redis 7+ (o Docker — ver `back/docker-compose.yml`).

```bash
git clone <url-de-este-repo>
cd crm

# ── Backend ──────────────────────────────────────────────
cd back
cp .env.example .env        # completa DATABASE_URL, secretos JWT, etc.
npm install
npx prisma generate
npx prisma migrate deploy   # aplica todas las migraciones
npm run prisma:seed         # crea la organización demo + acme-corp
npm run start:dev           # → http://localhost:3001

# ── Frontend (nueva terminal) ────────────────────────────
cd front
cp .env.example .env        # NEXT_PUBLIC_API_URL=http://localhost:3001
npm install
npm run dev                 # → http://localhost:3000
```

Detalles de endpoints y variables del backend en [`back/README.md`](./back/README.md).

<br/>

## Despliegue a producción

Guía completa paso a paso (Neon → Upstash → Render → Vercel, en ese orden porque cada servicio depende del anterior) en el mensaje de configuración de este proyecto — o sigue la tabla del diagrama de arquitectura de arriba, que enlaza directo a cada proveedor.

<br/>

## Decisiones de ingeniería

Algunas elecciones deliberadas, por si el porqué importa tanto como el qué:

- **Neon + Upstash en vez de los add-ons gratis de Render** — el Postgres y Redis gratuitos de Render se borran a los 30 días. Para un link de portafolio que necesita seguir vivo, eso no sirve; Neon y Upstash sí son gratis de forma permanente.
- **BullMQ en vez de procesar todo en el request** — enviar un email o generar una notificación dentro del controller hace que la respuesta HTTP espere a un proveedor externo. Encolarlo desacopla la latencia del usuario de la disponibilidad del servicio de correo.
- **RBAC en guards de NestJS, no en `if` sueltos** — los permisos viven en un solo lugar (`lib/permissions` en el front, guards + decoradores en el back) y se aplican de la misma forma en cada endpoint, en vez de reimplementarse por feature.
- **Tokens de reseteo de contraseña hasheados con SHA-256, no guardados en texto plano** — el mismo patrón que ya usaba el refresh token del proyecto, extendido de forma consistente.
- **Diseño construido desde los tokens hacia arriba** — un solo archivo (`globals.css`) define color, tipografía y geometría; cambiar la paleta ahí se propaga a más del 95% de la interfaz sin tocar componentes, porque cada componente ya consume variables CSS en vez de colores sueltos.

<br/>

## Licencia

MIT — ver [LICENSE](./LICENSE).