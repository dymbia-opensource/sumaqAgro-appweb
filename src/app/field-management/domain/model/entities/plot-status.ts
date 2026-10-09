/** Monitoring status of a field plot. */
export enum PlotStatus {
  /** The plot was registered but its GPS polygon is not drawn yet. */
  WITHOUT_POLYGON = 'WITHOUT_POLYGON',
  /** The polygon is linked to AgroMonitoring and the plot is monitored by satellite. */
  ACTIVE_MONITORING = 'ACTIVE_MONITORING',
}
