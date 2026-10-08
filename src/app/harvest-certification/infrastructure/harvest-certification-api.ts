import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { IssueQualityCertificateCommand } from '../domain/model/commands/issue-quality-certificate.command';
import { RegisterHarvestBatchCommand } from '../domain/model/commands/register-harvest-batch.command';
import { HarvestBatch, HarvestBatchProps } from '../domain/model/entities/harvest-batch.entity';
import { PublicTraceabilityRecord } from '../domain/model/entities/public-traceability-record.entity';
import { QualityCertificate } from '../domain/model/entities/quality-certificate.entity';
import { HarvestBatchesApiEndpoint } from './endpoints/harvest-batches.endpoint';
import { PublicTraceabilityApiEndpoint } from './endpoints/public-traceability.endpoint';
import { QualityCertificatesApiEndpoint } from './endpoints/quality-certificates.endpoint';

/** Socio y parcelas de origen disponibles para el formulario de acopio. */
export interface CooperativeMemberOption {
  id: number;
  cooperativeId: number;
  name: string;
  plots: { id: number; name: string; region: string; coordinates: string; campaignId: number; variety: string; cropType: HarvestBatchProps['cropType'] }[];
}

/** Fachada de acceso a socios, lotes, certificados y trazabilidad pública. */
@Service()
export class HarvestCertificationApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.platformProviderApiBaseUrl;
  private readonly batches = new HarvestBatchesApiEndpoint(this.http);
  private readonly certificates = new QualityCertificatesApiEndpoint(this.http);
  private readonly traceability = new PublicTraceabilityApiEndpoint(this.http);

  /** Carga socios y parcelas disponibles para una cooperativa. */
  getMembers(cooperativeId: number): Observable<CooperativeMemberOption[]> {
    const params = new HttpParams().set('cooperativeId', cooperativeId);
    return this.http.get<CooperativeMemberOption[]>(`${this.baseUrl}${environment.platformProviderCooperativeMembersEndpointPath}`, { params });
  }

  getBatches(cooperativeId: number): Observable<HarvestBatch[]> {
    return this.batches.getByCooperative(cooperativeId);
  }

  createBatch(batch: RegisterHarvestBatchCommand): Observable<HarvestBatch> {
    return this.batches.register(batch);
  }

  updateBatch(batch: HarvestBatchProps): Observable<HarvestBatch> {
    return this.batches.update(new HarvestBatch(batch), batch.id);
  }

  getCertificates(): Observable<QualityCertificate[]> {
    return this.certificates.getAll();
  }

  createCertificate(certificate: IssueQualityCertificateCommand): Observable<QualityCertificate> {
    return this.certificates.issue(certificate);
  }

  verifyCertificate(token: string): Observable<QualityCertificate | null> {
    return this.certificates.getByToken(token);
  }

  getBatch(id: number): Observable<HarvestBatch> {
    return this.batches.getById(id);
  }

  /** Consulta el registro público por token; el endpoint une lote y certificado. */
  getPublicTraceability(token: string): Observable<PublicTraceabilityRecord | null> {
    return this.traceability.getByToken(token);
  }
}
