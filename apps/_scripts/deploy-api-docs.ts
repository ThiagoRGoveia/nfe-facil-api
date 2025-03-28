import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { readFile } from 'fs/promises';
import { join } from 'path';
import dotenv from 'dotenv';

dotenv.config();
async function deployApiDocs() {
  // Read environment variables
  const accessKeyId = process.env.CLAUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLAUDFLARE_R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.CLAUDFLARE_R2_BUCKET;
  const endpoint = process.env.CLAUDFLARE_R2_ENDPOINT;

  if (!accessKeyId || !secretAccessKey) {
    console.error('Error: Cloudflare R2 credentials not found in environment variables');
    process.exit(1);
  }

  // Configure S3 client for Cloudflare R2
  const s3Client = new S3Client({
    region: 'auto',
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  try {
    // Get project root directory
    const rootDir = process.cwd();
    const sourceFilePath = join(rootDir, 'docs', 'nfe-facil', 'index.html');

    // Read the file
    const fileContent = await readFile(sourceFilePath);

    // Upload to R2
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: 'api-doc.html',
      Body: fileContent,
      ContentType: 'text/html',
    });

    await s3Client.send(command);
  } catch (error) {
    process.exit(1);
  }
}

deployApiDocs();
