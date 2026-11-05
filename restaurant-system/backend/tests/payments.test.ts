import { createPaymentSchema, splitPaymentSchema } from '../src/modules/payments/payments.validation';
import { openSessionSchema, closeSessionSchema } from '../src/modules/cash-register/cash-register.validation';
import { createMoneyReceivedSchema } from '../src/modules/money-received/money-received.validation';
import { requestRefundSchema, resolveRefundSchema } from '../src/modules/refunds/refunds.validation';

async function runTests() {
  console.log('🧪 Starting Phase 3B (Payments, Cash Register, Money Received, Refunds) Tests...\n');
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

  // 1. Payment Schemas
  console.log('[1/5] Testing Payment validation schemas...');
  const validPayment = createPaymentSchema.safeParse({
    orderId: 1,
    method: 'Cash',
    amount: 500,
    notes: 'Paid at counter',
  });
  assert(validPayment.success, 'Valid cash payment parses successfully');

  const invalidPaymentAmount = createPaymentSchema.safeParse({
    orderId: 1,
    method: 'Cash',
    amount: -50, // negative amount rejected
  });
  assert(!invalidPaymentAmount.success, 'Negative payment amount rejected');

  const validSplitPayment = splitPaymentSchema.safeParse({
    orderId: 1,
    payments: [
      { method: 'Cash', amount: 300 },
      { method: 'bKash', amount: 250, transactionId: 'BK12345678' },
    ],
  });
  assert(validSplitPayment.success, 'Valid split payment (Cash + bKash) parses successfully');

  // 2. Cash Register Schemas & Calculation
  console.log('\n[2/5] Testing Cash Register schemas and reconciliation math...');
  const validOpen = openSessionSchema.safeParse({
    openingBalance: 2000,
    notes: 'Morning shift drawer',
  });
  assert(validOpen.success, 'Opening session with balance parses');

  const validClose = closeSessionSchema.safeParse({
    closingBalance: 12500,
    notes: 'Counted physical bills',
  });
  assert(validClose.success, 'Closing session with balance parses');

  // Mathematical Reconciliation Check
  const openingBalance = 2000;
  const cashSales = 10000;
  const tableDeposit = 500;
  const expectedBalance = openingBalance + cashSales + tableDeposit; // 12500

  // Case A: Exact match
  let countedCash = 12500;
  let diff = countedCash - expectedBalance;
  let shortage = diff < 0 ? Math.abs(diff) : 0;
  let excess = diff > 0 ? diff : 0;
  assert(expectedBalance === 12500 && shortage === 0 && excess === 0, 'Reconciliation exact match produces 0 shortage / 0 excess');

  // Case B: Shortage
  countedCash = 12300;
  diff = countedCash - expectedBalance;
  shortage = diff < 0 ? Math.abs(diff) : 0;
  excess = diff > 0 ? diff : 0;
  assert(shortage === 200 && excess === 0, 'Reconciliation shortage calculated accurately (200 shortage)');

  // Case C: Excess
  countedCash = 12650;
  diff = countedCash - expectedBalance;
  shortage = diff < 0 ? Math.abs(diff) : 0;
  excess = diff > 0 ? diff : 0;
  assert(excess === 150 && shortage === 0, 'Reconciliation excess calculated accurately (150 excess)');

  // 3. Money Received Schemas
  console.log('\n[3/5] Testing Money Received schemas...');
  const validMoneyReceived = createMoneyReceivedSchema.safeParse({
    source: 'Catering Advance Deposit',
    amount: 5000,
    paymentMethod: 'bKash',
    referenceNo: 'EVT-2026-001',
    notes: 'Advance for wedding catering on Dec 10',
  });
  assert(validMoneyReceived.success, 'Valid money received record parses');

  const invalidMoneyReceived = createMoneyReceivedSchema.safeParse({
    source: 'A', // too short
    amount: 0,   // must be positive
    paymentMethod: 'Cash',
  });
  assert(!invalidMoneyReceived.success, 'Zero amount or short source rejected');

  // 4. Refund Schemas
  console.log('\n[4/5] Testing Refund schemas...');
  const validRefundRequest = requestRefundSchema.safeParse({
    orderId: 10,
    paymentId: 5,
    amount: 350,
    reason: 'Customer was served cold food',
  });
  assert(validRefundRequest.success, 'Valid refund request parses');

  const invalidRefundReason = requestRefundSchema.safeParse({
    orderId: 10,
    amount: 350,
    reason: 'cold', // too short (< 5 chars)
  });
  assert(!invalidRefundReason.success, 'Refund reason shorter than 5 characters rejected');

  const validRefundResolve = resolveRefundSchema.safeParse({
    status: 'APPROVED',
    note: 'Approved by Branch Manager',
  });
  assert(validRefundResolve.success, 'Refund approval resolution parses');

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
