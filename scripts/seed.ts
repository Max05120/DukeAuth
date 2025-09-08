import 'dotenv/config';
import { prisma } from '@dukeauth/db';
import { hashPassword } from '@dukeauth/security';
import { generateApiKey } from '@dukeauth/security/src/apikey';

async function main() {
  const email = process.env.SEED_EMAIL || 'owner@example.com';
  const password = process.env.SEED_PASSWORD || 'password123';
  const orgName = process.env.SEED_ORG || 'Dev Org';
  const subdomain = process.env.SEED_SUBDOMAIN || 'dev';

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('Seed: user already exists, skipping');
    return;
  }

  const pwHash = await hashPassword(password);

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({ data: { email, passwordHash: pwHash } });
    const org = await tx.organization.create({ data: { name: orgName } });
    await tx.$executeRawUnsafe(`SET LOCAL dukeauth.tenant_id='${org.id}'`);
    await tx.organizationMembership.create({ data: { userId: user.id, organizationId: org.id, role: 'OWNER' } });
    await tx.marketplace.create({ data: { organizationId: org.id, subdomain } });
    const { key, prefix, hash } = generateApiKey('duk');
    await tx.apiKey.create({ data: { organizationId: org.id, name: 'Seed Key', prefix, keyHash: hash } });
    return { user, org, apiKey: key };
  });

  console.log('Seed complete');
  console.log('Owner email:', email);
  console.log('Owner password:', password);
  console.log('Organization:', result.org.name);
  console.log('Marketplace subdomain:', subdomain);
  console.log('API Key:', result.apiKey);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
