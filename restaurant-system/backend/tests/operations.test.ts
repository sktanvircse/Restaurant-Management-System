import { createZoneSchema, createRiderSchema, updateDeliveryStatusSchema, submitCODSchema } from '../src/modules/delivery/delivery.validation';
import { createReservationSchema, updateReservationStatusSchema } from '../src/modules/reservations/reservations.validation';
import { createIngredientSchema, createRecipeSchema, recordWastageSchema } from '../src/modules/inventory/inventory.validation';
import { createSupplierSchema, createPurchaseOrderSchema, receivePurchaseOrderSchema } from '../src/modules/suppliers/suppliers.validation';

async function runTests() {
  console.log('🧪 Starting Phase 3C (Operations & Inventory) Verification Tests...\n');
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

  // 1. Delivery & Rider Schemas
  console.log('[1/4] Testing Delivery & Rider schemas...');
  const validZone = createZoneSchema.safeParse({
    branchId: 1,
    name: 'Banani & Gulshan-1',
    deliveryCharge: 80,
    estimatedMinutes: 30,
  });
  assert(validZone.success, 'Valid delivery zone definition parses');

  const validRider = createRiderSchema.safeParse({
    userId: 7,
    branchId: 1,
    vehicleType: 'Motorcycle',
    vehicleNumber: 'DHAKA-METRO-HA-1234',
  });
  assert(validRider.success, 'Valid rider registration parses');

  const validDeliveryStatus = updateDeliveryStatusSchema.safeParse({
    status: 'ON_THE_WAY',
    notes: 'Rider picked up order from kitchen',
  });
  assert(validDeliveryStatus.success, 'Delivery status transition parses');

  const validCOD = submitCODSchema.safeParse({ codAmount: 1250 });
  assert(validCOD.success, 'COD amount collection parses');

  // 2. Reservation Schemas
  console.log('\n[2/4] Testing Reservation schemas...');
  const futureDate = new Date(Date.now() + 86400000 * 2).toISOString();
  const validReservation = createReservationSchema.safeParse({
    branchId: 1,
    guestName: 'Dr. Anwarul Haque',
    guestPhone: '01819876543',
    guestEmail: 'anwar@example.com',
    reservedAt: futureDate,
    partySize: 6,
    tablePreference: 'Rooftop VIP',
    notes: 'Anniversary dinner setup',
  });
  assert(validReservation.success, 'Valid table reservation parses');

  const validSeated = updateReservationStatusSchema.safeParse({
    status: 'SEATED',
    tableId: 8,
  });
  assert(validSeated.success, 'Reservation seated status with tableId parses');

  // 3. Inventory & Recipe Schemas
  console.log('\n[3/4] Testing Inventory & Recipe schemas...');
  const validIngredient = createIngredientSchema.safeParse({
    branchId: 1,
    name: 'Fresh Mozzarella Cheese',
    unit: 'kg',
    currentStock: 15,
    lowStockThreshold: 3,
    costPerUnit: 650,
  });
  assert(validIngredient.success, 'Valid ingredient definition parses');

  const validRecipe = createRecipeSchema.safeParse({
    menuItemId: 4,
    ingredientId: 2,
    quantity: 0.25,
    unit: 'kg',
  });
  assert(validRecipe.success, 'Valid recipe mapping parses');

  const validWastage = recordWastageSchema.safeParse({
    ingredientId: 1,
    quantity: 2.5,
    reason: 'Power outage spoiled chilled chicken',
  });
  assert(validWastage.success, 'Valid wastage record parses');

  // 4. Supplier & Purchase Order Schemas
  console.log('\n[4/4] Testing Supplier & Purchase Order schemas...');
  const validSupplier = createSupplierSchema.safeParse({
    branchId: 1,
    name: 'Green Agro Suppliers',
    contactPerson: 'Md. Shahidul Islam',
    phone: '01715555555',
    email: 'contact@greenagro.com',
    address: 'Savar, Dhaka',
  });
  assert(validSupplier.success, 'Valid supplier profile parses');

  const validPO = createPurchaseOrderSchema.safeParse({
    branchId: 1,
    supplierId: 1,
    items: [
      { ingredientId: 1, quantity: 50, unitCost: 280 },
      { ingredientId: 3, quantity: 100, unitCost: 85 },
    ],
  });
  assert(validPO.success, 'Valid Purchase Order parses');

  const validReceivePO = receivePurchaseOrderSchema.safeParse({
    receivedItems: [
      { purchaseItemId: 1, receivedQty: 50 },
      { purchaseItemId: 2, receivedQty: 100 },
    ],
  });
  assert(validReceivePO.success, 'Valid PO goods receipt parses');

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
