import 'dotenv/config';
import { QueueScheduler, Worker } from 'bullmq';
import pino from 'pino';
import { Env, QUEUE_NAMES } from '@dukeauth/core';
import { handleMint } from './mint';

const connection = { url: Env.REDIS_URL() };
const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

new QueueScheduler(QUEUE_NAMES.MINT, { connection });

const worker = new Worker(QUEUE_NAMES.MINT, async (job) => {
  if (job.name === 'mint') {
    await handleMint(job.data);
  }
}, { connection });

worker.on('completed', (job) => logger.info({ jobId: job.id }, 'Job completed'));
worker.on('failed', (job, err) => logger.error({ jobId: job?.id, err }, 'Job failed'));

logger.info('Worker running');
