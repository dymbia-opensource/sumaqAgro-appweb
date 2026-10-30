import { UserRole } from '../value-objects/user-role';

/**
 * Captures the information required to register an account.
 */
export class SignUpCommand {
  readonly email: string;
  readonly password: string;
  readonly role: UserRole;

  constructor(props: { email: string; password: string; role: UserRole }) {
    this.email = props.email.trim();
    this.password = props.password;
    this.role = props.role;
  }
}
