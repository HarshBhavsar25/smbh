const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('SMBH@@PP25', 10);
  await prisma.user.upsert({
    where: { email: 'shreemauliboyshostel@gmail.com' },
    update: { password: hashedPassword, role: 'ADMIN' },
    create: {
      email: 'shreemauliboyshostel@gmail.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });
  console.log('Admin user seeded successfully');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
