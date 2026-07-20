# CRM Backend — Auditoría Completa (Entregable 6)

## Problemas encontrados y corregidos

### 🔴 CRÍTICOS (seguridad / correcitud)

#### 1. Unscoped mutations en UsersService
**Problema:** `prisma.user.update({ where: { id } })` no incluía `organizationId`, permitiendo teóricamente modificar usuarios de otra organización si se conocía su ID.

**Fix:** Reemplazado por `prisma.user.updateMany({ where: { id, organizationId } })` en todos los métodos: `updateMe`, `changePassword`, `updateRole`, `deactivate`.

---

#### 2. Enumeración de organizaciones en login
**Problema:** `AuthService.login()` lanzaba `NotFoundException('Organization not found')` cuando el slug no existía, permitiendo enumerar qué slugs son válidos.

**Fix:** Ahora lanza `UnauthorizedException('Invalid credentials')` para ambos casos (org no encontrada y credenciales incorrectas). Mismo mensaje, sin información extra.

---

#### 3. Timing attack en verificación de refresh token
**Problema:** Si `user.refreshToken` era null, el código retornaba antes de llegar a `bcrypt.compare()`, exponiendo diferencia de tiempo medible.

**Fix:** Se ejecuta siempre `bcrypt.compare(rawToken, storedHash ?? '$2b$12$placeholder...')` incluso cuando no hay token almacenado. Tiempo de respuesta constante.

---

#### 4. Rol del JWT usado en lugar del rol de BD en el guard
**Problema:** `JwtAccessStrategy.validate()` retornaba `payload.role` (del token), no el rol actual del usuario. Un cambio de rol no se reflejaba hasta que expiraba el access token (15 min).

**Fix:** La estrategia ahora consulta `user.role` desde la BD en cada validación y lo incluye en el payload. Los cambios de rol toman efecto en el siguiente request.

---

#### 5. `Math.random()` para generar contraseñas temporales
**Problema:** `UsersService.generateTempPassword()` usaba `Math.random()` — no criptográficamente seguro.

**Fix:** Movido a `generateSecurePassword()` en `src/common/types/shared.types.ts` usando `crypto.getRandomValues(new Uint8Array(length))`.

---

### 🟠 IMPORTANTES (arquitectura / rendimiento)

#### 6. `PaginatedResult` definido en `clients.service.ts` e importado desde ahí por 5 módulos
**Problema:** Acoplamiento incorrecto — `DealsService`, `TasksService`, `ActivityService`, `NotificationsService` y `AnalyticsService` importaban un tipo de infraestructura desde un módulo de dominio.

**Fix:** Movido a `src/common/types/shared.types.ts` junto con `buildPaginatedResult()` y `clampLimit()`. Todos los servicios actualizados.

---

#### 7. `TaskReminderProcessor` inyectaba `NotificationsService` y `EmailService` directamente
**Problema:** Los processors deben ser consumidores de colas puros — nunca deben tener side-effects directos. El processor llamaba servicios directamente, rompiendo el patrón `Listener → Queue → Processor`.

**Fix:** Eliminadas ambas dependencias del constructor. El processor solo enqueue jobs (`emailQueue`, `notificationQueue`) — nunca ejecuta la lógica de envío.

---

#### 8. N+1 en `NotificationEmailListener.onDealAssigned()`
**Problema:** Se hacían 2 queries secuenciales: primero el assignee, luego el actor. Innecesario.

**Fix:** El `actorName` ahora se embebe en `DealAssignedEvent` (resuelto en `DealsService` antes de emitir). El listener hace una sola query para el assignee.

---

#### 9. N+1 en `NotificationEmailListener.onTaskCreated()`
**Problema:** `assignee` y `task` se buscaban secuencialmente.

**Fix:** `Promise.all([findFirst(assignee), findFirst(task)])` — paralelo.

---

#### 10. Query de selección sin `select` en `JwtAccessStrategy`
**Problema:** `findFirst()` cargaba el modelo `User` completo (incluida la contraseña hasheada) solo para verificar `isActive`.

**Fix:** `select: { id: true, isActive: true, role: true }` — carga mínima.

---

#### 11. `delay <= 0` no manejado en `TaskReminderProcessor`
**Problema:** Si `dueDate` ya había pasado, `Math.max(0, fireAt - now)` retornaba 0 y se encolaba un job con delay 0 que se ejecutaría inmediatamente, enviando un recordatorio de una tarea ya vencida.

**Fix:** Si `delay <= 0` el job se descarta con un warning en lugar de encolarse.

---

### 🟡 MENORES (calidad / observabilidad)

