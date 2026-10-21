import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  TreatmentFollowUp,
  TreatmentFollowUpData,
} from '../domain/model/entities/treatment-follow-up';

/** HTTP adapter for immutable farmer evidence, independently of the prescription itself. */
@Injectable({ providedIn: 'root' })
export class TreatmentFollowUpsApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.platformProviderApiBaseUrl}/treatment-follow-ups`;

  /** Loads evidence for one report, validating every returned resource. */
  getByReport(reportId: number): Observable<TreatmentFollowUp[]> {
    return this.http
      .get<TreatmentFollowUpData[]>(this.url, {
        params: new HttpParams().set('reportId', reportId),
      })
      .pipe(map((items) => items.map((item) => new TreatmentFollowUp(item))));
  }

  /** Sends evidence with a stable client ID, allowing a failed response to be reconciled. */
  record(data: TreatmentFollowUpData): Observable<TreatmentFollowUp> {
    return this.http
      .post<TreatmentFollowUpData>(this.url, new TreatmentFollowUp(data).data)
      .pipe(map((item) => new TreatmentFollowUp(item)));
  }
}
