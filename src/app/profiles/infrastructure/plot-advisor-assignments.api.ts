import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PlotAdvisorAssignment } from '../domain/model/entities/plot-advisor-assignment';

/** HTTP contract for plot responsibility, independent of cooperative subscriptions. */
@Injectable({ providedIn: 'root' })
export class PlotAdvisorAssignmentsApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.platformProviderApiBaseUrl}/plot-advisor-assignments`;

  /** Loads responsibility records linked to a producer account. */
  getByProducer(userId: number): Observable<PlotAdvisorAssignment[]> {
    return this.http.get<PlotAdvisorAssignment[]>(this.url, {
      params: new HttpParams().set('producerUserId', userId),
    });
  }

  /** Reads current responsibility before a write; duplicate records require repair. */
  getByPlot(plotId: number): Observable<PlotAdvisorAssignment | null> {
    return this.http
      .get<PlotAdvisorAssignment[]>(this.url, { params: new HttpParams().set('plotId', plotId) })
      .pipe(
        map((items) => {
          if (items.length > 1) throw new Error('profiles.advisory.errors.conflict');
          return items[0] ?? null;
        }),
      );
  }

  /** Saves a single current assignment; history travels in the same JSON resource. */
  save(record: PlotAdvisorAssignment, existing: boolean): Observable<PlotAdvisorAssignment> {
    return existing
      ? this.http.put<PlotAdvisorAssignment>(`${this.url}/${record.id}`, record)
      : this.http.post<PlotAdvisorAssignment>(this.url, record);
  }
}
