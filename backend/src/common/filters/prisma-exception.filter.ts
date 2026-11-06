// common/filters/prisma-exception.filter.ts
import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Prisma } from '../../generated/prisma/client.js';

interface DriverAdapterErrorCause {
  originalCode?: string;
  originalMessage?: string;
  constraint?: {
    index: string;
  };
  table?: string;
}

function getDriverCause(meta: unknown): DriverAdapterErrorCause | undefined {
  return (meta as any)?.driverAdapterError?.cause;
}

function getConstraintName(cause?: DriverAdapterErrorCause): string {
  if (!cause) return 'field';

  if (cause.constraint) {
    return typeof cause.constraint === 'string'
      ? cause.constraint
      : (cause.constraint.index ?? 'field');
  }

  if (cause.originalMessage) {
    const match = cause.originalMessage.match(/constraint "([^"]+)"/);
    if (match) return match[1];
  }

  return 'field';
}

// Prisma default naming convention: ModelName_columnName_key
function humanize(constraint: string): string {
  const match = constraint.match(/^[A-Za-z]+_(.+)_key$/);
  return match ? match[1] : constraint;
}

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter extends BaseExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const cause = getDriverCause(exception.meta);

    switch (exception.code) {
      case 'P2002': {
        const field = humanize(getConstraintName(cause));
        return super.catch(
          new ConflictException(`A record with this ${field} already exists`),
          host,
        );
      }

      case 'P2025': {
        return super.catch(new NotFoundException('Record not found'), host);
      }

      case 'P2003': {
        return super.catch(
          new BadRequestException('Related record does not exist'),
          host,
        );
      }

      case 'P2014': {
        return super.catch(
          new BadRequestException(
            'The change would violate a required relation',
          ),
          host,
        );
      }

      case 'P2011': {
        const field = humanize(getConstraintName(cause));
        return super.catch(
          new BadRequestException(`${field} cannot be null`),
          host,
        );
      }

      default: {
        // Unhandled Prisma error code — fall back to default 500 handling
        return super.catch(exception, host);
      }
    }
  }
}
