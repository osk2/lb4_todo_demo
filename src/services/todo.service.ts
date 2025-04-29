import {BindingScope, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {Item, Todo} from '../models';
import {ItemRepository} from '../repositories/item.repository';
import {TodoRepository} from '../repositories/todo.repository';
import {ApiError} from '../utils';

export interface TodoWithItemsRequest {
  todo: Omit<Todo, 'id'>;
  items?: Omit<Item, 'id' | 'todoId'>[];
}

@injectable({scope: BindingScope.TRANSIENT})
export class TodoService {
  constructor(
    @repository(TodoRepository) private todoRepository: TodoRepository,
    @repository(ItemRepository) private itemRepository: ItemRepository,
  ) {}

  /**
   * Create a new todo with items
   */
  async createTodoWithItems(request: TodoWithItemsRequest): Promise<Todo> {
    const todo = await this.todoRepository.create(request.todo);
    if (request.items && request.items.length > 0) {
      for (const itemData of request.items) {
        await this.itemRepository.create({
          ...itemData,
          todoId: todo.id!,
        });
      }
    }

    try {
      if (todo.id === undefined)
        throw ApiError.notFound('Todo id is undefined');
      return await this.todoRepository.findById(todo.id, {
        include: ['items'],
      });
    } catch (e) {
      throw ApiError.notFound('Todo not found or deleted');
    }
  }
}
