import { PrismaClient } from '../generated';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@wallex-grid.local';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  
  const existingUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingUser) {
    console.log(`✅ Admin user ${adminEmail} already exists`);
  } else {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    
    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        role: 'ADMIN',
      },
    });
    
    console.log(`✅ Created admin user: ${adminUser.email}`);
  }

  // Create system risk settings
  const existingRiskSettings = await prisma.riskSetting.findUnique({
    where: { key: 'global' },
  });

  if (existingRiskSettings) {
    console.log('✅ Global risk settings already exist');
  } else {
    await prisma.riskSetting.create({
      data: {
        key: 'global',
        maxBotsGlobal: 10,
        maxBotsPerSymbol: 3,
        maxDailyLossPercent: 5,
        maxQuoteExposureGlobal: 100000,
        killSwitchActive: false,
        allowLiveTrading: false,
      },
    });
    
    console.log('✅ Created global risk settings');
  }

  // Create sample markets (will be synced with real Wallex data on first run)
  const sampleMarkets = [
    {
      symbol: 'BTCUSDT',
      baseAsset: 'BTC',
      quoteAsset: 'USDT',
      isSpot: true,
      isUsdtBased: true,
      amountPrecision: 8,
      pricePrecision: 2,
      minNotional: 1,
      isActive: true,
    },
    {
      symbol: 'ETHUSDT',
      baseAsset: 'ETH',
      quoteAsset: 'USDT',
      isSpot: true,
      isUsdtBased: true,
      amountPrecision: 8,
      pricePrecision: 2,
      minNotional: 1,
      isActive: true,
    },
  ];

  for (const marketData of sampleMarkets) {
    const existingMarket = await prisma.market.findUnique({
      where: { symbol: marketData.symbol },
    });

    if (!existingMarket) {
      await prisma.market.create({
        data: marketData as any,
      });
      console.log(`✅ Created market: ${marketData.symbol}`);
    }
  }

  // Create demo exchange account (paper trading)
  const user = await prisma.user.findFirst({
    where: { email: adminEmail },
  });

  if (user) {
    const existingDemoAccount = await prisma.exchangeAccount.findFirst({
      where: {
        userId: user.id,
        name: 'Demo Paper Trading',
      },
    });

    if (!existingDemoAccount) {
      // Encrypt a dummy API key for demo purposes
      const crypto = require('crypto');
      const dummyKey = 'demo_api_key_12345';
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(
        'aes-256-gcm',
        Buffer.from(process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef', 'hex'),
        iv
      );
      let encrypted = cipher.update(dummyKey, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      const authTag = cipher.getAuthTag().toString('hex');

      await prisma.exchangeAccount.create({
        data: {
          userId: user.id,
          name: 'Demo Paper Trading',
          apiKeyEncrypted: encrypted,
          apiIv: iv.toString('hex'),
          apiAuthTag: authTag,
          isLiveEnabled: false,
          isActive: true,
        },
      });
      
      console.log('✅ Created demo paper trading account');
    }
  }

  console.log('🎉 Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
