/** Cultivos que este contexto puede calificar con reglas propias. */
export const HarvestCropType = {
  ANDEAN_POTATO: 'ANDEAN_POTATO',
  SPECIALTY_COFFEE: 'SPECIALTY_COFFEE',
} as const;

/** Limita el tipo a los valores declarados arriba; evita cultivos desconocidos. */
export type HarvestCropType = typeof HarvestCropType[keyof typeof HarvestCropType];
