/** Intent to register the institutional profile of a cooperative. */
export class RegisterCooperativeCommand {
  readonly directorUserId: number;
  readonly legalName: string;
  readonly region: string;
  readonly institutionalEmail: string;
  readonly legalRepresentative: string;
  readonly ruc: string;
  readonly headquartersAddress: string;
  readonly switchboardPhone: string;

  constructor(props: {
    directorUserId: number;
    legalName: string;
    region: string;
    institutionalEmail: string;
    legalRepresentative: string;
    ruc: string;
    headquartersAddress: string;
    switchboardPhone: string;
  }) {
    this.directorUserId = props.directorUserId;
    this.legalName = RegisterCooperativeCommand.required(props.legalName, 'Legal name');
    this.region = RegisterCooperativeCommand.required(props.region, 'Region');
    this.institutionalEmail = RegisterCooperativeCommand.email(props.institutionalEmail);
    this.legalRepresentative = RegisterCooperativeCommand.required(
      props.legalRepresentative,
      'Legal representative',
    );
    this.ruc = RegisterCooperativeCommand.ruc(props.ruc);
    this.headquartersAddress = RegisterCooperativeCommand.required(
      props.headquartersAddress,
      'Headquarters address',
    );
    this.switchboardPhone = RegisterCooperativeCommand.phone(props.switchboardPhone);
  }

  private static required(value: string, field: string): string {
    const normalized = value.trim();
    if (!normalized) throw new Error(`${field} is required.`);
    return normalized;
  }

  private static email(value: string): string {
    const normalized = value.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(normalized)) throw new Error('Institutional email is invalid.');
    return normalized;
  }

  private static ruc(value: string): string {
    const normalized = value.replace(/\s/g, '');
    if (!/^\d{11}$/.test(normalized)) throw new Error('RUC must contain exactly 11 digits.');
    return normalized;
  }

  private static phone(value: string): string {
    const normalized = value.trim();
    if (normalized.replace(/\D/g, '').length < 7) throw new Error('Switchboard phone is invalid.');
    return normalized;
  }
}
