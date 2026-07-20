import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

@Injectable()
export class SanitizePipe implements PipeTransform {
  transform(value: unknown, _metadata: ArgumentMetadata): unknown {
    if (typeof value === 'string') {
      return this.sanitizeString(value);
    }

    if (typeof value === 'object' && value !== null) {
      return this.sanitizeObject(value as Record<string, unknown>);
    }

    return value;
  }

  private sanitizeString(value: string): string {
    return value.trim();
  }

  private sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};

    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (typeof val === 'string') {
        sanitized[key] = this.sanitizeString(val);
      } else if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
        sanitized[key] = this.sanitizeObject(val as Record<string, unknown>);
      } else {
        sanitized[key] = val;
      }
    }

    return sanitized;
  }
}
