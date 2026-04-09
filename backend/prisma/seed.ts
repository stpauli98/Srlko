import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const passwordHash = await bcrypt.hash('password123', 10);

  const alice = await prisma.user.upsert({
    where: { email: 'alice@srlko.dev' },
    update: {},
    create: {
      email: 'alice@srlko.dev',
      password: passwordHash,
      name: 'Alice',
      role: 'MEMBER',
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@srlko.dev' },
    update: {},
    create: {
      email: 'bob@srlko.dev',
      password: passwordHash,
      name: 'Bob',
      role: 'MEMBER',
    },
  });

  const general = await prisma.channel.upsert({
    where: { name: 'general' },
    update: {},
    create: { name: 'general', isPrivate: false, createdBy: alice.id },
  });

  const random = await prisma.channel.upsert({
    where: { name: 'random' },
    update: {},
    create: { name: 'random', isPrivate: false, createdBy: alice.id },
  });

  for (const user of [alice, bob]) {
    for (const channel of [general, random]) {
      await prisma.channelMember.upsert({
        where: { userId_channelId: { userId: user.id, channelId: channel.id } },
        update: {},
        create: {
          userId: user.id,
          channelId: channel.id,
          role: user.id === alice.id && channel.id === general.id ? 'OWNER' : 'MEMBER',
        },
      });
    }
  }

  console.log('Seed complete.');
  console.log('Login with: alice@srlko.dev or bob@srlko.dev / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
