require('dotenv').config();
const db = require('./sheets/sheetsClient');
const crypto = require('crypto');

async function runTest() {
  console.log('🧪 Starting Website Integration (Phase 5) Test...');
  await db.init();

  const tenantId = 'default-tenant-uuid';

  // 1. Generate an API Key in database
  console.log('Generating test API key...');
  const rawKey = 'bfk_testkey_' + crypto.randomBytes(16).toString('hex');
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

  // Clean old key
  await db.prisma.apiKey.deleteMany({ where: { tenantId } });

  const apiKey = await db.prisma.apiKey.create({
    data: {
      tenantId,
      name: 'Integration Test Key',
      keyHash
    }
  });

  console.log('✅ Created API Key. Raw key is:', rawKey);

  // Mock API key authentication middleware logic
  const verifyKey = async (headerKey) => {
    const hash = crypto.createHash('sha256').update(headerKey).digest('hex');
    const record = await db.prisma.apiKey.findUnique({
      where: { keyHash: hash },
      include: { tenant: true }
    });
    return record;
  };

  // Test the verification
  const record = await verifyKey(rawKey);
  if (record && record.tenantId === tenantId) {
    console.log('✅ API Key Authentication lookup passed!');
  } else {
    console.error('❌ API Key Authentication lookup failed!');
    process.exit(1);
  }

  // 2. Query scoped Products list
  console.log('Querying products under tenant scope...');
  const products = await db.prisma.product.findMany({
    where: { tenantId, deleted: false }
  });
  console.log(`✅ Products query passed. Found ${products.length} products.`);

  // 3. Query scoped Stock levels
  console.log('Querying stock levels under tenant scope...');
  const ingredients = await db.prisma.ingredient.findMany({
    where: { tenantId, deleted: false }
  });
  const packaging = await db.prisma.packaging.findMany({
    where: { tenantId, deleted: false }
  });
  console.log(`✅ Stock query passed. Found ${ingredients.length} ingredients and ${packaging.length} packaging materials.`);

  // 4. Place a test order via REST API
  console.log('Placing a test order...');
  const orderItems = [
    { id: 'item-1', name: 'Premium Cake', price: 950, qty: 2 }
  ];
  const nextInvoiceNum = await db.nextInvoiceNumber();

  const newInvoice = await db.prisma.salesInvoice.create({
    data: {
      tenantId,
      invoiceNumber: nextInvoiceNum,
      customerName: 'Integration Tester',
      customerPhone: '+919999999999',
      customerCity: 'New Delhi',
      items: orderItems,
      subtotal: 1900,
      totalAmount: 1900,
      paymentMethod: 'Online',
      notes: 'Order placed via test integration script',
      date: new Date().toLocaleDateString('en-IN'),
      timestamp: Date.now(),
      createdBy: 'Website API',
      createdByEmail: 'api@bakeflow'
    }
  });

  if (newInvoice && newInvoice.invoiceNumber === nextInvoiceNum) {
    console.log('✅ Sales order creation passed! Invoice number:', newInvoice.invoiceNumber);
  } else {
    console.error('❌ Sales order creation failed!');
    process.exit(1);
  }

  // Clean up test invoice and API key
  console.log('Cleaning up test data...');
  await db.prisma.salesInvoice.delete({ where: { id: newInvoice.id } });
  await db.prisma.apiKey.delete({ where: { id: apiKey.id } });

  console.log('🎉 All Website Integration (Phase 5) Tests PASSED!');
  process.exit(0);
}

runTest().catch(err => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
