import { createMenuItemSchema } from '../src/modules/menu/menu.validation';
import { createTableSchema, transferTableSchema } from '../src/modules/tables/tables.validation';
import { createOrderSchema, updateOrderStatusSchema, voidOrderSchema } from '../src/modules/orders/orders.validation';

async function runTests() {
  console.log('🧪 Starting Phase 3A (Menu, Tables, Orders) Verification Tests...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // 1. Menu Item Schema
  console.log('[1/4] Testing Menu Item validation schemas...');
  const validMenuItem = createMenuItemSchema.safeParse({
    categoryId: 1,
    branchId: 1,
    name: 'Tandoori Mixed Grill',
    basePrice: 550,
    station: 'GRILL',
    prepTime: 25,
    variants: [
      { name: 'Regular', priceModifier: 0, isDefault: true, isAvailable: true },
      { name: 'Large', priceModifier: 200, isDefault: false, isAvailable: true },
    ],
    addonGroups: [
      {
        name: 'Extra Sauce',
        isRequired: false,
        minSelect: 0,
        maxSelect: 2,
        addons: [
          { name: 'Mint Chutney', price: 30, isAvailable: true },
          { name: 'Garlic Mayo', price: 40, isAvailable: true },
        ],
      },
    ],
  });
  assert(validMenuItem.success, 'Valid menu item with variants and addon groups parses');

  const invalidStation = createMenuItemSchema.safeParse({
    categoryId: 1,
    branchId: 1,
    name: 'Invalid Item',
    basePrice: 100,
    station: 'UNKNOWN_STATION', // not in enum
  });
  assert(!invalidStation.success, 'Invalid station name rejected by enum');

  // 2. Table Validation
  console.log('\n[2/4] Testing Table schemas...');
  const validTable = createTableSchema.safeParse({
    branchId: 1,
    tableNumber: 'T-101',
    capacity: 6,
    section: 'VIP Lounge',
    status: 'AVAILABLE',
  });
  assert(validTable.success, 'Valid table definition parses');

  const validTransfer = transferTableSchema.safeParse({
    fromTableId: 1,
    toTableId: 2,
  });
  assert(validTransfer.success, 'Valid table transfer payload parses');

  // 3. Order Input Validation
  console.log('\n[3/4] Testing Order Input schemas...');
  const validDineInOrder = createOrderSchema.safeParse({
    branchId: 1,
    type: 'DINE_IN',
    tableId: 2,
    items: [
      {
        menuItemId: 1,
        quantity: 2,
        notes: 'Less spicy please',
        addonIds: [1, 2],
      },
      {
        menuItemId: 5,
        variantId: 2,
        quantity: 1,
      },
    ],
  });
  assert(validDineInOrder.success, 'Valid Dine-In order with items and addons parses');

  const validDeliveryOrder = createOrderSchema.safeParse({
    branchId: 1,
    type: 'DELIVERY',
    deliveryZoneId: 1,
    guestName: 'Tanvir Hossain',
    guestPhone: '01712345678',
    deliveryAddress: {
      line1: 'House 42, Road 7',
      area: 'Dhanmondi',
      city: 'Dhaka',
    },
    items: [{ menuItemId: 3, quantity: 1 }],
  });
  assert(validDeliveryOrder.success, 'Valid Delivery order with custom address parses');

  const emptyItemsOrder = createOrderSchema.safeParse({
    branchId: 1,
    type: 'TAKEAWAY',
    items: [], // empty items rejected
  });
  assert(!emptyItemsOrder.success, 'Order with empty items array rejected');

  // 4. Order Status Transition & Voiding
  console.log('\n[4/4] Testing Order Status & Void schemas...');
  const validStatusUpdate = updateOrderStatusSchema.safeParse({
    status: 'READY',
    note: 'Chef marked ready for serving',
  });
  assert(validStatusUpdate.success, 'Valid status transition parses');

  const invalidVoid = voidOrderSchema.safeParse({
    reason: 'abc', // too short (< 5 chars)
  });
  assert(!invalidVoid.success, 'Void reason shorter than 5 chars rejected');

  const validVoid = voidOrderSchema.safeParse({
    reason: 'Customer cancelled due to emergency',
  });
  assert(validVoid.success, 'Valid manager void reason accepted');

  console.log('\n' + '='.repeat(50));
  console.log(`SUMMARY: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(50));

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
