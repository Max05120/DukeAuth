import request from 'supertest';
import { app } from '../src/server';
import { prisma } from '@dukeauth/db';

function rand(n = 6) {
  return Math.random().toString(36).slice(2, 2 + n);
}

describe('Auth and Products', () => {
  const email = `u_${rand()}@example.com`;
  const password = 'password1234';
  const subdomain = `sd${rand(4)}`;
  let accessToken = '';
  let apiKey = '';

  it('registers a user + org + marketplace', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email, password, organizationName: 'Test Org', subdomain });
    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeTruthy();
  });

  it('logs in and gets tokens', async () => {
    const res = await request(app).post('/auth/login').send({ email, password });
    expect(res.status).toBe(200);
    accessToken = res.body.accessToken;
    expect(accessToken).toBeTruthy();
  });

  it('creates an API key', async () => {
    const res = await request(app)
      .post('/apikeys')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'CI key' });
    expect(res.status).toBe(201);
    apiKey = res.body.key;
    expect(apiKey).toMatch(/^duk_/);
  });

  it('creates and lists products with tenant header', async () => {
    const create = await request(app)
      .post('/products')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-api-key', apiKey)
      .send({ title: 'Shiny NFT', priceCents: 1000, currency: 'USD', inventory: 5, images: [] });
    expect(create.status).toBe(201);

    const list = await request(app)
      .get('/products')
      .set('x-api-key', apiKey);
    expect(list.status).toBe(200);
    expect(Array.isArray(list.body)).toBe(true);
    expect(list.body.length).toBeGreaterThanOrEqual(1);
  });
});

