import { DealStage } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';

/**
 * Valid forward and backward transitions for the sales pipeline.
 *
 * LEAD → CONTACTED → NEGOTIATION → CLOSED_WON
 *                                 → CLOSED_LOST
 *
 * Backward moves are permitted (e.g. re-opening a lost deal).
 * The only hard rule: a CLOSED deal cannot move to another CLOSED state
 * without first going back to NEGOTIATION.
 */
const ALLOWED_TRANSITIONS: Record<DealStage, DealStage[]> = {
  [DealStage.LEAD]: [DealStage.CONTACTED, DealStage.CLOSED_LOST],
  [DealStage.CONTACTED]: [DealStage.LEAD, DealStage.NEGOTIATION, DealStage.CLOSED_LOST],
  [DealStage.NEGOTIATION]: [DealStage.CONTACTED, DealStage.CLOSED_WON, DealStage.CLOSED_LOST],
  [DealStage.CLOSED_WON]: [DealStage.NEGOTIATION],
  [DealStage.CLOSED_LOST]: [DealStage.NEGOTIATION],
};

export function assertValidTransition(from: DealStage, to: DealStage): void {
  if (from === to) {
    throw new BadRequestException(`Deal is already in stage "${to}"`);
  }

  const allowed = ALLOWED_TRANSITIONS[from];
  if (!allowed.includes(to)) {
    throw new BadRequestException(
      `Cannot transition from "${from}" to "${to}". ` +
        `Allowed transitions from "${from}": ${allowed.join(', ')}`,
    );
  }
}

export function isClosed(stage: DealStage): boolean {
  return stage === DealStage.CLOSED_WON || stage === DealStage.CLOSED_LOST;
}
