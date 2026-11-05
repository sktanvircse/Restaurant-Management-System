import * as bcrypt from 'bcryptjs';
import { generateAuthTokens, verifyAccessToken, verifyRefreshToken } from '../src/utils/jwt';
import { getPaginationOptions, formatPaginatedResult } from '../src/utils/pagination';
import { loginSchema, customerRegisterSchema } from '../src/modules/auth/auth.validation';
import { AppError, NotFoundError, UnauthorizedError, ForbiddenError, BadRequestError } from '../src/utils/errors';

async function runTests() {
  console.log('🧪 Starting Phase 2 Foundation Verification Tests...\n');
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

  // Test 1: Password hashing and comparison
  console.log('[1/5] Testing bcrypt password hashing...');
  const rawPassword = 'SecurePassword123!';
  const hash = await bcrypt.hash(rawPassword, 10);
  assert(await bcrypt.compare(rawPassword, hash), 'Bcrypt hashes and matches correctly');
  assert(!(await bcrypt.compare('WrongPassword', hash)), 'Bcrypt correctly rejects mismatched password');

  // Test 2: JWT Access & Refresh Token generation and verification
  console.log('\n[2/5] Testing JWT signing and verification...');
  const userPayload = {
    userId: 1,
    email: 'admin@spicegarden.com',
    role: 'admin',
    roleId: 2,
    branchId: 1,
  };
  const tokens = generateAuthTokens(userPayload);
  assert(Boolean(tokens.accessToken && tokens.refreshToken), 'Tokens generated with access & refresh');

  const decodedAccess = verifyAccessToken(tokens.accessToken) as any;
  assert(decodedAccess.userId === 1 && decodedAccess.email === 'admin@spicegarden.com', 'Access token payload matches correctly');

  const decodedRefresh = verifyRefreshToken(tokens.refreshToken) as any;
  assert(decodedRefresh.userId === 1 && decodedRefresh.role === 'admin', 'Refresh token payload matches correctly');

  // Test 3: Pagination helper
  console.log('\n[3/5] Testing pagination helpers...');
  const paginationOpts = getPaginationOptions({ page: '2', limit: '15' });
  assert(paginationOpts.page === 2 && paginationOpts.limit === 15 && paginationOpts.skip === 15, 'Pagination options computed accurately');

  const paginatedResult = formatPaginatedResult(['item1', 'item2'], 45, 2, 15);
  assert(paginatedResult.meta.totalPages === 3 && paginatedResult.meta.total === 45, 'Paginated metadata computed accurately');

  // Test 4: Zod Validation schemas
  console.log('\n[4/5] Testing Zod validation schemas...');
  const validLogin = loginSchema.safeParse({ email: 'user@example.com', password: 'password123' });
  assert(validLogin.success, 'Valid login schema parsed successfully');

  const invalidLogin = loginSchema.safeParse({ email: 'not-an-email', password: '123' });
  assert(!invalidLogin.success, 'Invalid email/password properly rejected');

  const validCustomer = customerRegisterSchema.safeParse({
    name: 'Rahim Khan',
    phone: '01700000000',
    password: 'Password123!',
  });
  assert(validCustomer.success, 'Valid customer register schema parsed successfully');

  // Test 5: Custom AppError hierarchy
  console.log('\n[5/5] Testing AppError classes...');
  const notFound = new NotFoundError('Item not found');
  assert(notFound.statusCode === 404 && notFound.isOperational, 'NotFoundError has 404 status');

  const unauthorized = new UnauthorizedError();
  assert(unauthorized.statusCode === 401, 'UnauthorizedError has 401 status');

  const forbidden = new ForbiddenError();
  assert(forbidden.statusCode === 403, 'ForbiddenError has 403 status');

  const badReq = new BadRequestError('Invalid input', [{ field: 'email' }]);
  assert(badReq.statusCode === 400 && badReq.errors?.length === 1, 'BadRequestError preserves errors detail');

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
