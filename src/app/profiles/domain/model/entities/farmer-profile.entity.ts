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
  private _firstName: string;
  private _lastName: string;

  constructor(props: {
    id: number;
    userId: number;
    phoneNumber: string;
    email: string;
    firstName?: string;
    lastName?: string;
  }) {
    super({ id: props.id });
    this._userId = props.userId;
    this._firstName = props.firstName?.trim() ?? '';
    this._lastName = props.lastName?.trim() ?? '';
    this._phoneNumber = FarmerProfile.validatePhoneNumber(props.phoneNumber);
    this._email = FarmerProfile.validateEmail(props.email);
  }

  get firstName(): string {
    return this._firstName;
  }
  get lastName(): string {
    return this._lastName;
  }
  get fullName(): string {
    return [this._firstName, this._lastName].filter(Boolean).join(' ');
  }

  updateName(firstName: string, lastName: string): void {
    const first = firstName.trim();
    const last = lastName.trim();
    if (!first || !last || first.length > 100 || last.length > 100) {
      throw new Error('First and last names are required and must not exceed 100 characters.');
    }
    this._firstName = first;
    this._lastName = last;
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
