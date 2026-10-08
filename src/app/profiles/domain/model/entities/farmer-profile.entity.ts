import { BaseEntity } from '../../../../shared/domain/model/base-entity';

/**
 * Contact and account preferences of an independent farmer.
 *
 * @remarks
 * Authentication credentials do not belong here. They are intentionally left
 * for IAM, which is outside the scope of the current delivery.
 */
export class FarmerProfile extends BaseEntity {
  private readonly _userId: number;
  private _phoneNumber: string;
  private _email: string;

  constructor(props: { id: number; userId: number; phoneNumber: string; email: string }) {
    super({ id: props.id });
    this._userId = props.userId;
    this._phoneNumber = FarmerProfile.validatePhoneNumber(props.phoneNumber);
    this._email = FarmerProfile.validateEmail(props.email);
  }

  get userId(): number {
    return this._userId;
  }

  get phoneNumber(): string {
    return this._phoneNumber;
  }

  get email(): string {
    return this._email;
  }

  /** Updates the contact data that the farmer uses in the platform. */
  updateContact(phoneNumber: string, email: string): void {
    this._phoneNumber = FarmerProfile.validatePhoneNumber(phoneNumber);
    this._email = FarmerProfile.validateEmail(email);
  }

  private static validatePhoneNumber(value: string): string {
    const phoneNumber = value.trim();
    if (phoneNumber.length < 7) {
      throw new Error('The phone number must have at least seven characters.');
    }
    return phoneNumber;
  }

  private static validateEmail(value: string): string {
    const email = value.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      throw new Error('The email address is invalid.');
    }
    return email;
  }
}
