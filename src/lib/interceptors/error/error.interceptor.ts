import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { catchError, Observable, throwError } from 'rxjs';

import { handlePrismaError } from './prisma-error';
import { Prisma } from 'prisma/generated/client';

function doException(err: any) {
  try {
    // Prisma
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      return handlePrismaError(err);
    }

    // Autres erreurs personnalisées
    if (err.status === 'error') {
      return new HttpException(
        {
          statusCode: HttpStatus.BAD_GATEWAY,
          message: 'Something went wrong',
        },
        HttpStatus.BAD_GATEWAY,
      );
    }

    // Fallback générique
    const statusCode = err.status || HttpStatus.BAD_REQUEST;
    const message = err.message || 'Bad Request';
    const details = err.response || {};

    return new HttpException(
      {
        statusCode,
        message,
        details,
      },
      statusCode,
    );
  } catch {
    return new HttpException(
      {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Erreur interne inattendue',
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

@Injectable()
export class ErrorInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next
      .handle()
      .pipe(catchError((err) => throwError(() => doException(err))));
  }
}
