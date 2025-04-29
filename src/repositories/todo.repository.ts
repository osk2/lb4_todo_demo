import {Getter, inject} from '@loopback/core';
import {
  Count,
  DefaultCrudRepository,
  Filter,
  FilterExcludingWhere,
  HasManyRepositoryFactory,
  repository,
  Where,
} from '@loopback/repository';
import {MysqlDataSource} from '../datasources';
import {Item, Todo, TodoRelations, TodoStatus} from '../models';
import {ItemRepository} from './item.repository';

export class TodoRepository extends DefaultCrudRepository<
  Todo,
  number,
  TodoRelations
> {
  public readonly items: HasManyRepositoryFactory<Item, number>;

  constructor(
    @inject('datasources.mysql') dataSource: MysqlDataSource,
    @repository.getter('ItemRepository')
    protected itemRepositoryGetter: Getter<ItemRepository>,
  ) {
    super(Todo, dataSource);
    this.items = this.createHasManyRepositoryFactoryFor(
      'items',
      itemRepositoryGetter,
    );
    this.registerInclusionResolver('items', this.items.inclusionResolver);
  }

  /**
   * Soft delete a Todo record
   * @param id - The ID of the Todo to soft delete
   */
  async softDelete(id: number): Promise<void> {
    await this.updateById(id, {
      status: TodoStatus.DELETED,
      updatedAt: new Date(),
    });
  }

  /**
   * Override find method to exclude soft-deleted records
   */
  async find(filter?: Filter<Todo>): Promise<Todo[]> {
    const whereCondition = {status: {neq: TodoStatus.DELETED}};
    const finalFilter = filter ?? {};

    if (finalFilter.where) {
      finalFilter.where = {and: [finalFilter.where, whereCondition]};
    } else {
      finalFilter.where = whereCondition;
    }

    return super.find(finalFilter);
  }

  /**
   * Override findById method to handle soft-deleted records
   */
  async findById(
    id: number,
    filter?: FilterExcludingWhere<Todo>,
  ): Promise<Todo> {
    const result = await super.findById(id, filter);

    // Check if the todo is soft-deleted
    if (result.status === TodoStatus.DELETED) {
      throw new Error('Todo not found');
    }

    return result;
  }

  /**
   * Override count method to exclude soft-deleted records
   */
  async count(where?: Where<Todo>): Promise<Count> {
    const whereCondition = {status: {neq: TodoStatus.DELETED}};
    let finalWhere = where ?? {};

    if (Object.keys(finalWhere).length > 0) {
      finalWhere = {and: [finalWhere, whereCondition]};
    } else {
      finalWhere = whereCondition;
    }

    return super.count(finalWhere);
  }

  /* ==== Following methods are included soft-deleted records ==== */

  /**
   * Find todos including soft-deleted records when needed
   */
  async findWithDeleted(filter?: Filter<Todo>): Promise<Todo[]> {
    return super.find(filter);
  }

  /**
   * Count todos including soft-deleted records when needed
   */
  async countWithDeleted(where?: Where<Todo>): Promise<Count> {
    return super.count(where);
  }

  /**
   * Find a todo by ID, including soft-deleted records
   */
  async findByIdWithDeleted(
    id: number,
    filter?: FilterExcludingWhere<Todo>,
  ): Promise<Todo> {
    return super.findById(id, filter);
  }
}
