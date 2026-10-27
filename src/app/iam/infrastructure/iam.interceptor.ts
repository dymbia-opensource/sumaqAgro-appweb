import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { IamStore } from '../application/iam.store';

const apiBaseUrl = environment.platformProviderApiBaseUrl.replace(/\/+$/, '');

const publicAuthenticationUrls = new Set([
  `${apiBaseUrl}${environment.platformProviderSignInEndpointPath}`,
  `${apiBaseUrl}${environment.platformProviderSignUpEndpointPath}`,
  `${apiBaseUrl}${environment.platformProviderPasswordRecoveryEndpointPath}`,
]);

/**
 * Adds bearer credentials to requests targeting the platform API.
 */
export const iamInterceptor: HttpInterceptorFn = (request, next) => {
  const requestUrl = request.url.split(/[?#]/, 1)[0];

  const targetsPlatformApi = requestUrl === apiBaseUrl || requestUrl.startsWith(`${apiBaseUrl}/`);

  if (!targetsPlatformApi || publicAuthenticationUrls.has(requestUrl)) {
    return next(request);
  }

  const store = inject(IamStore);
  store.checkSessionExpiration();
  const token = store.currentToken();

  if (!token || request.headers.has('Authorization')) {
    return next(request);
  }

  return next(
    request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    }),
  );
};
