import { User } from './user.entity';
import { UserRole } from '../value-objects/user-role';

/**
 * Represents a user authenticated by the IAM API.
 */
export class AuthenticatedUser extends User {
  private readonly _token: string;

  constructor(props: {
    id: number | string;
    email: string;
    roles: readonly UserRole[];
    token: string;
  }) {
    super({
      id: props.id,
      email: props.email,
      roles: props.roles,
    });

    const token = props.token.trim();

    if (!token) {
      throw new Error('Authentication token is required.');
    }

    this._token = token;
  }

  get token(): string {
    return this._token;
  }
}
