import { HttpErrors } from '@loopback/rest';

export class ApiError {
  static notFound(message: string = 'Entity not found'): Error {
    return new HttpErrors.NotFound(message);
  }

  static badRequest(message: string = 'Bad request'): Error {
    return new HttpErrors.BadRequest(message);
  }

  static forbidden(message: string = 'Access forbidden'): Error {
    return new HttpErrors.Forbidden(message);
  }
}
