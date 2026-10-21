import { computed, inject, Injectable, signal } from '@angular/core';
import { defer, map, Observable, of, switchMap, tap } from 'rxjs';
import { DemoSessionService } from '../../shared/application/demo-session.service';
import { fromApiDate, toApiDate } from '../../shared/infrastructure/api-date';
import { FieldManagementApi } from '../infrastructure/field-management-api';
import { FieldPlot } from '../domain/model/entities/field-plot.entity';
import { CropCampaign } from '../domain/model/entities/crop-campaign.entity';
import { CampaignLedger } from '../domain/model/entities/campaign-ledger.entity';
import { CropType } from '../domain/model/entities/crop-type';
import { YieldUnit } from '../domain/model/entities/yield-unit';
import { RegisterFieldPlotCommand } from '../domain/model/commands/register-field-plot.command';
import { StartCropCampaignCommand } from '../domain/model/commands/start-crop-campaign.command';
import { OpenCampaignLedgerCommand } from '../domain/model/commands/open-campaign-ledger.command';
import type { CropCampaignSetup } from './field-management.store';

/** Versioned local draft retaining the original operation key across reloads and lost responses. */
export interface FieldCreationDraft {
  version: 1;
  id: string;
  ownerUserId: number;
  mode: 'REGISTRATION' | 'CAMPAIGN';
  step: 'PLOT' | 'CAMPAIGN' | 'LEDGER';
  plot?: { name: string; region: string; declaredAreaHectares: number };
  plotId?: number;
  campaignId?: number;
  ledgerId?: number;
  season: string;
  cropType: CropType;
  variety: string;
  custom: boolean;
  sowingDate: string;
  expectedYield?: number;
  yieldUnit?: YieldUnit;
}

/** Confirmed aggregate chain returned only after every required resource has been reconciled. */
export interface FieldCreationResult {
  plot: FieldPlot;
  campaign: CropCampaign;
  ledger: CampaignLedger;
}

const STORAGE_KEY = 'sumaq-agro-field-creation-v1';

/**
 * Reconciles demo creation requests by durable operation IDs instead of repeating blind POSTs.
 * @remarks The API must retain clientSyncId. Production must enforce unique keys and
 * parent relationships transactionally; this adapter cannot serialize different devices.
 */
@Injectable({ providedIn: 'root' })
export class FieldCreationRecovery {
  private readonly api = inject(FieldManagementApi);
  private readonly session = inject(DemoSessionService);
  private readonly state = signal<FieldCreationDraft[]>([]);
  readonly storageError = signal(false);
  readonly draft = computed(() =>
    this.session.activeUser()?.experience === 'FARMER'
      ? (this.state().find((item) => item.ownerUserId === this.session.activeUser()?.id) ?? null)
      : null,
  );

  constructor() {
    this.refresh();
  }

  /** Reloads persisted drafts without silently discarding corrupt or inaccessible storage. */
  refresh(): void {
    try {
      this.state.set(this.read());
      this.storageError.set(false);
    } catch {
      this.storageError.set(true);
    }
  }

  /** Validates the complete setup and durably records it before any resource is written. */
  begin(setup: CropCampaignSetup, command?: RegisterFieldPlotCommand): FieldCreationDraft {
    const user = this.session.activeUser();
    if (user?.experience !== 'FARMER' || (command && command.ownerUserId !== user.id))
      this.denied();
    const draft: FieldCreationDraft = {
      version: 1,
      id: crypto.randomUUID(),
      ownerUserId: user.id,
      mode: command ? 'REGISTRATION' : 'CAMPAIGN',
      step: command ? 'PLOT' : 'CAMPAIGN',
      plot: command
        ? {
            name: command.name,
            region: command.region,
            declaredAreaHectares: command.declaredAreaHectares,
          }
        : undefined,
      plotId: command ? undefined : setup.start.plotId,
      season: setup.start.season,
      cropType: setup.cropType.cropType,
      variety: setup.seedVariety.varietyName,
      custom: setup.seedVariety.custom,
      sowingDate: toApiDate(setup.sowingDate.sowingDate),
      expectedYield: setup.expectedYield?.expectedYield,
      yieldUnit: setup.expectedYield?.unit,
    };
    if (command) FieldPlot.register(command);
    const campaign = this.prepareCampaign(draft, draft.plotId ?? 1, []);
    this.prepareLedger(draft, campaign, 1);
    this.write(draft);
    return draft;
  }

