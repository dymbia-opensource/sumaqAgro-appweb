export class ReassignTechnicalAdvisorCommand {
  constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly cipCode: string,
    public readonly phone: string,
    public readonly assignedPlotsCount: number,
  ) {}
}
