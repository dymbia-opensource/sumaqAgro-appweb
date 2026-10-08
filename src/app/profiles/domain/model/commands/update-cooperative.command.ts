/** Data submitted to update the institutional profile of a cooperative. */
export class UpdateCooperativeCommand {
  readonly legalName: string;
  readonly region: string;
  readonly institutionalEmail: string;
  readonly legalRepresentative: string;
  readonly ruc: string;
  readonly headquartersAddress: string;
  readonly switchboardPhone: string;

  constructor(data: {
    legalName: string;
    region: string;
    institutionalEmail: string;
    legalRepresentative: string;
    ruc: string;
    headquartersAddress: string;
    switchboardPhone: string;
  }) {
    this.legalName = data.legalName;
    this.region = data.region;
    this.institutionalEmail = data.institutionalEmail;
    this.legalRepresentative = data.legalRepresentative;
    this.ruc = data.ruc;
    this.headquartersAddress = data.headquartersAddress;
    this.switchboardPhone = data.switchboardPhone;
  }
}
