import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where,
} from '@loopback/repository';
import {
  del,
  get,
  getModelSchemaRef,
  param,
  patch,
  post,
  requestBody,
  response,
} from '@loopback/rest';
import {Item} from '../models';
import {ItemRepository, TodoRepository} from '../repositories';
import {ApiError} from '../utils';

export class ItemController {
  constructor(
    @repository(ItemRepository)
    public itemRepository: ItemRepository,
    @repository(TodoRepository)
    public todoRepository: TodoRepository,
  ) {}

  @post('/todos/{todoId}/items')
  @response(200, {
    description: 'Item model instance',
    content: {'application/json': {schema: getModelSchemaRef(Item)}},
  })
  async create(
    @param.path.number('todoId') todoId: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Item, {
            title: 'NewItemInTodo',
            exclude: ['id', 'todoId'],
          }),
        },
      },
    })
    item: Omit<Item, 'id'>,
  ): Promise<Item> {
    try {
      await this.todoRepository.findById(todoId);
    } catch (e) {
      throw ApiError.notFound('Todo not found or deleted');
    }
    return this.itemRepository.create({
      ...item,
      todoId,
    });
  }

  @get('/todos/{todoId}/items/count')
  @response(200, {
    description: 'Items count for a todo',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.path.number('todoId') todoId: number,
    @param.where(Item) where?: Where<Item>,
  ): Promise<Count> {
    try {
      await this.todoRepository.findById(todoId);
    } catch (e) {
      throw ApiError.notFound('Todo not found or deleted');
    }
    const finalWhere = {...where, todoId};
    return this.itemRepository.count(finalWhere);
  }

  @get('/todos/{todoId}/items')
  @response(200, {
    description: 'Array of Item model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Item, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.path.number('todoId') todoId: number,
    @param.query.string('name') name?: string,
    @param.query.number('limit') limit?: number,
    @param.query.number('skip') skip?: number,
  ): Promise<Item[]> {
    try {
      await this.todoRepository.findById(todoId);
    } catch (e) {
      throw ApiError.notFound('Todo not found or deleted');
    }

    const finalFilter: Filter<Item> = {where: {todoId}};
    if (limit !== undefined) finalFilter.limit = limit;
    if (skip !== undefined) finalFilter.skip = skip;
    if (name) {
      finalFilter.where = {and: [finalFilter.where!, {content: name}]};
    }

    return this.itemRepository.find(finalFilter);
  }

  @get('/items/{id}')
  @response(200, {
    description: 'Item model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Item, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(Item, {exclude: 'where'}) filter?: FilterExcludingWhere<Item>,
  ): Promise<Item> {
    const item = await this.itemRepository.findById(id, filter);
    try {
      await this.todoRepository.findById(item.todoId);
    } catch (e) {
      throw ApiError.notFound('Associated Todo is deleted');
    }
    return item;
  }

  @patch('/items/{id}')
  @response(204, {
    description: 'Item PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Item, {partial: true}),
        },
      },
    })
    item: Partial<Item>,
  ): Promise<void> {
    const originalItem = await this.itemRepository.findById(id);
    try {
      await this.todoRepository.findById(originalItem.todoId);
    } catch (e) {
      throw ApiError.notFound('Associated Todo is deleted');
    }

    // set the completedAt timestamp
    if (item.isCompleted === true && !originalItem.isCompleted) {
      item.completedAt = new Date();
    }
    if (item.isCompleted === false) {
      item.completedAt = undefined;
    }

    item.updatedAt = new Date();

    await this.itemRepository.updateById(id, item);
  }

  @del('/items/{id}')
  @response(204, {
    description: 'Item DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    const item = await this.itemRepository.findById(id);
    try {
      await this.todoRepository.findById(item.todoId);
    } catch (e) {
      throw ApiError.notFound('Associated Todo is deleted');
    }
    await this.itemRepository.deleteById(id);
  }
}
