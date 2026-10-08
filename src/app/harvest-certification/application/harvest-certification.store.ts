import { computed, inject, Service, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { RegisterHarvestBatchCommand } from '../domain/model/commands/register-harvest-batch.command';
import { IssueQualityCertificateCommand } from '../domain/model/commands/issue-quality-certificate.command';
import { HarvestBatch } from '../domain/model/entities/harvest-batch.entity';
import { QualityCertificate } from '../domain/model/entities/quality-certificate.entity';
import { CooperativeMemberOption, HarvestCertificationApi } from '../infrastructure/harvest-certification-api';

/** Estado y operaciones que necesita la pantalla de certificación. */
@Service()
export class HarvestCertificationStore {
  private readonly api = inject(HarvestCertificationApi);
  // Las señales privadas se actualizan aquí; la vista solo recibe versiones de lectura.
  private readonly batchesSignal = signal<HarvestBatch[]>([]);
  private readonly certificatesSignal = signal<QualityCertificate[]>([]);
  private readonly membersSignal = signal<CooperativeMemberOption[]>([]);
  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly batches = this.batchesSignal.asReadonly();
  readonly certificates = this.certificatesSignal.asReadonly();
  readonly members = this.membersSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly activeCertificates = computed(() => this.certificates().filter((item) => item.data.status === 'ACTIVE'));

  /** Carga en paralelo lotes, certificados y socios de la cooperativa. */
  load(cooperativeId = 1): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    forkJoin({ batches: this.api.getBatches(cooperativeId), certificates: this.api.getCertificates(), members: this.api.getMembers(cooperativeId) }).subscribe({
      next: ({ batches, certificates, members }) => {
        this.batchesSignal.set(batches);
        this.certificatesSignal.set(certificates);
        this.membersSignal.set(members);
        this.loadingSignal.set(false);
      },
      error: (error: Error) => this.fail(error),
    });
  }

  /** Guarda un lote y lo añade al estado local cuando la API responde. */
  register(batch: RegisterHarvestBatchCommand, onSuccess: (saved: HarvestBatch) => void): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api.createBatch(batch).subscribe({
      next: (saved) => {
        this.batchesSignal.update((items) => [saved, ...items]);
        this.loadingSignal.set(false);
        onSuccess(saved);
      },
      error: (error: Error) => this.fail(error),
    });
  }

  /** Emite el certificado y después marca el lote como certificado. */
  certify(batch: HarvestBatch, data: IssueQualityCertificateCommand, onSuccess: () => void): void {
    if (!batch.canIssueCertificate) {
      this.errorSignal.set('harvest-certification.errors.batch-not-graded');
      return;
    }
    // Impide emitir otro certificado para un lote que ya aparece en el estado cargado.
    if (this.certificates().some((item) => item.data.harvestBatchId === batch.id)) {
      this.errorSignal.set('harvest-certification.errors.already-certified');
      return;
    }
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api.createCertificate(data).subscribe({
      next: (certificate) => {
        this.certificatesSignal.update((items) => [certificate, ...items]);
        // La API de prueba requiere una segunda petición para actualizar el estado del lote.
        this.api.updateBatch({ ...batch.data, status: 'CERTIFIED' }).subscribe({
          next: (updated) => {
            this.batchesSignal.update((items) => items.map((item) => item.id === updated.id ? updated : item));
            this.loadingSignal.set(false);
            onSuccess();
          },
          error: (error: Error) => {
            this.fail(error);
            onSuccess();
          },
        });
      },
      error: (error: Error) => this.fail(error),
    });
  }

  /** Presenta los errores de la API en el estado de la pantalla. */
  private fail(error: Error): void {
    this.errorSignal.set(error.message);
    this.loadingSignal.set(false);
  }
}
