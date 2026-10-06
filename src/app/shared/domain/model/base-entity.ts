/**
 * Base class for the domain entities of every bounded context.
 *
 * @remarks
 * It only holds the identity of the entity. Each entity adds its own state
 * and behavior.
 */
export class BaseEntity {
  protected _id: number | string;

  /**
   * Creates the entity with its identifier.
   * @param props - Identity of the entity.
   */
  constructor(props: { id: number | string }) {
    this._id = props.id;
  }

  /** Identifier of the entity. */
  get id(): number | string {
    return this._id;
  }

  set id(value: number | string) {
    this._id = value;
  }
}
