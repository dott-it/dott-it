#!/usr/bin/env node

/**
 * Script to create an admin user for testing authentication
 * Usage: node scripts/create-admin-user.js
 */

import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/user-client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local', override: true });

const userPrisma = new PrismaClient({
  datasources: {
    userDb: {
      url: process.env.USER_DATABASE
    }
  }
});

async function createAdminUser() {
  try {
    console.log('🚀 Starting admin user creation...');

    // Check if USER_DATABASE is configured
    if (!process.env.USER_DATABASE) {
      throw new Error('USER_DATABASE environment variable is not set');
    }

    // Default admin credentials
    const adminEmail = 'admin@dott-it.com';
    const adminPassword = 'dottAdmin2025';
    const adminName = 'Admin User';
    const tenantName = 'Dott.it Default';
    const tenantSlug = 'dott-it-default';

    console.log('📧 Admin Email:', adminEmail);
    console.log('🔑 Admin Password:', adminPassword);
    console.log('🏢 Tenant:', tenantName);

    // 1. Create or find tenant
    console.log('\n1️⃣ Creating/finding tenant...');
    let tenant = await userPrisma.tenant.findUnique({
      where: { slug: tenantSlug }
    });

    if (tenant) {
      console.log('✅ Tenant found:', tenant.name);
    } else {
      tenant = await userPrisma.tenant.create({
        data: {
          name: tenantName,
          slug: tenantSlug,
          domains: ['localhost', 'dott-it.com']
        }
      });
      console.log('✅ Tenant created:', tenant.name);
    }

    // 2. Check if admin user already exists
    console.log('\n2️⃣ Checking for existing admin user...');
    const existingUser = await userPrisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (existingUser) {
      console.log('⚠️  Admin user already exists!');
      console.log('   User ID:', existingUser.id);
      console.log('   Email:', existingUser.email);
      console.log('   Tenant ID:', existingUser.tenantId);
      
      // Update password if needed
      const passwordHash = bcrypt.hashSync(adminPassword, 12);
      await userPrisma.user.update({
        where: { id: existingUser.id },
        data: {
          passwordHash,
          emailVerified: new Date(),
          role: 'admin'
        }
      });
      console.log('✅ Admin user password updated');
    } else {
      // 3. Create admin user
      console.log('\n3️⃣ Creating admin user...');
      const passwordHash = bcrypt.hashSync(adminPassword, 12);
      
      const adminUser = await userPrisma.user.create({
        data: {
          name: adminName,
          email: adminEmail,
          passwordHash,
          emailVerified: new Date(),
          tenantId: tenant.id,
          role: 'admin'
        }
      });
      console.log('✅ Admin user created:', adminUser.email);
    }

    // 4. Create Teacher record
    console.log('\n4️⃣ Creating Teacher record...');
    const finalUser = await userPrisma.user.findUnique({
      where: { email: adminEmail }
    });

    const existingTeacher = await userPrisma.teacher.findUnique({
      where: { userId: finalUser.id }
    });

    if (existingTeacher) {
      console.log('✅ Teacher record already exists:', existingTeacher.teacherNickname);
    } else {
      const teacher = await userPrisma.teacher.create({
        data: {
          userId: finalUser.id,
          firstName: 'Admin',
          lastName: 'User',
          email: adminEmail,
          teacherNickname: 'Admin',
          tenantId: tenant.id
        }
      });
      console.log('✅ Teacher record created:', teacher.teacherNickname);
    }

    // 5. Summary
    console.log('\n🎉 Admin user setup complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Password:', adminPassword);
    console.log('🏢 Tenant:', tenantName);
    console.log('👤 User ID:', finalUser.id);
    console.log('🏫 Tenant ID:', tenant.id);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n💡 You can now test the login functionality!');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  } finally {
    await userPrisma.$disconnect();
  }
}

// Run the script
await createAdminUser();
