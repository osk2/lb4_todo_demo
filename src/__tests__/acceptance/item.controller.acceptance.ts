import {Client, expect} from '@loopback/testlab';
import {Lb4TodoDemoApplication} from '../..';
import {setupApplication} from './test-helper';

describe('ItemController', () => {
  let app: Lb4TodoDemoApplication;
  let client: Client;
  let todoId: number;

  before('setupApplication', async () => {
    ({app, client} = await setupApplication());
    // Create a todo for item tests
    const todo = {title: 'Todo for Items'};
    const res = await client.post('/todos').send({todo});
    todoId = res.body.id;
  });

  after(async () => {
    await app.stop();
  });

  it('creates a new item in a todo', async () => {
    const item = {content: 'Test Item'};
    const res = await client
      .post(`/todos/${todoId}/items`)
      .send(item)
      .expect(200);
    expect(res.body).to.containEql({content: 'Test Item', todoId});
    expect(res.body).to.have.property('id');
  });

  it('gets items for a todo', async () => {
    const res = await client.get(`/todos/${todoId}/items`).expect(200);
    expect(res.body).to.be.Array();
  });

  it('gets item by id', async () => {
    const item = {content: 'Find Item'};
    const created = await client
      .post(`/todos/${todoId}/items`)
      .send(item)
      .expect(200);
    const res = await client.get(`/items/${created.body.id}`).expect(200);
    expect(res.body).to.containEql({content: 'Find Item'});
  });

  it('updates an item', async () => {
    const item = {content: 'To Update'};
    const created = await client
      .post(`/todos/${todoId}/items`)
      .send(item)
      .expect(200);
    await client
      .patch(`/items/${created.body.id}`)
      .send({content: 'Updated'})
      .expect(204);
    const res = await client.get(`/items/${created.body.id}`).expect(200);
    expect(res.body.content).to.equal('Updated');
  });

  it('deletes an item', async () => {
    const item = {content: 'To Delete'};
    const created = await client
      .post(`/todos/${todoId}/items`)
      .send(item)
      .expect(200);
    await client.del(`/items/${created.body.id}`).expect(204);
    await client.get(`/items/${created.body.id}`).expect(404);
  });
});
