import { Router } from 'express';
import { validate } from '../middleware/validate';
import { signUploadSchema } from '@dukeauth/core';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Env } from '@dukeauth/core';
import crypto from 'crypto';

const router = Router();

const s3 = new S3Client({
  region: Env.AWS_REGION(),
  endpoint: Env.S3_ENDPOINT(),
  forcePathStyle: true,
  credentials: { accessKeyId: Env.S3_ACCESS_KEY(), secretAccessKey: Env.S3_SECRET_KEY() },
});

router.post('/sign', validate(signUploadSchema), async (req, res, next) => {
  try {
    const { contentType, filename } = req.body as any;
    const key = `uploads/${crypto.randomUUID()}-${filename}`;
    const cmd = new PutObjectCommand({ Bucket: Env.S3_BUCKET(), Key: key, ContentType: contentType });
    const url = await getSignedUrl(s3, cmd, { expiresIn: 60 });
    res.json({ url, key });
  } catch (e) {
    next(e);
  }
});

export default router;
