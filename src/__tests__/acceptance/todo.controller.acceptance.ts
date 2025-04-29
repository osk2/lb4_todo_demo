import {Client, expect} from '@loopback/testlab';
import {Lb4TodoDemoApplication} from '../..';
import {setupApplication} from './test-helper';

describe('TodoController', () => {
  let app: Lb4TodoDemoApplication;
  let client: Client;

  before('setupApplication', async () => {
    ({app, client} = await setupApplication());
  });

  after(async () => {
    await app.stop();
  });

  it('creates a new todo', async () => {
    const todo = {title: 'Test Todo'};
    const res = await client.post('/todos').send({todo}).expect(200);
    expect(res.body).to.containEql({title: 'Test Todo'});
    expect(res.body).to.have.property('id');
  });

  it('gets todos list', async () => {
    const res = await client.get('/todos').expect(200);
    expect(res.body).to.have.properties(['data', 'total', 'limit', 'skip']);
    expect(res.body.data).to.be.Array();
  });

  it('gets todo by id', async () => {
    const todo = {title: 'Find Me'};
    const created = await client.post('/todos').send({todo}).expect(200);
    const res = await client.get(`/todos/${created.body.id}`).expect(200);
    expect(res.body).to.containEql({title: 'Find Me'});
  });

  it('updates a todo', async () => {
    const todo = {title: 'To Update'};
    const created = await client.post('/todos').send({todo}).expect(200);
    await client
      .patch(`/todos/${created.body.id}`)
      .send({title: 'Updated'})
      .expect(204);
    const res = await client.get(`/todos/${created.body.id}`).expect(200);
    expect(res.body.title).to.equal('Updated');
  });

  it('deletes a todo', async () => {
    const todo = {title: 'To Delete'};
    const created = await client.post('/todos').send({todo}).expect(200);
    await client.del(`/todos/${created.body.id}`).expect(204);
    await client.get(`/todos/${created.body.id}`).expect(404);
  });
});
