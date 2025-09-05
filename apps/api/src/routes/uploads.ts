import { Router } from 'express';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getEnv } from '@dukeauth/core';
import { z } from 'zod';
import { validateBody } from '../middleware/validate';

const router = Router();

const schema = z.object({
  key: z.string(),
  contentType: z.string().default('application/octet-stream')
});

router.post('/sign', validateBody(schema), async (req, res, next) => {
  try {
    const env = getEnv();
    const bucket = env.AWS_S3_BUCKET || 'dukeauth-dev';
    const region = env.AWS_REGION || 'us-east-1';
    const s3 = new S3Client({
      region,
      endpoint: process.env.AWS_ENDPOINT_URL || 'http://localhost:4566',
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test'
      }
    });

    const { key, contentType } = req.body as z.infer<typeof schema>;
    const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType });
    const url = await getSignedUrl(s3, command, { expiresIn: 60 });
    res.json({ url, bucket, key });
  } catch (err) {
    next(err);
  }
});

export default router;

