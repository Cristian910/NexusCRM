import { BadRequestException } from '@nestjs/common';
import { DealStage } from '@prisma/client';
import { assertValidTransition, isClosed } from '../deal-stage.rules';

describe('deal-stage.rules', () => {
  describe('assertValidTransition', () => {
    // ─── Valid forward transitions ──────────────────────────────────────────
    it('LEAD → CONTACTED is valid', () => {
      expect(() => assertValidTransition(DealStage.LEAD, DealStage.CONTACTED)).not.toThrow();
    });

    it('CONTACTED → NEGOTIATION is valid', () => {
      expect(() => assertValidTransition(DealStage.CONTACTED, DealStage.NEGOTIATION)).not.toThrow();
    });

    it('NEGOTIATION → CLOSED_WON is valid', () => {
      expect(() =>
        assertValidTransition(DealStage.NEGOTIATION, DealStage.CLOSED_WON),
      ).not.toThrow();
    });

    it('NEGOTIATION → CLOSED_LOST is valid', () => {
      expect(() =>
        assertValidTransition(DealStage.NEGOTIATION, DealStage.CLOSED_LOST),
      ).not.toThrow();
    });

    // ─── Valid backward (re-open) transitions ──────────────────────────────
    it('CLOSED_LOST → NEGOTIATION is valid (re-open)', () => {
      expect(() =>
        assertValidTransition(DealStage.CLOSED_LOST, DealStage.NEGOTIATION),
      ).not.toThrow();
    });

    it('CLOSED_WON → NEGOTIATION is valid (re-open)', () => {
      expect(() =>
        assertValidTransition(DealStage.CLOSED_WON, DealStage.NEGOTIATION),
      ).not.toThrow();
    });

    it('CONTACTED → LEAD is valid (backtrack)', () => {
      expect(() => assertValidTransition(DealStage.CONTACTED, DealStage.LEAD)).not.toThrow();
    });

    // ─── Invalid transitions ────────────────────────────────────────────────
    it('LEAD → CLOSED_WON is invalid (skip stages)', () => {
      expect(() => assertValidTransition(DealStage.LEAD, DealStage.CLOSED_WON)).toThrow(
        BadRequestException,
      );
    });

    it('LEAD → NEGOTIATION is invalid (skip CONTACTED)', () => {
      expect(() => assertValidTransition(DealStage.LEAD, DealStage.NEGOTIATION)).toThrow(
        BadRequestException,
      );
    });

    it('CLOSED_WON → CLOSED_LOST is invalid (closed to closed)', () => {
      expect(() => assertValidTransition(DealStage.CLOSED_WON, DealStage.CLOSED_LOST)).toThrow(
        BadRequestException,
      );
    });

    it('same stage throws BadRequestException', () => {
      expect(() => assertValidTransition(DealStage.NEGOTIATION, DealStage.NEGOTIATION)).toThrow(
        BadRequestException,
      );
    });
  });

  describe('isClosed', () => {
    it('returns true for CLOSED_WON', () => {
      expect(isClosed(DealStage.CLOSED_WON)).toBe(true);
    });

    it('returns true for CLOSED_LOST', () => {
      expect(isClosed(DealStage.CLOSED_LOST)).toBe(true);
    });

    it('returns false for LEAD', () => {
      expect(isClosed(DealStage.LEAD)).toBe(false);
    });

    it('returns false for NEGOTIATION', () => {
      expect(isClosed(DealStage.NEGOTIATION)).toBe(false);
    });
  });
});
