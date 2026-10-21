import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CaseAssessment, CaseAssessmentData } from '../domain/model/entities/case-assessment';

/** Persistence contract for immutable case evaluations, separate from prescription issuance. */
@Injectable({ providedIn: 'root' })
export class CaseAssessmentsApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.platformProviderApiBaseUrl}/case-assessments`;

  /** Loads validated assessment history for a single incident. */
  getByReport(reportId: number): Observable<CaseAssessment[]> {
    return this.http
      .get<CaseAssessmentData[]>(this.url, {
        params: new HttpParams().set('reportId', reportId),
      })
      .pipe(map((items) => items.map((item) => new CaseAssessment(item))));
  }

  /** Persists a stable client ID so interrupted writes can be reconciled before retrying. */
  record(data: CaseAssessmentData): Observable<CaseAssessment> {
    return this.http
      .post<CaseAssessmentData>(this.url, new CaseAssessment(data).data)
      .pipe(map((item) => new CaseAssessment(item)));
  }
}
