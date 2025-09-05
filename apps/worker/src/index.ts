import { Queue, Worker, QueueScheduler, JobsOptions } from 'bullmq';
import IORedis from 'ioredis';
import { mintNft } from './mint';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');

export const mintQueue = new Queue('mint', { connection });
new QueueScheduler('mint', { connection });

export type MintJob = { to: string; metadataUrl: string };

export async function enqueueMint(job: MintJob, opts?: JobsOptions) {
  return mintQueue.add('mint-nft', job, opts);
}

new Worker<MintJob>(
  'mint',
  async (job) => {
    return mintNft(job.data);
  },
  { connection }
);

// eslint-disable-next-line no-console
console.log('Worker is running.');

