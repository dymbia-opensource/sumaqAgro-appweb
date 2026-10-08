export class InviteTechnicalAdvisorCommand {
  constructor(
    public readonly cooperativeId: number,
    public readonly name: string,
    public readonly cipCode: string,
    public readonly phone: string,
    public readonly assignedPlotsCount: number,
  ) {}
}