#### 12. `AllExceptionsFilter` exponía mensajes internos en producción
**Fix:** Mensajes genéricos (`'Internal server error'`) cuando `NODE_ENV === 'production'`. En desarrollo muestra el mensaje real. Se agregó manejo de `P2003` y `P2014` de Prisma con mensajes útiles.

#### 13. `PrismaService` logueaba todas las queries en producción
**Fix:** Query logging solo en desarrollo. Slow query warning (> 500 ms) en desarrollo.

#### 14. `config.validation.ts` no validaba variables de email y Redis
**Fix:** Variables opcionales con defaults sensibles. Mejor mensaje de error (lista de violations, no `.toString()`).

#### 15. `AutomationListener` no tenía task para `CLOSED_LOST`
**Fix:** Ahora crea tarea "Post-mortem: [deal title]" con due date en 7 días cuando un deal se pierde.

#### 16. Loggers faltantes en `DealsService`, `TasksService`, `ReportsService`
**Fix:** `private readonly logger = new Logger(ClassName.name)` añadido en los 3 servicios.

#### 17. `generateSlug` duplicada entre `AuthService` y posibles futuros usos
**Nota:** Mantenida inline por ahora — candidata a mover a `shared.types.ts` cuando se use en un segundo lugar.

---

## Archivos modificados

| Archivo | Tipo de cambio |
|---|---|
| `src/common/types/shared.types.ts` | **NUEVO** — PaginatedResult, SafeUser, generateSecurePassword |
| `src/common/guards/tenant.guard.ts` | **NUEVO** — assertSameTenant helper |
| `src/auth/auth.service.ts` | Timing attack fixes, org enumeration fix |
| `src/auth/strategies/jwt-access.strategy.ts` | Rol desde BD, select mínimo |
| `src/modules/users/users.service.ts` | Scoped mutations, crypto password, DB-level select |
| `src/modules/clients/clients.service.ts` | Shared types, select mínimo en assertBelongsToOrg |
| `src/modules/deals/deals.service.ts` | actorName en DealAssignedEvent, Logger |
| `src/modules/tasks/tasks.service.ts` | Shared types, Logger |
| `src/modules/reports/reports.service.ts` | Logger |
| `src/queues/processors/task-reminder.processor.ts` | Eliminar inyecciones directas, fix delay ≤ 0 |
| `src/queues/queues.module.ts` | Eliminar imports innecesarios |
| `src/events/events/domain.events.ts` | actorName en DealAssignedEvent |
| `src/events/listeners/automation.listener.ts` | CLOSED_LOST task, refactor |
| `src/events/listeners/notification-email.listener.ts` | Eliminar actor lookup, parallel queries |
| `src/common/filters/all-exceptions.filter.ts` | Production-safe messages, richer Prisma errors |
| `src/config/config.validation.ts` | Full env coverage, better error output |
| `src/prisma/prisma.service.ts` | Prod-silent queries, slow query warning |
| `src/main.ts` | Configurable CORS, fatal log on boot failure |

---

## Recomendaciones adicionales (nivel senior)

### Para el siguiente sprint

1. **Rate limiting por usuario, no solo por IP**
   El throttler actual limita por IP. Agregar `ThrottlerGuard` con key `${ip}:${userId}` para prevenir que una IP compartida (VPN corporativa) bloquee a múltiples usuarios.

2. **Refresh token rotation con revocación por familia**
   Si un refresh token robado se usa dos veces, el segundo intento debería invalidar TODOS los refresh tokens del usuario (señal de compromiso). Implementar con un `tokenFamily` en BD.

3. **Audit log de acciones sensibles**
   Cambios de rol, desactivación de usuarios e invitaciones deberían generar `Activity` records además de logs. Actualmente solo se loguea al logger.

4. **Health check endpoint**
   `GET /api/v1/health` que verifique conexión a PostgreSQL y Redis. Necesario para load balancers y deployment pipelines.

5. **Paginación por cursor en endpoints de alto volumen**
   `GET /deals` con miles de registros tiene degradación O(n) con offset pagination. Implementar cursor pagination (`createdAt + id`) para `findAll` en deals y clients.

6. **Validación de `organizationSlug` en registro**
   El slug generado automáticamente podría colisionar con slugs reservados (`api`, `admin`, `health`, etc.). Mantener una lista de slugs prohibidos.

7. **Separar workers de la aplicación HTTP**
   En producción, los BullMQ workers deberían correr en procesos separados para que una tormenta de jobs no sature el event loop de la API. Crear `worker.ts` como entrypoint separado.

8. **Monitoreo de colas**
   Integrar Bull Board (`@bull-board/nestjs`) para visualizar el estado de las colas en un dashboard protegido por auth.
