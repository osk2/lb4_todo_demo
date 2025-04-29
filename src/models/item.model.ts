import {belongsTo, Entity, model, property} from '@loopback/repository';
import {Todo} from './todo.model';

@model({
  settings: {
    indexes: {
      todoIdIndex: {
        keys: {todoId: 1},
        options: {unique: false},
      },
    },
  },
})
export class Item extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'string',
    required: true,
  })
  content: string;

  @property({
    type: 'boolean',
    default: false,
  })
  isCompleted?: boolean;

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
  todoId: number;

  constructor(data?: Partial<Item>) {
    super(data);
  }
}

export interface ItemRelations {
  // describe navigational properties here
}

export type ItemWithRelations = Item & ItemRelations;
