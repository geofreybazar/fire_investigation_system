import { HttpException, HttpStatus } from '@nestjs/common';

export class TokenExpiredException extends HttpException {
  constructor(name: string, message: string) {
    super(
      {
        statusCode: HttpStatus.UNAUTHORIZED,
        error: name,
        message,
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}
