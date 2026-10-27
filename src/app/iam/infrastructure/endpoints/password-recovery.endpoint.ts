import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { RequestPasswordResetCommand } from '../../domain/model/commands/request-password-reset.command';
import { ResetPasswordCommand } from '../../domain/model/commands/reset-password.command';
import { PasswordRecoveryAssembler } from '../assemblers/password-recovery.assembler';

/** Recovery HTTP operations; endpoint paths and empty success responses are provisional. */
export class PasswordRecoveryApiEndpoint {
  private readonly endpointUrl =
    `${environment.platformProviderApiBaseUrl}` +
    `${environment.platformProviderPasswordRecoveryEndpointPath}`;

  private readonly assembler = new PasswordRecoveryAssembler();

  constructor(private readonly http: HttpClient) {}

  requestReset(command: RequestPasswordResetCommand): Observable<void> {
    return this.http.post<void>(this.endpointUrl, this.assembler.toForgotPasswordRequest(command));
  }

  reset(command: ResetPasswordCommand): Observable<void> {
    return this.http.post<void>(
      `${this.endpointUrl}/reset`,
      this.assembler.toResetPasswordRequest(command),
    );
  }
}
