require('dotenv').config();
const db = require('./sheets/sheetsClient');
const { tenantStorage } = require('./middleware/tenantContext');

async function runTest() {
  console.log('🧪 Starting Tenant Isolation Integration Test...');
  
  await db.init();

  const tenantAId = 'tenant-a-uuid';
  const tenantBId = 'tenant-b-uuid';

  await db.prisma.tenant.upsert({
    where: { googleId: 'tenant-a-google' },
    update: {},
    create: { id: tenantAId, name: 'Bakery A', googleId: 'tenant-a-google', email: 'owner-a@example.com' }
  });

  await db.prisma.tenant.upsert({
    where: { googleId: 'tenant-b-google' },
    update: {},
    create: { id: tenantBId, name: 'Bakery B', googleId: 'tenant-b-google', email: 'owner-b@example.com' }
  });

  // Clean old test data (without context so it runs globally)
  await db.prisma.ingredient.deleteMany({
    where: { id: { in: ['test-ing-a', 'test-ing-b'] } }
  });

  console.log('Inserting test data under different tenant scopes...');

  // Set context to Tenant A and create Ingredient A
  await tenantStorage.run({ tenantId: tenantAId }, async () => {
    await db.prisma.ingredient.create({
      data: {
        id: 'test-ing-a',
        name: 'Secret Flour A',
        cat: 'Dry',
        unit: 'kg',
        rate: 50
      }
    });
  });

  // Set context to Tenant B and create Ingredient B
  await tenantStorage.run({ tenantId: tenantBId }, async () => {
    await db.prisma.ingredient.create({
      data: {
        id: 'test-ing-b',
        name: 'Secret Flour B',
        cat: 'Dry',
        unit: 'kg',
        rate: 60
      }
    });
  });

  console.log('Verifying read scope isolation...');

  // 1. Read as Tenant A
  await tenantStorage.run({ tenantId: tenantAId }, async () => {
    const ingredients = await db.prisma.ingredient.findMany({});
    const names = ingredients.map(i => i.name);
    console.log('Tenant A sees:', names);
    if (names.includes('Secret Flour A') && !names.includes('Secret Flour B')) {
      console.log('✅ Tenant A isolation test passed');
    } else {
      console.error('❌ Tenant A isolation test failed!');
      process.exit(1);
    }
  });

  // 2. Read as Tenant B
  await tenantStorage.run({ tenantId: tenantBId }, async () => {
    const ingredients = await db.prisma.ingredient.findMany({});
    const names = ingredients.map(i => i.name);
    console.log('Tenant B sees:', names);
    if (names.includes('Secret Flour B') && !names.includes('Secret Flour A')) {
      console.log('✅ Tenant B isolation test passed');
    } else {
      console.error('❌ Tenant B isolation test failed!');
      process.exit(1);
    }
  });

  // Cleanup test data
  await db.prisma.ingredient.deleteMany({
    where: { id: { in: ['test-ing-a', 'test-ing-b'] } }
  });
  await db.prisma.tenant.deleteMany({
    where: { id: { in: [tenantAId, tenantBId] } }
  });

  console.log('🎉 All Tenant Isolation Tests PASSED!');
  process.exit(0);
}

runTest().catch(err => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
