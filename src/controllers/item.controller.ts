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
    put,
    requestBody,
    response,
} from '@loopback/rest';
import { Item } from '../models';
import { ItemRepository, TodoRepository } from '../repositories';
import { ApiError } from '../utils';

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
    // Check if the todo exists (repository will throw if deleted)
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
    @param.filter(Item) filter?: Filter<Item>,
  ): Promise<Item[]> {
    try {
      await this.todoRepository.findById(todoId);
    } catch (e) {
      throw ApiError.notFound('Todo not found or deleted');
    }

    // Filter by todoId
    const todoFilter = {todoId};
    const finalFilter = filter ?? {};

    if (finalFilter.where) {
      finalFilter.where = {and: [finalFilter.where, todoFilter]};
    } else {
      finalFilter.where = todoFilter;
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

    // If isCompleted is being set to true and it was previously false,
    // set the completedAt timestamp
    if (item.isCompleted === true && !originalItem.isCompleted) {
      item.completedAt = new Date();
    }

    // If isCompleted is being set to false, clear the completedAt timestamp
    if (item.isCompleted === false) {
      item.completedAt = undefined;
    }

    // Set updated timestamp
    item.updatedAt = new Date();

    await this.itemRepository.updateById(id, item);
  }

  @put('/items/{id}')
  @response(204, {
    description: 'Item PUT success',
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody() item: Item,
  ): Promise<void> {
    const originalItem = await this.itemRepository.findById(id);
    try {
      await this.todoRepository.findById(originalItem.todoId);
    } catch (e) {
      throw ApiError.notFound('Associated Todo is deleted');
    }

    // Handle completedAt based on isCompleted status
    if (item.isCompleted && !item.completedAt) {
      item.completedAt = new Date();
    } else if (!item.isCompleted) {
      item.completedAt = undefined;
    }

    // Set updated timestamp and preserve created timestamp
    item.updatedAt = new Date();
    item.createdAt = originalItem.createdAt;

    await this.itemRepository.replaceById(id, item);
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
