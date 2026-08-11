const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const fs = require('fs');

const prisma = new PrismaClient();

async function main() {
  try {
    const email = 'integration.test@indent.com';
    
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.log(`User ${email} already exists! Stopping.`);
      process.exit(0);
    }
    
    // Create Role and Dept if they don't exist since Neon is currently empty
    let role = await prisma.role.findFirst({ where: { roleName: 'Integration Tester' } });
    if (!role) {
      role = await prisma.role.create({
        data: {
          roleName: 'Integration Tester',
          description: 'Dedicated role for cloud integration tests'
        }
      });
    }

    let dept = await prisma.department.findFirst({ where: { departmentCode: 'TEST' } });
    if (!dept) {
      dept = await prisma.department.create({
        data: {
          departmentCode: 'TEST',
          departmentName: 'Test Department',
          description: 'Integration testing department'
        }
      });
    }

    // Generate Password
    const password = crypto.randomBytes(12).toString('base64').replace(/[^a-zA-Z0-9]/g, '') + 'A1!';
    
    // Store in .env safely
    fs.appendFileSync('.env', `\nINTEGRATION_TEST_PASSWORD=${password}\n`);
    
    // Hash Password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create User
    const user = await prisma.user.create({
      data: {
        employeeCode: 'INT001',
        firstName: 'Integration',
        lastName: 'Test',
        email: email,
        password: hashedPassword,
        departmentId: dept.id,
        roleId: role.id,
        status: 'ACTIVE'
      },
      include: {
        role: true
      }
    });
    
    console.log(`CREATED_USER: ${user.email}`);
    console.log(`ROLE: ${user.role.roleName}`);
    
    // Try to login using API
    console.log('Attempting API login...');
    try {
      const res = await fetch('http://127.0.0.1:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      if (res.ok) {
        const data = await res.json();
        console.log('LOGIN_SUCCESS: YES');
      } else {
        console.log('LOGIN_FAILED: ' + res.status + ' ' + await res.text());
      }
    } catch (apiErr) {
      console.log('LOGIN_FAILED: API Connection Error - ' + apiErr.message);
    }
    
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
