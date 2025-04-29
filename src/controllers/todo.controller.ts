import {inject} from '@loopback/core';
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
  response
} from '@loopback/rest';
import {Todo, TodoStatus} from '../models';
import {TodoRepository} from '../repositories';
import {TodoService, TodoWithItemsRequest} from '../services';

export class TodoController {
  constructor(
    @repository(TodoRepository)
    public todoRepository: TodoRepository,
    @inject('services.TodoService')
    public todoService: TodoService,
  ) {}

  @post('/todos')
  @response(200, {
    description: 'Todo model instance',
    content: {'application/json': {schema: getModelSchemaRef(Todo)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['todo'],
            properties: {
              todo: {
                type: 'object',
                required: ['title'],
                properties: {
                  title: {type: 'string'},
                  subtitle: {type: 'string'},
                  status: {
                    type: 'string',
                    enum: Object.values(TodoStatus),
                  },
                },
              },
              items: {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['content'],
                  properties: {
                    content: {type: 'string'},
                    isCompleted: {type: 'boolean'},
                    completedAt: {type: 'string', format: 'date-time'},
                  },
                },
              },
            },
          },
        },
      },
    })
    todoWithItems: TodoWithItemsRequest,
  ): Promise<Todo> {
    return this.todoService.createTodoWithItems(todoWithItems);
  }

  @get('/todos/count')
  @response(200, {
    description: 'Todo model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(@param.where(Todo) where?: Where<Todo>): Promise<Count> {
    return this.todoRepository.count(where);
  }

  @get('/todos')
  @response(200, {
    description: 'Array of Todo model instances with pagination',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: getModelSchemaRef(Todo, {includeRelations: true}),
            },
            total: {type: 'number'},
            limit: {type: 'number'},
            skip: {type: 'number'},
          },
        },
      },
    },
  })
  async find(
    @param.filter(Todo) filter?: Filter<Todo>,
    @param.query.number('limit') limit?: number,
    @param.query.number('skip') skip?: number,
  ): Promise<{data: Todo[]; total: number; limit: number; skip: number}> {
    const finalFilter = {...(filter ?? {})};
    if (limit !== undefined) finalFilter.limit = limit;
    if (skip !== undefined) finalFilter.skip = skip;

    if (!finalFilter.include) finalFilter.include = [];
    if (Array.isArray(finalFilter.include)) {
      if (!finalFilter.include.includes('items')) finalFilter.include.push('items');
    }

    const data = await this.todoRepository.find(finalFilter);
    const where = finalFilter.where;
    const total = (await this.todoRepository.count(where)).count;

    return {
      data,
      total,
      limit: finalFilter.limit ?? 100,
      skip: finalFilter.skip ?? 0,
    };
  }

  @get('/todos/{id}')
  @response(200, {
    description: 'Todo model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Todo, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(Todo, {exclude: 'where'}) filter?: FilterExcludingWhere<Todo>,
  ): Promise<Todo> {
    return this.todoRepository.findById(id, filter);
  }

  @patch('/todos/{id}')
  @response(204, {
    description: 'Todo PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Todo, {partial: true}),
        },
      },
    })
    todo: Partial<Todo>,
  ): Promise<void> {


    // Set the updated timestamp
    todo.updatedAt = new Date();

    await this.todoRepository.updateById(id, todo);
  }

  @put('/todos/{id}')
  @response(204, {
    description: 'Todo PUT success',
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody() todo: Todo,
  ): Promise<void> {
    const existingTodo = await this.todoRepository.findById(id);

    todo.updatedAt = new Date();
    todo.createdAt = existingTodo.createdAt;

    await this.todoRepository.replaceById(id, todo);
  }

  @del('/todos/{id}')
  @response(204, {
    description: 'Todo DELETE success'
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.todoRepository.items(id).delete();
    await this.todoRepository.softDelete(id);
  }
}