  /**
   * Reads each parent collection before creating the missing child; a lost POST response is reconciled.
   * @param quota - Current demo quota, checked only if this operation has not created its plot.
   * @param onPlot - Updates occupied capacity as soon as the plot is confirmed.
   * @param onCampaign - Updates the visible campaign even if creating its ledger later fails.
   */
  resume(
    quota: number,
    onPlot: (plot: FieldPlot) => void,
    onCampaign: (campaign: CropCampaign) => void,
  ): Observable<FieldCreationResult> {
    return defer(() => {
      this.refresh();
      if (this.storageError()) throw new Error('field-management.errors.recovery-storage');
      const draft = this.draft();
      if (!draft) throw new Error('field-management.errors.recovery-missing');
      const prepared = this.prepareCampaign(draft, draft.plotId ?? 1, []);
      this.prepareLedger(draft, prepared, draft.campaignId ?? 1);
      const user = this.session.activeUser();
      const check = () => {
        if (
          user !== this.session.activeUser() ||
          this.session.activeUser()?.id !== draft.ownerUserId
        )
          this.denied();
      };
      return this.api.getPlotsByOwner(draft.ownerUserId).pipe(
        switchMap((rows) => {
          check();
          const owned = rows.filter((plot) => plot.ownerUserId === draft.ownerUserId);
          const matches =
            draft.mode === 'CAMPAIGN'
              ? owned.filter((plot) => plot.id === draft.plotId)
              : owned.filter((plot) => plot.clientSyncId === draft.id);
          if (
            matches.length > 1 ||
            (draft.plotId && !matches.some((plot) => plot.id === draft.plotId))
          )
            this.conflict();
          if (matches[0]) return of(matches[0]);
          if (draft.mode !== 'REGISTRATION' || !draft.plot) this.conflict();
          if (new Set(owned.map((plot) => plot.id)).size >= quota)
            throw new Error('field-management.errors.quota-reached');
          check();
          return this.api.createPlot(
            FieldPlot.register(
              new RegisterFieldPlotCommand({ ...draft.plot, ownerUserId: draft.ownerUserId }),
              draft.id,
            ),
          );
        }),
        tap((plot) => {
          check();
          if (
            plot.ownerUserId !== draft.ownerUserId ||
            (draft.mode === 'REGISTRATION' && plot.clientSyncId !== draft.id)
          )
            this.conflict();
          draft.plotId = Number(plot.id);
          draft.step = 'CAMPAIGN';
          this.write(draft);
          onPlot(plot);
        }),
        switchMap((plot) =>
          this.api.getCampaignsByPlot(Number(plot.id)).pipe(
            switchMap((campaigns) => {
              check();
              const scoped = campaigns.filter((item) => item.plotId === plot.id);
              const matches = scoped.filter((item) => item.clientSyncId === draft.id);
              if (
                matches.length > 1 ||
                (draft.campaignId && !matches.some((item) => item.id === draft.campaignId))
              )
                this.conflict();
              if (matches[0]) return of(matches[0]);
              return this.api.createCampaign(this.prepareCampaign(draft, Number(plot.id), scoped));
            }),
            tap((campaign) => {
              check();
              if (campaign.plotId !== plot.id || campaign.clientSyncId !== draft.id)
                this.conflict();
              draft.campaignId = Number(campaign.id);
              draft.step = 'LEDGER';
              this.write(draft);
              onCampaign(campaign);
            }),
            switchMap((campaign) =>
              this.api.getLedgerByCampaign(Number(campaign.id)).pipe(
                switchMap((ledger) => {
                  check();
                  if (draft.ledgerId && ledger?.id !== draft.ledgerId) this.conflict();
                  return ledger
                    ? of(ledger)
                    : this.api.createLedger(
                        this.prepareLedger(draft, campaign, Number(campaign.id)),
                      );
                }),
                map((ledger) => {
                  check();
                  if (ledger.campaignId !== campaign.id) this.conflict();
                  draft.ledgerId = Number(ledger.id);
                  this.write(draft);
                  this.finish(draft);
                  return { plot, campaign, ledger };
                }),
              ),
            ),
          ),
        ),
      );
    });
  }

  private prepareCampaign(
    draft: FieldCreationDraft,
    plotId: number,
    existing: CropCampaign[],
  ): CropCampaign {
    if (
      !Object.values(CropType).includes(draft.cropType) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(draft.sowingDate)
    )
      this.conflict();
    const campaign = CropCampaign.start(
      new StartCropCampaignCommand({ plotId, season: draft.season }),
      existing,
      draft.id,
    );
    campaign.selectCropType(draft.cropType);
    campaign.specifySeedVariety(draft.variety, draft.custom);
    campaign.recordSowingDate(fromApiDate(draft.sowingDate));
    return campaign;
  }
  private prepareLedger(
    draft: FieldCreationDraft,
    campaign: CropCampaign,
    campaignId: number,
  ): CampaignLedger {
    const ledger = CampaignLedger.open(
      new OpenCampaignLedgerCommand({
        campaignId,
        yieldUnit: CampaignLedger.yieldUnitOf(campaign.cropType),
      }),
    );
    if (draft.expectedYield !== undefined)
      ledger.setExpectedYield(draft.expectedYield, ledger.yieldUnit);
    return ledger;
  }
  private read(): FieldCreationDraft[] {
    const data: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    if (
      !Array.isArray(data) ||
      data.some(
        (item) =>
          !item ||
          item.version !== 1 ||
          typeof item.id !== 'string' ||
          !item.id ||
          !Number.isSafeInteger(item.ownerUserId) ||
          item.ownerUserId <= 0 ||
          !['REGISTRATION', 'CAMPAIGN'].includes(item.mode) ||
          !['PLOT', 'CAMPAIGN', 'LEDGER'].includes(item.step),
      )
    )
      throw new Error('field-management.errors.recovery-storage');
    return data;
  }
  private write(draft: FieldCreationDraft): void {
    try {
      const drafts = this.read();
      if (drafts.some((item) => item.ownerUserId === draft.ownerUserId && item.id !== draft.id))
        this.conflict();
      const next = [
        ...drafts.filter((item) => item.ownerUserId !== draft.ownerUserId),
        { ...draft },
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      this.state.set(next);
      this.storageError.set(false);
    } catch (error) {
      this.storageError.set(true);
      throw error;
    }
  }
  private finish(draft: FieldCreationDraft): void {
    const next = this.read().filter(
      (item) => !(item.ownerUserId === draft.ownerUserId && item.id === draft.id),
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    this.state.set(next);
  }
  private denied(): never {
    throw new Error('field-management.errors.plot-not-owned');
  }
  private conflict(): never {
    throw new Error('field-management.errors.recovery-conflict');
  }
}
