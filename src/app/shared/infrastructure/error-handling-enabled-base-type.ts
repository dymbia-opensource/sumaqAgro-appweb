import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';

/**
 * Base type that turns HTTP errors into readable error messages.
 *
 * @remarks
 * Every API class inherits from it, so HTTP errors are handled in one place.
 */
export abstract class ErrorHandlingEnabledBaseType {
  /**
   * Builds an error handler for one operation, to be used with `catchError`.
   * @param operation - Description of the operation that failed.
   */
  protected handleError(operation: string): (error: HttpErrorResponse) => Observable<never> {
    return (error: HttpErrorResponse): Observable<never> => {
      let errorMessage: string;
      if (error.status === 0) {
        errorMessage = `${operation}: no connection to the server`;
      } else if (error.status === 404) {
        errorMessage = `${operation}: resource not found`;
      } else if (error.error instanceof ErrorEvent) {
        errorMessage = `${operation}: ${error.error.message}`;
      } else {
        errorMessage = `${operation}: ${error.status || 'unexpected error'}`;
      }
      return throwError(() => new Error(errorMessage));
    };
  }
}
