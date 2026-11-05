import { createEmployeeSchema, createShiftSchema, recordAttendanceSchema, applyLeaveSchema, generateSalarySheetSchema } from '../src/modules/hr/hr.validation';
import { createExpenseSchema, createExpenseCategorySchema } from '../src/modules/expenses/expenses.validation';
import { updateCustomerProfileSchema, createAddressSchema } from '../src/modules/customers/customers.validation';
import { createCouponSchema, validateCouponSchema } from '../src/modules/coupons/coupons.validation';
import { createReviewSchema, replyReviewSchema } from '../src/modules/reviews/reviews.validation';

async function runTests() {
  console.log('🧪 Starting Phase 3D (HR, Expenses, Customers, Coupons, Reviews) Tests...\n');
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

  // 1. HR & Staff Management Schemas
  console.log('[1/5] Testing HR & Employee schemas...');
  const validEmployee = createEmployeeSchema.safeParse({
    userId: 5,
    branchId: 1,
    designation: 'Head Waiter',
    basicSalary: 22000,
    bankAccount: '1234567890',
    bankName: 'Dutch-Bangla Bank',
    joinDate: '2024-01-15',
    emergencyName: 'Mrs. Karim',
    emergencyPhone: '01799887766',
  });
  assert(validEmployee.success, 'Valid employee record definition parses');

  const validShift = createShiftSchema.safeParse({
    branchId: 1,
    name: 'Evening Dinner Shift',
    startTime: '16:00',
    endTime: '23:30',
    daysOfWeek: '1,2,3,4,5,6,7',
  });
  assert(validShift.success, 'Valid shift timing parses');

  const validAttendance = recordAttendanceSchema.safeParse({
    employeeId: 3,
    date: '2026-11-05',
    status: 'PRESENT',
    note: 'Clocked in on time',
  });
  assert(validAttendance.success, 'Attendance clock-in parses');

  const validLeave = applyLeaveSchema.safeParse({
    employeeId: 3,
    fromDate: '2026-11-10',
    toDate: '2026-11-12',
    type: 'CASUAL',
    reason: 'Family wedding event',
  });
  assert(validLeave.success, 'Leave application parses');

  const validSalarySheet = generateSalarySheetSchema.safeParse({
    branchId: 1,
    month: 11,
    year: 2026,
  });
  assert(validSalarySheet.success, 'Salary payroll request parses');

  // 2. Expenses Schemas
  console.log('\n[2/5] Testing Expense schemas...');
  const validExpCategory = createExpenseCategorySchema.safeParse({
    branchId: 1,
    name: 'Kitchen Utilities & Gas',
  });
  assert(validExpCategory.success, 'Expense category definition parses');

  const validExpense = createExpenseSchema.safeParse({
    branchId: 1,
    expenseCategoryId: 1,
    description: 'LP Gas Cylinder refill (x4)',
    amount: 5800,
    paymentMethod: 'Cash',
    expenseDate: '2026-11-05',
  });
  assert(validExpense.success, 'Valid expense voucher parses');

  // 3. Customer Profile & Addresses
  console.log('\n[3/5] Testing Customer & Address schemas...');
  const validProfile = updateCustomerProfileSchema.safeParse({
    name: 'Sarah Rahman',
    phone: '01711223344',
  });
  assert(validProfile.success, 'Customer profile update parses');

  const validAddress = createAddressSchema.safeParse({
    label: 'Office',
    line1: 'Level 8, Tower 71',
    area: 'Gulshan-2',
    city: 'Dhaka',
    isDefault: true,
  });
  assert(validAddress.success, 'Customer address entry parses');

  // 4. Coupons & Loyalty Points
  console.log('\n[4/5] Testing Coupon & Loyalty schemas...');
  const validCoupon = createCouponSchema.safeParse({
    branchId: 1,
    code: 'FESTIVE25',
    type: 'PERCENTAGE',
    value: 25,
    minOrderAmount: 400,
    maxDiscount: 250,
    validFrom: '2026-11-01T00:00:00.000Z',
    validUntil: '2026-12-31T23:59:59.000Z',
  });
  assert(validCoupon.success, 'Coupon definition parses');

  const validValidateCoupon = validateCouponSchema.safeParse({
    branchId: 1,
    code: 'FESTIVE25',
    orderAmount: 650,
  });
  assert(validValidateCoupon.success, 'Coupon validation payload parses');

  // 5. Reviews Schemas
  console.log('\n[5/5] Testing Review schemas...');
  const validReview = createReviewSchema.safeParse({
    orderId: 15,
    foodRating: 5,
    serviceRating: 4,
    overallRating: 5,
    comment: 'The Butter Chicken and Naan were extraordinarily tender and delicious!',
  });
  assert(validReview.success, 'Customer rating and review parses');

  const validReply = replyReviewSchema.safeParse({
    managerReply: 'Thank you for your delightful review! Looking forward to serving you again soon.',
  });
  assert(validReply.success, 'Managerial review response parses');

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
