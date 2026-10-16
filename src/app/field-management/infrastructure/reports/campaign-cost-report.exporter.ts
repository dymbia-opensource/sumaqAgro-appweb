import { toApiDate } from '../../../shared/infrastructure/api-date';
import { CampaignLedger } from '../../domain/model/entities/campaign-ledger.entity';
import { CropCampaign } from '../../domain/model/entities/crop-campaign.entity';
import { FieldPlot } from '../../domain/model/entities/field-plot.entity';
import { BreakevenReport } from '../../domain/model/read-models/breakeven-report';
import { CostPerHectareReport } from '../../domain/model/read-models/cost-per-hectare-report';

/** File produced by an export. */
export interface ExportedFile {
  fileName: string;
  content: Blob;
}

/**
 * Builds the cost report of a campaign as a CSV file (opens in Excel).
 *
 * @remarks
 * With the RESTful API the backend generates the PDF report
 * (`CampaignCostReportGenerator`) and this class is replaced by a download.
 * The CSV uses `;` so Excel in Spanish splits the columns.
 */
export class CampaignCostReportExporter {
  private static readonly SEPARATOR = ';';

  /**
   * Builds the report file.
   * @param plot - Plot of the campaign.
   * @param campaign - The campaign.
   * @param ledger - Its cost ledger.
   */
  export(plot: FieldPlot, campaign: CropCampaign, ledger: CampaignLedger): ExportedFile {
    const breakeven = BreakevenReport.of(ledger);
    const perHectare = CostPerHectareReport.of(ledger, plot.areaHectares);
    const rows: (string | number)[][] = [
      ['SumaqAgro - Campaign cost report'],
      ['Plot', plot.name],
      ['Region', plot.region],
      ['Area (ha)', CampaignCostReportExporter.decimal(plot.areaHectares)],
      ['Season', campaign.season],
      ['Crop', campaign.cropType],
      ['Seed variety', campaign.seedVariety],
      ['Sowing date', campaign.sowingDate ? toApiDate(campaign.sowingDate) : ''],
      ['Status', campaign.status],
      [],
      ['Date', 'Category', 'Description', 'Quantity', 'Unit price', 'Total'],
      ...ledger.entries.map((entry) => [
        toApiDate(entry.expenseDate),
        entry.category,
        entry.description,
        CampaignCostReportExporter.decimal(entry.quantity),
        CampaignCostReportExporter.decimal(entry.unitPrice.amount),
        CampaignCostReportExporter.decimal(entry.total().amount),
      ]),
      [],
      ['Category', 'Total', 'Per hectare', '% of total'],
      ...perHectare.rows.map((row) => [
        row.category,
        CampaignCostReportExporter.decimal(row.total.amount),
        CampaignCostReportExporter.decimal(row.perHectare.amount),
        CampaignCostReportExporter.decimal(row.percentage),
      ]),
      ['TOTAL', CampaignCostReportExporter.decimal(breakeven.totalInvestment.amount), CampaignCostReportExporter.decimal(perHectare.totalPerHectare.amount), '100'],
      [],
      ['Yield unit', ledger.yieldUnit],
      ['Expected yield', CampaignCostReportExporter.decimal(ledger.expectedYield)],
      ['Actual yield', ledger.actualYield === null ? '' : CampaignCostReportExporter.decimal(ledger.actualYield)],
      ['Breakeven price (expected yield)', CampaignCostReportExporter.decimal(breakeven.expectedBreakevenPrice.amount)],
      ['Breakeven price (actual yield)', breakeven.actualBreakevenPrice ? CampaignCostReportExporter.decimal(breakeven.actualBreakevenPrice.amount) : ''],
      ['Currency', ledger.currency],
    ];
    const csv = rows.map((row) => row.map(CampaignCostReportExporter.cell).join(CampaignCostReportExporter.SEPARATOR)).join('\r\n');
    // The BOM makes Excel read the accents (UTF-8) correctly.
    return {
      fileName: `cost-report-${CampaignCostReportExporter.slug(plot.name)}-${campaign.season}.csv`,
      content: new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' }),
    };
  }

  /** Quotes a cell when it has the separator, quotes or line breaks. */
  private static cell(value: string | number): string {
    const text = String(value);
    return /[;"\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  private static decimal(value: number): string {
    return value.toFixed(2);
  }

  private static slug(text: string): string {
    return text
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}
