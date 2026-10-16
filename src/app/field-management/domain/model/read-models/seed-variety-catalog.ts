import { CropType } from '../entities/crop-type';

/**
 * `SeedVarietyCatalog` read model: seed varieties suggested for each crop (US-34).
 *
 * @remarks
 * The producer can also type a variety that is not in the catalog; the
 * campaign then stores it as a custom variety.
 */
export class SeedVarietyCatalog {
  private static readonly VARIETIES: Record<CropType, readonly string[]> = {
    [CropType.ANDEAN_POTATO]: ['Papa Canchán', 'Papa Yungay', 'Papa Perricholi', 'Papa Única'],
    [CropType.SPECIALTY_COFFEE]: ['Typica', 'Caturra', 'Bourbon', 'Geisha', 'Catimor'],
  };

  /**
   * Varieties of a crop.
   * @param cropType - Crop of the campaign.
   */
  static varietiesOf(cropType: CropType): string[] {
    return [...SeedVarietyCatalog.VARIETIES[cropType]];
  }

  /**
   * Varieties of a crop whose name contains a text, ignoring upper case.
   * @param cropType - Crop of the campaign.
   * @param text - Text typed by the producer.
   */
  static search(cropType: CropType, text: string): string[] {
    const query = text.trim().toLowerCase();
    return SeedVarietyCatalog.varietiesOf(cropType).filter((variety) =>
      variety.toLowerCase().includes(query),
    );
  }

  /**
   * `true` when the variety is not in the catalog of the crop.
   * @param cropType - Crop of the campaign.
   * @param varietyName - Variety chosen or typed by the producer.
   */
  static isCustom(cropType: CropType, varietyName: string): boolean {
    return !SeedVarietyCatalog.VARIETIES[cropType].includes(varietyName.trim());
  }
}
