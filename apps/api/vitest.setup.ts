import 'dotenv/config';
import { prisma } from '@dukeauth/db';

beforeAll(async () => {
  // Ensure DB is reachable
  await prisma.$queryRaw`SELECT 1`;
});

afterAll(async () => {
  await prisma.$disconnect();
});

