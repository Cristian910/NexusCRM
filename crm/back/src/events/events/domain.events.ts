import { DealStage } from '@prisma/client';

/**
 * Base class for all domain events.
 * Every event carries the actor and tenant context so listeners
 * never need to re-fetch that information.
 */
export abstract class DomainEvent {
  readonly occurredAt: Date = new Date();

  constructor(
    public readonly organizationId: string,
    public readonly actorId: string,
  ) {}
}

// ─── Client events ────────────────────────────────────────────────────────────

export class ClientCreatedEvent extends DomainEvent {
  constructor(
    public readonly clientId: string,
    public readonly clientName: string,
    organizationId: string,
    actorId: string,
  ) {
    super(organizationId, actorId);
  }
}

export class ClientUpdatedEvent extends DomainEvent {
  constructor(
    public readonly clientId: string,
    public readonly clientName: string,
    organizationId: string,
    actorId: string,
  ) {
    super(organizationId, actorId);
  }
}

export class ClientArchivedEvent extends DomainEvent {
  constructor(
    public readonly clientId: string,
    public readonly clientName: string,
    organizationId: string,
    actorId: string,
  ) {
    super(organizationId, actorId);
  }
}

// ─── Deal events ──────────────────────────────────────────────────────────────

export class DealCreatedEvent extends DomainEvent {
  constructor(
    public readonly dealId: string,
    public readonly dealTitle: string,
    public readonly assignedToId: string | null,
    organizationId: string,
    actorId: string,
  ) {
    super(organizationId, actorId);
  }
}

export class DealUpdatedEvent extends DomainEvent {
  constructor(
    public readonly dealId: string,
    public readonly dealTitle: string,
    organizationId: string,
    actorId: string,
  ) {
    super(organizationId, actorId);
  }
}

export class DealStageChangedEvent extends DomainEvent {
  constructor(
    public readonly dealId: string,
    public readonly dealTitle: string,
    public readonly fromStage: DealStage,
    public readonly toStage: DealStage,
    public readonly assignedToId: string | null,
    organizationId: string,
    actorId: string,
  ) {
    super(organizationId, actorId);
  }
}

export class DealAssignedEvent extends DomainEvent {
  constructor(
    public readonly dealId: string,
    public readonly dealTitle: string,
    public readonly assignedToId: string,
    /** Name of the user who made the assignment — embedded to avoid extra DB lookup in listeners */
    public readonly actorName: string,
    organizationId: string,
    actorId: string,
  ) {
    super(organizationId, actorId);
  }
}

// ─── Task events ──────────────────────────────────────────────────────────────

export class TaskCreatedEvent extends DomainEvent {
  constructor(
    public readonly taskId: string,
    public readonly taskTitle: string,
    public readonly dealId: string | null,
    public readonly assignedToId: string | null,
    organizationId: string,
    actorId: string,
  ) {
    super(organizationId, actorId);
  }
}

export class TaskCompletedEvent extends DomainEvent {
  constructor(
    public readonly taskId: string,
    public readonly taskTitle: string,
    organizationId: string,
    actorId: string,
  ) {
    super(organizationId, actorId);
  }
}

export class TaskCancelledEvent extends DomainEvent {
  constructor(
    public readonly taskId: string,
    public readonly taskTitle: string,
    organizationId: string,
    actorId: string,
  ) {
    super(organizationId, actorId);
  }
}
