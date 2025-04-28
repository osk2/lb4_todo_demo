import { belongsTo, Entity, model, property } from '@loopback/repository';
import { Todo } from './todo.model';

@model()
export class Item extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: true,
  })
  id?: string;

  @property({
    type: 'string',
    required: true,
  })
  content: string;

  @property({
    type: 'boolean',
    required: true,
    default: false,
  })
  isCompleted: boolean;

  @property({
    type: 'date',
  })
  completedAt?: Date;

  @property({
    type: 'date',
    default: () => new Date(),
  })
  createdAt: Date;

  @property({
    type: 'date',
    default: () => new Date(),
  })
  updatedAt: Date;

  @belongsTo(() => Todo)
  todoId: string;

  constructor(data?: Partial<Item>) {
    super(data);
  }
}

export interface ItemRelations {
  // describe navigational properties here
}

export type ItemWithRelations = Item & ItemRelations;
