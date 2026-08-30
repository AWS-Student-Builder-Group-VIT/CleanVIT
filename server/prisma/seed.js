const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.notification.deleteMany();
  await prisma.cleaningRequest.deleteMany();
  await prisma.user.deleteMany();
  await prisma.block.deleteMany();

  // Create blocks
  const blockA = await prisma.block.create({
    data: { name: 'Block A', type: 'BOYS' },
  });

  const blockB = await prisma.block.create({
    data: { name: 'Block B', type: 'GIRLS' },
  });

  const blockC = await prisma.block.create({
    data: { name: 'Block C', type: 'MIXED' },
  });

  console.log('✅ Created blocks:', blockA.name, blockB.name, blockC.name);

  const passwordHash = await bcrypt.hash('password123', 12);

  // Create supervisors
  const supA = await prisma.user.create({
    data: {
      role: 'SUPERVISOR',
      name: 'Supervisor A',
      email: 'supervisor.a@cleantrack.app',
      passwordHash,
      blockId: blockA.id,
    },
  });

  const supB = await prisma.user.create({
    data: {
      role: 'SUPERVISOR',
      name: 'Supervisor B',
      email: 'supervisor.b@cleantrack.app',
      passwordHash,
      blockId: blockB.id,
    },
  });

  const supC = await prisma.user.create({
    data: {
      role: 'SUPERVISOR',
      name: 'Supervisor C',
      email: 'supervisor.c@cleantrack.app',
      passwordHash,
      blockId: blockC.id,
    },
  });

  // Update blocks with supervisor IDs
  await prisma.block.update({ where: { id: blockA.id }, data: { supervisorId: supA.id } });
  await prisma.block.update({ where: { id: blockB.id }, data: { supervisorId: supB.id } });
  await prisma.block.update({ where: { id: blockC.id }, data: { supervisorId: supC.id } });

  console.log('✅ Created supervisors');

  // Create staff members (2 per block)
  const staffNames = ['Raju', 'Meena', 'Suresh', 'Priya', 'Kiran', 'Anita'];
  const blocks = [blockA, blockA, blockB, blockB, blockC, blockC];

  for (let i = 0; i < staffNames.length; i++) {
    await prisma.user.create({
      data: {
        role: 'STAFF',
        name: staffNames[i],
        email: `${staffNames[i].toLowerCase()}@cleantrack.app`,
        passwordHash,
        blockId: blocks[i].id,
      },
    });
  }

  console.log('✅ Created staff members');

  // Create a demo student
  await prisma.user.create({
    data: {
      role: 'STUDENT',
      name: 'Demo Student',
      regNo: '22BCE1234',
      passwordHash,
      blockId: blockA.id,
      roomNo: '223',
    },
  });

  console.log('✅ Created demo student (regNo: 22BCE1234, password: password123)');

  console.log('\n📋 Demo Credentials:');
  console.log('─────────────────────────────────────');
  console.log('Student:    regNo: 22BCE1234 / password123');
  console.log('Supervisor: email: supervisor.a@cleantrack.app / password123');
  console.log('Staff:      email: raju@cleantrack.app / password123');
  console.log('─────────────────────────────────────');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
