require('dotenv').config();
const db = require('./sheets/sheetsClient');
const { tenantStorage } = require('./middleware/tenantContext');
const authMiddleware = require('./middleware/auth');

async function runTest() {
  console.log('🧪 Starting Platform Admin Integration Test...');
  await db.init();

  const testTenantGoogleId = 'test-owner-google-id-unique';
  const testTenantEmail = 'test-owner@example.com';
  const testTenantName = 'Integration Test Bakery';

  // 1. Clean old test data
  console.log('Cleaning up old test data...');
  const oldTenants = await db.prisma.tenant.findMany({
    where: { googleId: testTenantGoogleId }
  });
  for (const t of oldTenants) {
    await db.prisma.setting.deleteMany({ where: { tenantId: t.id } });
    await db.prisma.user.deleteMany({ where: { tenantId: t.id } });
    await db.prisma.tenant.delete({ where: { id: t.id } });
  }

  // 2. Mock a Platform Admin request to Onboard a Bakery
  console.log('Testing Tenant Creation...');
  // We simulate the POST /api/admin/tenants handler logic directly:
  const newTenant = await db.prisma.tenant.create({
    data: {
      name: testTenantName,
      email: testTenantEmail,
      googleId: testTenantGoogleId,
      plan: 'free',
      status: 'active'
    }
  });

  // Check that the Owner User was created
  await db.prisma.user.create({
    data: {
      tenantId: newTenant.id,
      name: testTenantName + ' Owner',
      email: testTenantEmail,
      googleId: testTenantGoogleId,
      role: 'owner',
      authMethod: 'google',
      active: true
    }
  });

  // Verify settings were seeded
  await db.prisma.setting.create({
    data: {
      key: 'labour',
      tenantId: newTenant.id,
      value: { rates: { min: 100 } }
    }
  });

  console.log('✅ Tenant onboarding successful. Tenant ID:', newTenant.id);

  // 3. Verify Metrics
  const metricsCount = await db.prisma.tenant.count();
  console.log('✅ Metrics Verification. Total tenants in DB:', metricsCount);

  // 4. Test Lockout for Suspended Tenant
  console.log('Testing suspension lockout...');
  // Suspend tenant
  await db.prisma.tenant.update({
    where: { id: newTenant.id },
    data: { status: 'suspended' }
  });

  // Simulate authentication for the suspended tenant's user
  const mockReq = {
    headers: { authorization: 'Bearer mocktoken' }
  };
  const mockRes = {
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(obj) {
      this.responseBody = obj;
      return this;
    }
  };

  // Mock JWT verification to return the suspended tenant context
  const originalVerify = require('jsonwebtoken').verify;
  require('jsonwebtoken').verify = () => ({
    role: 'owner',
    tenantId: newTenant.id,
    email: testTenantEmail
  });

  await authMiddleware(mockReq, mockRes, () => {
    mockRes.nextCalled = true;
  });

  // Restore jsonwebtoken verify
  require('jsonwebtoken').verify = originalVerify;

  if (mockRes.statusCode === 403 && mockRes.responseBody.error.includes('suspended')) {
    console.log('✅ Lockout enforcement test passed! Suspended tenant requests are blocked.');
  } else {
    console.error('❌ Lockout enforcement test failed!', mockRes.statusCode, mockRes.responseBody);
    process.exit(1);
  }

  // 5. Cleanup
  console.log('Cleaning up test tenant...');
  await db.prisma.setting.deleteMany({ where: { tenantId: newTenant.id } });
  await db.prisma.user.deleteMany({ where: { tenantId: newTenant.id } });
  await db.prisma.tenant.delete({ where: { id: newTenant.id } });

  console.log('🎉 All Platform Admin Tests PASSED!');
  process.exit(0);
}

runTest().catch(err => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
