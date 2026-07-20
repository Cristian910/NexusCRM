import { ForbiddenException } from '@nestjs/common';
import { JwtPayload } from '@/auth/interfaces/jwt-payload.interface';

/**
 * Call this at the top of any service method that receives an ID from the
 * outside world to ensure the requester can only operate within their org.
 *
 * Usage:
 *   assertSameTenant(requester.organizationId, resourceOrgId);
 *
 * Throws ForbiddenException if the IDs don't match, preventing cross-tenant
 * data access even if a valid JWT is presented for a different organization.
 */
export function assertSameTenant(requesterOrgId: string, resourceOrgId: string): void {
  if (requesterOrgId !== resourceOrgId) {
    throw new ForbiddenException('Access denied: cross-tenant operation not permitted');
  }
}

/**
 * Extract organizationId from a JWT payload and assert it matches the
 * expected org, useful when validating request context in services.
 */
export function assertRequesterInOrg(requester: JwtPayload, expectedOrgId: string): void {
  assertSameTenant(requester.organizationId, expectedOrgId);
}
