import { PrismaClient, OrderStatus, OrderType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...\n');

  // ============================================================
  // 1. ROLES
  // ============================================================
  console.log('Creating roles...');
  const roleNames = [
    { name: 'super_admin', description: 'Full system access including all branches and settings' },
    { name: 'admin', description: 'Full business control for their branch' },
    { name: 'manager', description: 'Daily operations management' },
    { name: 'cashier', description: 'POS, payments, cash register' },
    { name: 'waiter', description: 'Table and dine-in order management' },
    { name: 'kitchen', description: 'Kitchen display and order preparation' },
    { name: 'rider', description: 'Delivery management' },
    { name: 'accountant', description: 'Financial reports and records' },
    { name: 'inventory', description: 'Stock, ingredients, suppliers' },
    { name: 'hr', description: 'Employee, attendance, salary management' },
  ];

  const roles: Record<string, { id: number; name: string; description: string | null; createdAt: Date; updatedAt: Date }> = {};
  for (const r of roleNames) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description },
      create: r,
    });
    roles[r.name] = role;
  }
  console.log(`  ✅ ${Object.keys(roles).length} roles created`);

  // ============================================================
  // 2. PERMISSIONS
  // ============================================================
  console.log('Creating permissions...');
  const modules = [
    'dashboard', 'orders', 'menu', 'tables', 'kitchen', 'payments',
    'cash_register', 'money_received', 'delivery', 'inventory', 'recipes',
    'suppliers', 'expenses', 'hr', 'customers', 'coupons', 'reviews',
    'reports', 'reservations', 'notifications', 'settings', 'audit_logs',
    'roles', 'branches', 'salary',
  ];
  const actions = ['view', 'create', 'edit', 'delete', 'approve', 'export'];

  const permissions: Record<string, { id: number; module: string; action: string; description: string | null }> = {};
  for (const module of modules) {
    for (const action of actions) {
      const perm = await prisma.permission.upsert({
        where: { module_action: { module, action } },
        update: {},
        create: { module, action },
      });
      permissions[`${module}:${action}`] = perm;
    }
  }
  console.log(`  ✅ ${Object.keys(permissions).length} permissions created`);

  // ============================================================
  // 3. ROLE PERMISSIONS (grant matrix)
  // ============================================================
  console.log('Assigning role permissions...');

  const grantPermissions = async (roleName: string, grants: string[]) => {
    for (const grant of grants) {
      const perm = permissions[grant];
      if (!perm) { console.warn(`  ⚠️  Permission not found: ${grant}`); continue; }
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: roles[roleName].id, permissionId: perm.id } },
        update: {},
        create: { roleId: roles[roleName].id, permissionId: perm.id },
      });
    }
  };

  // Super Admin gets everything
  const allPerms = Object.keys(permissions);
  await grantPermissions('super_admin', allPerms);

  // Admin
  const adminPerms = allPerms.filter(p =>
    !p.startsWith('audit_logs:delete') && !p.startsWith('branches:delete')
  );
  await grantPermissions('admin', adminPerms);

  // Manager
  await grantPermissions('manager', [
    'dashboard:view', 'orders:view', 'orders:create', 'orders:edit', 'orders:approve',
    'menu:view', 'menu:edit', 'tables:view', 'tables:create', 'tables:edit',
    'kitchen:view', 'kitchen:edit', 'payments:view', 'payments:approve',
    'cash_register:view', 'money_received:view', 'money_received:create',
    'delivery:view', 'delivery:edit', 'delivery:create',
    'inventory:view', 'customers:view', 'coupons:view', 'coupons:create', 'coupons:edit',
    'reviews:view', 'reviews:edit', 'reports:view', 'reports:export',
    'reservations:view', 'reservations:create', 'reservations:edit', 'reservations:approve',
    'notifications:view', 'settings:view', 'settings:edit',
    'hr:view', 'salary:view', 'salary:approve', 'expenses:view', 'expenses:create',
    'suppliers:view',
  ]);

  // Cashier
  await grantPermissions('cashier', [
    'dashboard:view', 'orders:view', 'orders:create', 'orders:edit',
    'menu:view', 'tables:view', 'tables:edit',
    'payments:view', 'payments:create',
    'cash_register:view', 'cash_register:create', 'cash_register:edit',
    'money_received:view', 'money_received:create',
    'customers:view', 'coupons:view', 'coupons:create',
    'reservations:view', 'notifications:view',
    'delivery:view', 'delivery:edit',
  ]);

  // Waiter
  await grantPermissions('waiter', [
    'orders:view', 'orders:create', 'orders:edit',
    'menu:view', 'tables:view', 'tables:edit',
    'notifications:view', 'customers:view',
    'reservations:view',
  ]);

  // Kitchen
  await grantPermissions('kitchen', [
    'orders:view', 'menu:view', 'menu:edit',
    'kitchen:view', 'kitchen:create', 'kitchen:edit',
    'notifications:view', 'inventory:view',
  ]);

  // Rider
  await grantPermissions('rider', [
    'delivery:view', 'delivery:edit',
    'orders:view', 'customers:view',
    'notifications:view',
  ]);

  // Accountant
  await grantPermissions('accountant', [
    'dashboard:view', 'orders:view',
    'payments:view', 'payments:export',
    'cash_register:view', 'cash_register:export',
    'money_received:view', 'money_received:export',
    'expenses:view', 'expenses:export',
    'salary:view', 'salary:export',
    'suppliers:view', 'reports:view', 'reports:export',
    'customers:view', 'coupons:view', 'notifications:view',
    'inventory:view',
  ]);

  // Inventory Manager
  await grantPermissions('inventory', [
    'dashboard:view', 'inventory:view', 'inventory:create', 'inventory:edit', 'inventory:delete', 'inventory:export',
    'recipes:view', 'recipes:create', 'recipes:edit', 'recipes:delete',
    'suppliers:view', 'suppliers:create', 'suppliers:edit',
    'menu:view', 'reports:view', 'notifications:view',
    'expenses:view', 'expenses:create',
  ]);

  // HR
  await grantPermissions('hr', [
    'dashboard:view', 'hr:view', 'hr:create', 'hr:edit', 'hr:delete', 'hr:export',
    'salary:view', 'salary:create', 'salary:edit', 'salary:approve', 'salary:export',
    'notifications:view', 'reports:view',
  ]);

  console.log('  ✅ Role permissions assigned');

  // ============================================================
  // 4. BRANCHES
  // ============================================================
  console.log('Creating branches...');
  const branch1 = await prisma.branch.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Spice Garden HQ',
      address: 'House 12, Road 4, Dhanmondi, Dhaka 1205',
      phone: '+880-2-9876543',
      email: 'hq@spicegarden.com',
      timezone: 'Asia/Dhaka',
      currency: 'BDT',
      taxRate: 7.5,
      serviceChargeRate: 5.0,
      openingTime: '10:00',
      closingTime: '23:00',
    },
  });

  const branch2 = await prisma.branch.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: 'Spice Garden Gulshan',
      address: 'Plot 54, Road 11, Gulshan-2, Dhaka 1212',
      phone: '+880-2-8877123',
      email: 'gulshan@spicegarden.com',
      timezone: 'Asia/Dhaka',
      currency: 'BDT',
      taxRate: 7.5,
      serviceChargeRate: 5.0,
      openingTime: '11:00',
      closingTime: '22:00',
    },
  });
  console.log(`  ✅ 2 branches created`);

  // ============================================================
  // 5. DEMO USERS (one per role)
  // ============================================================
  console.log('Creating demo users...');
  const password = await bcrypt.hash('Password123!', 12);

  const demoUsers = [
    {
      name: 'Super Admin', email: 'superadmin@spicegarden.com',
      phone: '+8801700000001', role: 'super_admin', branchId: branch1.id,
    },
    {
      name: 'Admin Owner', email: 'admin@spicegarden.com',
      phone: '+8801700000002', role: 'admin', branchId: branch1.id,
    },
    {
      name: 'Manager Rahim', email: 'manager@spicegarden.com',
      phone: '+8801700000003', role: 'manager', branchId: branch1.id,
    },
    {
      name: 'Cashier Riya', email: 'cashier@spicegarden.com',
      phone: '+8801700000004', role: 'cashier', branchId: branch1.id,
    },
    {
      name: 'Waiter Karim', email: 'waiter@spicegarden.com',
      phone: '+8801700000005', role: 'waiter', branchId: branch1.id,
    },
    {
      name: 'Chef Hasan', email: 'kitchen@spicegarden.com',
      phone: '+8801700000006', role: 'kitchen', branchId: branch1.id,
    },
    {
      name: 'Rider Milon', email: 'rider@spicegarden.com',
      phone: '+8801700000007', role: 'rider', branchId: branch1.id,
    },
    {
      name: 'Accountant Nadia', email: 'accountant@spicegarden.com',
      phone: '+8801700000008', role: 'accountant', branchId: branch1.id,
    },
    {
      name: 'Inventory Sumon', email: 'inventory@spicegarden.com',
      phone: '+8801700000009', role: 'inventory', branchId: branch1.id,
    },
    {
      name: 'HR Fatema', email: 'hr@spicegarden.com',
      phone: '+8801700000010', role: 'hr', branchId: branch1.id,
    },
    // Branch 2 staff
    {
      name: 'Manager Gulshan', email: 'manager2@spicegarden.com',
      phone: '+8801700000011', role: 'manager', branchId: branch2.id,
    },
    {
      name: 'Cashier Gulshan', email: 'cashier2@spicegarden.com',
      phone: '+8801700000012', role: 'cashier', branchId: branch2.id,
    },
  ];

  const createdUsers: Record<string, { id: number }> = {};
  for (const u of demoUsers) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        name: u.name,
        email: u.email,
        phone: u.phone,
        passwordHash: password,
        branchId: u.branchId,
        roleId: roles[u.role].id,
        isActive: true,
      },
    });
    createdUsers[u.email] = user;
  }
  console.log(`  ✅ ${demoUsers.length} staff users created`);

  // ============================================================
  // 6. EMPLOYEES (link to users)
  // ============================================================
  console.log('Creating employee records...');
  const employeeUsers = demoUsers.filter(u => !['super_admin', 'admin'].includes(u.role));
  for (const u of employeeUsers) {
    const user = createdUsers[u.email];
    await prisma.employee.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        branchId: u.branchId,
        designation: u.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        basicSalary: u.role === 'manager' ? 35000 : u.role === 'cashier' ? 20000 : 18000,
        joinDate: new Date('2024-01-01'),
      },
    });
  }
  console.log(`  ✅ Employee records created`);

  // ============================================================
  // 7. RIDER profile
  // ============================================================
  const riderUser = createdUsers['rider@spicegarden.com'];
  await prisma.rider.upsert({
    where: { userId: riderUser.id },
    update: {},
    create: {
      userId: riderUser.id,
      branchId: branch1.id,
      vehicleType: 'Motorcycle',
      vehicleNumber: 'DM-11-1234',
      isAvailable: true,
    },
  });

  // ============================================================
  // 8. DEMO CUSTOMERS
  // ============================================================
  console.log('Creating demo customers...');
  const customerPassword = await bcrypt.hash('Customer123!', 12);
  const customer1 = await prisma.customer.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      name: 'John Customer',
      email: 'customer@example.com',
      phone: '+8801800000001',
      passwordHash: customerPassword,
      loyaltyPoints: 150,
    },
  });

  await prisma.customer.upsert({
    where: { email: 'customer2@example.com' },
    update: {},
    create: {
      name: 'Priya Sharma',
      email: 'customer2@example.com',
      phone: '+8801800000002',
      passwordHash: customerPassword,
      loyaltyPoints: 320,
    },
  });

  // Add address
  await prisma.address.upsert({
    where: { id: 1 },
    update: {},
    create: {
      customerId: customer1.id,
      label: 'Home',
      line1: 'Flat 3B, Sunrise Apartments',
      line2: 'Mohammadpur',
      city: 'Dhaka',
      area: 'Mohammadpur',
      postalCode: '1207',
      isDefault: true,
    },
  });
  console.log(`  ✅ 2 demo customers created`);

  // ============================================================
  // 9. MENU CATEGORIES
  // ============================================================
  console.log('Creating menu categories...');
  const catStarters = await prisma.category.upsert({
    where: { branchId_slug: { branchId: branch1.id, slug: 'starters' } },
    update: {},
    create: { branchId: branch1.id, name: 'Starters', slug: 'starters', sortOrder: 1 },
  });
  const catMainCourse = await prisma.category.upsert({
    where: { branchId_slug: { branchId: branch1.id, slug: 'main-course' } },
    update: {},
    create: { branchId: branch1.id, name: 'Main Course', slug: 'main-course', sortOrder: 2 },
  });
  const catBiryani = await prisma.category.upsert({
    where: { branchId_slug: { branchId: branch1.id, slug: 'biryani' } },
    update: {},
    create: { branchId: branch1.id, name: 'Biryani & Rice', slug: 'biryani', sortOrder: 3 },
  });
  const catBread = await prisma.category.upsert({
    where: { branchId_slug: { branchId: branch1.id, slug: 'bread' } },
    update: {},
    create: { branchId: branch1.id, name: 'Breads', slug: 'bread', sortOrder: 4 },
  });
  const catDrinks = await prisma.category.upsert({
    where: { branchId_slug: { branchId: branch1.id, slug: 'drinks' } },
    update: {},
    create: { branchId: branch1.id, name: 'Drinks & Beverages', slug: 'drinks', sortOrder: 5 },
  });
  const catDesserts = await prisma.category.upsert({
    where: { branchId_slug: { branchId: branch1.id, slug: 'desserts' } },
    update: {},
    create: { branchId: branch1.id, name: 'Desserts', slug: 'desserts', sortOrder: 6 },
  });
  console.log(`  ✅ 6 categories created`);

  // ============================================================
  // 10. MENU ITEMS
  // ============================================================
  console.log('Creating menu items...');
  const menuItemsData = [
    // Starters
    { categoryId: catStarters.id, name: 'Vegetable Samosa', slug: 'vegetable-samosa', description: 'Crispy pastry filled with spiced vegetables', basePrice: 80, station: 'FRY', prepTime: 10 },
    { categoryId: catStarters.id, name: 'Chicken Tikka', slug: 'chicken-tikka', description: 'Marinated chicken grilled in tandoor', basePrice: 320, station: 'GRILL', prepTime: 20, isFeatured: true },
    { categoryId: catStarters.id, name: 'Prawn Cocktail', slug: 'prawn-cocktail', description: 'Fresh prawns with cocktail sauce', basePrice: 450, station: 'MAIN', prepTime: 15 },
    // Main Course
    { categoryId: catMainCourse.id, name: 'Butter Chicken', slug: 'butter-chicken', description: 'Tender chicken in rich tomato butter sauce', basePrice: 380, station: 'GRILL', prepTime: 25, isFeatured: true },
    { categoryId: catMainCourse.id, name: 'Lamb Rogan Josh', slug: 'lamb-rogan-josh', description: 'Slow-cooked lamb with aromatic spices', basePrice: 480, station: 'GRILL', prepTime: 30 },
    { categoryId: catMainCourse.id, name: 'Dal Makhani', slug: 'dal-makhani', description: 'Black lentils slow cooked overnight', basePrice: 220, station: 'MAIN', prepTime: 15 },
    { categoryId: catMainCourse.id, name: 'Paneer Tikka Masala', slug: 'paneer-tikka-masala', description: 'Cottage cheese in spiced tomato gravy', basePrice: 300, station: 'GRILL', prepTime: 20 },
    // Biryani
    { categoryId: catBiryani.id, name: 'Chicken Biryani', slug: 'chicken-biryani', description: 'Fragrant basmati rice with spiced chicken', basePrice: 350, station: 'MAIN', prepTime: 25, isFeatured: true },
    { categoryId: catBiryani.id, name: 'Beef Biryani', slug: 'beef-biryani', description: 'Aromatic rice with tender beef', basePrice: 420, station: 'MAIN', prepTime: 30 },
    { categoryId: catBiryani.id, name: 'Vegetable Biryani', slug: 'vegetable-biryani', description: 'Mixed vegetable dum biryani', basePrice: 260, station: 'MAIN', prepTime: 20 },
    // Breads
    { categoryId: catBread.id, name: 'Butter Naan', slug: 'butter-naan', description: 'Soft leavened flatbread with butter', basePrice: 60, station: 'GRILL', prepTime: 8 },
    { categoryId: catBread.id, name: 'Garlic Naan', slug: 'garlic-naan', description: 'Naan topped with garlic and herbs', basePrice: 80, station: 'GRILL', prepTime: 8 },
    { categoryId: catBread.id, name: 'Paratha', slug: 'paratha', description: 'Layered whole wheat flatbread', basePrice: 50, station: 'GRILL', prepTime: 8 },
    // Drinks
    { categoryId: catDrinks.id, name: 'Mango Lassi', slug: 'mango-lassi', description: 'Creamy yogurt drink with fresh mango', basePrice: 120, station: 'DRINKS', prepTime: 5, isFeatured: true },
    { categoryId: catDrinks.id, name: 'Masala Chai', slug: 'masala-chai', description: 'Spiced Indian tea with milk', basePrice: 60, station: 'DRINKS', prepTime: 5 },
    { categoryId: catDrinks.id, name: 'Fresh Lime Soda', slug: 'fresh-lime-soda', description: 'Refreshing lime with soda water', basePrice: 80, station: 'DRINKS', prepTime: 3 },
    { categoryId: catDrinks.id, name: 'Cold Coffee', slug: 'cold-coffee', description: 'Chilled coffee with whipped cream', basePrice: 150, station: 'DRINKS', prepTime: 5 },
    // Desserts
    { categoryId: catDesserts.id, name: 'Gulab Jamun', slug: 'gulab-jamun', description: 'Soft milk dumplings in sugar syrup', basePrice: 100, station: 'DESSERT', prepTime: 5 },
    { categoryId: catDesserts.id, name: 'Kheer', slug: 'kheer', description: 'Rice pudding with cardamom and nuts', basePrice: 120, station: 'DESSERT', prepTime: 5 },
    { categoryId: catDesserts.id, name: 'Brownie with Ice Cream', slug: 'brownie-ice-cream', description: 'Warm chocolate brownie with vanilla scoop', basePrice: 180, station: 'DESSERT', prepTime: 8 },
  ];

  const menuItems: Record<string, { id: number; name: string }> = {};
  for (const item of menuItemsData) {
    const mi = await prisma.menuItem.upsert({
      where: { branchId_slug: { branchId: branch1.id, slug: item.slug } },
      update: {},
      create: {
        ...item,
        branchId: branch1.id,
        isAvailable: true,
        isFeatured: item.isFeatured ?? false,
        sortOrder: 0,
      },
    });
    menuItems[item.slug] = mi;
  }

  // Add variants to Biryani items
  for (const slug of ['chicken-biryani', 'beef-biryani', 'vegetable-biryani']) {
    const item = menuItems[slug];
    await prisma.itemVariant.createMany({
      data: [
        { menuItemId: item.id, name: 'Half', priceModifier: -80, isDefault: false },
        { menuItemId: item.id, name: 'Full', priceModifier: 0, isDefault: true },
        { menuItemId: item.id, name: 'Family', priceModifier: 150, isDefault: false },
      ],
      skipDuplicates: true,
    });
  }

  // Add spice level addon group to main course items
  for (const slug of ['butter-chicken', 'lamb-rogan-josh', 'paneer-tikka-masala']) {
    const item = menuItems[slug];
    const spiceGroup = await prisma.addonGroup.create({
      data: {
        menuItemId: item.id,
        name: 'Spice Level',
        isRequired: false,
        minSelect: 0,
        maxSelect: 1,
      },
    });
    await prisma.addon.createMany({
      data: [
        { addonGroupId: spiceGroup.id, name: 'Mild', price: 0 },
        { addonGroupId: spiceGroup.id, name: 'Medium', price: 0 },
        { addonGroupId: spiceGroup.id, name: 'Hot', price: 0 },
        { addonGroupId: spiceGroup.id, name: 'Extra Hot', price: 20 },
      ],
    });
  }
  console.log(`  ✅ ${menuItemsData.length} menu items created with variants and addons`);

  // ============================================================
  // 11. TABLES
  // ============================================================
  console.log('Creating tables...');
  const tableData = [
    { tableNumber: 'T01', capacity: 2, section: 'Indoor' },
    { tableNumber: 'T02', capacity: 4, section: 'Indoor' },
    { tableNumber: 'T03', capacity: 4, section: 'Indoor' },
    { tableNumber: 'T04', capacity: 6, section: 'Indoor' },
    { tableNumber: 'T05', capacity: 2, section: 'Outdoor' },
    { tableNumber: 'T06', capacity: 4, section: 'Outdoor' },
    { tableNumber: 'T07', capacity: 8, section: 'VIP' },
    { tableNumber: 'T08', capacity: 10, section: 'VIP' },
    { tableNumber: 'T09', capacity: 4, section: 'Rooftop' },
    { tableNumber: 'T10', capacity: 6, section: 'Rooftop' },
  ];

  for (const t of tableData) {
    await prisma.table.upsert({
      where: { branchId_tableNumber: { branchId: branch1.id, tableNumber: t.tableNumber } },
      update: {},
      create: { ...t, branchId: branch1.id, qrToken: uuidv4() },
    });
  }

  // Branch 2 tables
  for (let i = 1; i <= 6; i++) {
    const num = `T0${i}`;
    await prisma.table.upsert({
      where: { branchId_tableNumber: { branchId: branch2.id, tableNumber: num } },
      update: {},
      create: {
        tableNumber: num,
        capacity: i <= 3 ? 4 : 6,
        section: i <= 3 ? 'Indoor' : 'Outdoor',
        branchId: branch2.id,
        qrToken: uuidv4(),
      },
    });
  }
  console.log(`  ✅ 16 tables created across 2 branches`);

  // ============================================================
  // 12. DELIVERY ZONES
  // ============================================================
  console.log('Creating delivery zones...');
  const zones = [
    { name: 'Dhanmondi', deliveryCharge: 60, estimatedMinutes: 20 },
    { name: 'Mohammadpur', deliveryCharge: 70, estimatedMinutes: 25 },
    { name: 'Mirpur', deliveryCharge: 90, estimatedMinutes: 35 },
    { name: 'Gulshan', deliveryCharge: 100, estimatedMinutes: 40 },
    { name: 'Uttara', deliveryCharge: 120, estimatedMinutes: 50 },
  ];
  for (const z of zones) {
    await prisma.deliveryZone.create({ data: { ...z, branchId: branch1.id } }).catch(() => {});
  }
  console.log(`  ✅ ${zones.length} delivery zones created`);

  // ============================================================
  // 13. INGREDIENTS & RECIPES (sample)
  // ============================================================
  console.log('Creating ingredients...');
  const ingredientsData = [
    { name: 'Chicken', unit: 'kg', currentStock: 50, lowStockThreshold: 10, costPerUnit: 300 },
    { name: 'Beef', unit: 'kg', currentStock: 30, lowStockThreshold: 8, costPerUnit: 650 },
    { name: 'Basmati Rice', unit: 'kg', currentStock: 100, lowStockThreshold: 20, costPerUnit: 90 },
    { name: 'Tomatoes', unit: 'kg', currentStock: 25, lowStockThreshold: 5, costPerUnit: 60 },
    { name: 'Onions', unit: 'kg', currentStock: 40, lowStockThreshold: 10, costPerUnit: 40 },
    { name: 'Cream', unit: 'L', currentStock: 15, lowStockThreshold: 3, costPerUnit: 180 },
    { name: 'Butter', unit: 'kg', currentStock: 10, lowStockThreshold: 2, costPerUnit: 500 },
    { name: 'Paneer', unit: 'kg', currentStock: 12, lowStockThreshold: 3, costPerUnit: 350 },
    { name: 'Mango Pulp', unit: 'L', currentStock: 8, lowStockThreshold: 2, costPerUnit: 120 },
    { name: 'Yogurt', unit: 'kg', currentStock: 20, lowStockThreshold: 5, costPerUnit: 80 },
    { name: 'All Purpose Flour', unit: 'kg', currentStock: 30, lowStockThreshold: 5, costPerUnit: 55 },
    { name: 'Cooking Oil', unit: 'L', currentStock: 25, lowStockThreshold: 5, costPerUnit: 150 },
    { name: 'Chocolate', unit: 'kg', currentStock: 5, lowStockThreshold: 1, costPerUnit: 800 },
    { name: 'Milk', unit: 'L', currentStock: 30, lowStockThreshold: 10, costPerUnit: 70 },
    { name: 'Sugar', unit: 'kg', currentStock: 20, lowStockThreshold: 5, costPerUnit: 65 },
  ];

  const ingredients: Record<string, { id: number }> = {};
  for (const ing of ingredientsData) {
    const i = await prisma.ingredient.upsert({
      where: { id: ingredientsData.indexOf(ing) + 1 },
      update: {},
      create: { ...ing, branchId: branch1.id },
    });
    ingredients[ing.name] = i;
  }

  // Sample recipes
  const butterChicken = menuItems['butter-chicken'];
  if (butterChicken && ingredients['Chicken'] && ingredients['Tomatoes'] && ingredients['Cream']) {
    await prisma.recipe.createMany({
      skipDuplicates: true,
      data: [
        { menuItemId: butterChicken.id, ingredientId: ingredients['Chicken'].id, quantity: 0.3, unit: 'kg' },
        { menuItemId: butterChicken.id, ingredientId: ingredients['Tomatoes'].id, quantity: 0.1, unit: 'kg' },
        { menuItemId: butterChicken.id, ingredientId: ingredients['Cream'].id, quantity: 0.05, unit: 'L' },
        { menuItemId: butterChicken.id, ingredientId: ingredients['Butter'].id, quantity: 0.02, unit: 'kg' },
      ],
    });
  }

  const chickenBiryani = menuItems['chicken-biryani'];
  if (chickenBiryani && ingredients['Chicken'] && ingredients['Basmati Rice']) {
    await prisma.recipe.createMany({
      skipDuplicates: true,
      data: [
        { menuItemId: chickenBiryani.id, ingredientId: ingredients['Chicken'].id, quantity: 0.35, unit: 'kg' },
        { menuItemId: chickenBiryani.id, ingredientId: ingredients['Basmati Rice'].id, quantity: 0.3, unit: 'kg' },
        { menuItemId: chickenBiryani.id, ingredientId: ingredients['Onions'].id, quantity: 0.1, unit: 'kg' },
        { menuItemId: chickenBiryani.id, ingredientId: ingredients['Yogurt'].id, quantity: 0.05, unit: 'kg' },
      ],
    });
  }
  console.log(`  ✅ ${ingredientsData.length} ingredients + sample recipes created`);

  // ============================================================
  // 14. PAYMENT METHODS
  // ============================================================
  console.log('Creating payment methods...');
  const pmData = [
    { name: 'Cash', type: 'CASH' },
    { name: 'Card', type: 'CARD' },
    { name: 'bKash', type: 'DIGITAL' },
    { name: 'Nagad', type: 'DIGITAL' },
    { name: 'SSLCommerz', type: 'GATEWAY' },
  ];
  for (const pm of pmData) {
    await prisma.paymentMethod.create({ data: { ...pm, branchId: branch1.id } }).catch(() => {});
    await prisma.paymentMethod.create({ data: { ...pm, branchId: branch2.id } }).catch(() => {});
  }
  console.log(`  ✅ Payment methods created`);

  // ============================================================
  // 15. EXPENSE CATEGORIES
  // ============================================================
  const expCats = ['Utilities', 'Rent', 'Salaries', 'Supplies', 'Maintenance', 'Marketing', 'Transport', 'Miscellaneous'];
  for (const c of expCats) {
    await prisma.expenseCategory.create({ data: { name: c, branchId: branch1.id } }).catch(() => {});
  }

  // ============================================================
  // 16. SHIFTS
  // ============================================================
  const shiftsData = [
    { name: 'Morning', startTime: '08:00', endTime: '16:00', daysOfWeek: '1,2,3,4,5,6' },
    { name: 'Evening', startTime: '16:00', endTime: '23:00', daysOfWeek: '1,2,3,4,5,6,7' },
    { name: 'Full Day', startTime: '10:00', endTime: '22:00', daysOfWeek: '6,7' },
  ];
  for (const s of shiftsData) {
    await prisma.shift.create({ data: { ...s, branchId: branch1.id } }).catch(() => {});
  }

  // ============================================================
  // 17. COUPON
  // ============================================================
  await prisma.coupon.create({
    data: {
      branchId: branch1.id,
      code: 'WELCOME20',
      type: 'PERCENTAGE',
      value: 20,
      minOrderAmount: 300,
      maxDiscount: 200,
      usageLimit: 100,
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2027-12-31'),
      isActive: true,
    },
  }).catch(() => {});

  await prisma.coupon.create({
    data: {
      branchId: branch1.id,
      code: 'FLAT100',
      type: 'FLAT',
      value: 100,
      minOrderAmount: 500,
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2027-12-31'),
      isActive: true,
    },
  }).catch(() => {});

  // ============================================================
  // 18. SUPPLIERS
  // ============================================================
  const suppliersData = [
    { name: 'Fresh Farms Ltd', contactPerson: 'Rafiq Ahmed', phone: '+8801711111111', email: 'fresh@farms.com' },
    { name: 'City Poultry', contactPerson: 'Salim Khan', phone: '+8801722222222', email: 'city@poultry.com' },
    { name: 'Metro Spices', contactPerson: 'Nasrin Begum', phone: '+8801733333333', email: 'metro@spices.com' },
  ];
  for (const s of suppliersData) {
    await prisma.supplier.create({ data: { ...s, branchId: branch1.id } }).catch(() => {});
  }

  // ============================================================
  // 19. GLOBAL SETTINGS
  // ============================================================
  const settingsData = [
    { key: 'restaurant_name', value: 'Spice Garden', type: 'string' },
    { key: 'loyalty_points_per_taka', value: '1', type: 'number' },
    { key: 'loyalty_taka_per_point', value: '0.5', type: 'number' },
    { key: 'min_order_delivery', value: '200', type: 'number' },
    { key: 'order_number_prefix', value: 'SG', type: 'string' },
    { key: 'invoice_footer', value: 'Thank you for dining with us!', type: 'string' },
    { key: 'notifications_email', value: 'notify@spicegarden.com', type: 'string' },
  ];
  for (const s of settingsData) {
    const existing = await prisma.setting.findFirst({
      where: { key: s.key, branchId: null },
    });
    if (!existing) {
      await prisma.setting.create({
        data: {
          key: s.key,
          value: s.value,
          type: s.type,
        },
      });
    }
  }

  console.log('\n✅ Seed completed successfully!\n');
  console.log('='.repeat(50));
  console.log('DEMO LOGIN CREDENTIALS');
  console.log('='.repeat(50));
  console.log('Password for all accounts: Password123!\n');
  console.log('STAFF ACCOUNTS:');
  for (const u of demoUsers) {
    console.log(`  [${u.role.padEnd(12)}] ${u.email}`);
  }
  console.log('\nCUSTOMER ACCOUNTS:');
  console.log('  customer@example.com  (Password: Customer123!)');
  console.log('  customer2@example.com (Password: Customer123!)');
  console.log('='.repeat(50));
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
