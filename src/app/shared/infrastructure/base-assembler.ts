import { BaseEntity } from '../domain/model/base-entity';
import { BaseResource, BaseResponse } from './base-response';

/**
 * Maps between domain entities and the contracts of the RESTful API.
 *
 * @typeParam TEntity - Domain entity.
 * @typeParam TResource - Single record sent to or received from the API.
 * @typeParam TResponse - Response that wraps a list of resources.
 */
export interface BaseAssembler<
  TEntity extends BaseEntity,
  TResource extends BaseResource,
  TResponse extends BaseResponse,
> {
  /** Maps one resource to a domain entity. */
  toEntityFromResource(resource: TResource): TEntity;

  /** Maps one domain entity to a resource. */
  toResourceFromEntity(entity: TEntity): TResource;

  /** Maps a response to a list of domain entities. */
  toEntitiesFromResponse(response: TResponse): TEntity[];
}
