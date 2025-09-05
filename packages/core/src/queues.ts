import { Queue } from 'bullmq';
import { Env } from './env';

export const QUEUE_NAMES = {
  MINT: 'mint',
} as const;

export function createQueue(name: string) {
  return new Queue(name, { connection: { url: Env.REDIS_URL() } });
}

export async function enqueueMint(payload: { nftId: string; organizationId: string }) {
  const q = createQueue(QUEUE_NAMES.MINT);
  await q.add('mint', payload, { removeOnComplete: true, attempts: 3 });
}
