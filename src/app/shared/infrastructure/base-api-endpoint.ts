import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable } from 'rxjs';
import { BaseEntity } from '../domain/model/base-entity';
import { BaseAssembler } from './base-assembler';
import { BaseApi } from './base-api';
import { BaseResource, BaseResponse } from './base-response';

/**
 * Generic CRUD endpoint for one resource of the RESTful API.
 *
 * @remarks
 * Concrete endpoints (for example, `FieldPlotsApiEndpoint`) only pass the URL
 * and their assembler, and add the extra queries they need.
 *
 * @typeParam TEntity - Domain entity returned to the upper layers.
 * @typeParam TResource - Single record sent to or received from the API.
 * @typeParam TResponse - Response that wraps a list of resources.
 * @typeParam TAssembler - Mapper between entities and API contracts.
 */
export abstract class BaseApiEndpoint<
  TEntity extends BaseEntity,
  TResource extends BaseResource,
  TResponse extends BaseResponse,
  TAssembler extends BaseAssembler<TEntity, TResource, TResponse>,
> extends BaseApi {
  protected constructor(
    protected http: HttpClient,
    protected endpointUrl: string,
    protected assembler: TAssembler,
  ) {
    super();
  }

  /** Loads all records and maps them to domain entities. */
  getAll(): Observable<TEntity[]> {
    return this.http.get<TResponse | TResource[]>(this.endpointUrl).pipe(
      map((response) => this.toEntities(response)),
      catchError(this.handleError('Failed to fetch entities')),
    );
  }

  /** Loads one record by its identifier. */
  getById(id: number | string): Observable<TEntity> {
    return this.http.get<TResource>(`${this.endpointUrl}/${id}`).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError(this.handleError('Failed to fetch entity')),
    );
  }

  /** Creates a new record from a domain entity. */
  create(entity: TEntity): Observable<TEntity> {
    const resource = this.assembler.toResourceFromEntity(entity);
    return this.http.post<TResource>(this.endpointUrl, resource).pipe(
      map((created) => this.assembler.toEntityFromResource(created)),
      catchError(this.handleError('Failed to create entity')),
    );
  }

  /** Updates the record identified by `id`. */
  update(entity: TEntity, id: number | string): Observable<TEntity> {
    const resource = this.assembler.toResourceFromEntity(entity);
    return this.http.put<TResource>(`${this.endpointUrl}/${id}`, resource).pipe(
      map((updated) => this.assembler.toEntityFromResource(updated)),
      catchError(this.handleError('Failed to update entity')),
    );
  }

  /** Deletes the record identified by `id`. */
  delete(id: number | string): Observable<void> {
    return this.http
      .delete<void>(`${this.endpointUrl}/${id}`)
      .pipe(catchError(this.handleError('Failed to delete entity')));
  }

  /**
   * Maps the API answer to entities. The API may return a plain array
   * (json-server) or a response object that wraps the list.
   */
  protected toEntities(response: TResponse | TResource[]): TEntity[] {
    if (Array.isArray(response)) {
      return response.map((resource) => this.assembler.toEntityFromResource(resource));
    }
    return this.assembler.toEntitiesFromResponse(response as TResponse);
  }
}
