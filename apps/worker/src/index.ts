import 'dotenv/config';
import { QueueScheduler, Worker } from 'bullmq';
import { Env, QUEUE_NAMES } from '@dukeauth/core';
import { handleMint } from './mint';

const connection = { url: Env.REDIS_URL() };

new QueueScheduler(QUEUE_NAMES.MINT, { connection });

const worker = new Worker(QUEUE_NAMES.MINT, async (job) => {
  if (job.name === 'mint') {
    await handleMint(job.data);
  }
}, { connection });

worker.on('completed', (job) => console.log(`Job ${job.id} completed`));
worker.on('failed', (job, err) => console.error(`Job ${job?.id} failed`, err));

console.log('Worker running');

