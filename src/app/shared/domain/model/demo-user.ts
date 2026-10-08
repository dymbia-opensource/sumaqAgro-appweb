/**
 * Experiences available while IAM is not implemented.
 */
export type UserExperience = 'FARMER' | 'COOPERATIVE_DIRECTOR';

/**
 * Temporary user used to navigate and verify each application segment.
 */
export interface DemoUser {
  readonly id: number;
  readonly displayName: string;
  readonly experience: UserExperience;
  readonly initialRoute: string;
}
