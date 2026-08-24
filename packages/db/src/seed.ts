import { prisma } from '../prisma-client';
import type { User } from '../../generated';
import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }
  // Hash the key to ensure it's 32 bytes for AES-256
  return crypto.createHash('sha256').update(key).digest();
}

export function encryptApiKey(apiKey: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(apiKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Combine IV + auth tag + encrypted data
  const combined = Buffer.concat([
    iv,
    authTag,
    Buffer.from(encrypted, 'hex'),
  ]);
  
  return combined.toString('base64');
}

export function decryptApiKey(encryptedData: string): string {
  const key = getEncryptionKey();
  const combined = Buffer.from(encryptedData, 'base64');
  
  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  
  return decrypted.toString('utf8');
}

export function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 8) {
    return '*'.repeat(apiKey.length);
  }
  return `${apiKey.substring(0, 4)}${'*'.repeat(apiKey.length - 8)}${apiKey.substring(apiKey.length - 4)}`;
}

// Create admin user if not exists
export async function createAdminUserIfNotExists(): Promise<User> {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@wallex-grid.local';
  const adminPassword = process.env.ADMIN_PASSWORD || 'change-me-immediately';
  
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });
  
  if (existingAdmin) {
    return existingAdmin;
  }
  
  const bcrypt = await import('bcryptjs');
  const hashedPassword = await bcrypt.default.hash(adminPassword, 10);
  
  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      password: hashedPassword,
      role: 'ADMIN',
      name: 'System Administrator',
    },
  });
  
  console.log(`Admin user created: ${adminEmail}`);
  return admin;
}

// Create demo exchange account for testing
export async function createDemoExchangeAccount(userId: string): Promise<void> {
  const existing = await prisma.exchangeAccount.findFirst({
    where: {
      userId,
      name: 'Demo Paper Account',
    },
  });
  
  if (existing) {
    return;
  }
  
  await prisma.exchangeAccount.create({
    data: {
      userId,
      name: 'Demo Paper Account',
      tradingMode: 'DRY_RUN',
      isActive: true,
      apiKeyEncrypted: '', // Empty for paper trading
      apiSecretEncrypted: '',
      note: 'Default paper trading account - no real API keys needed',
    },
  });
  
  console.log('Demo paper trading account created');
}

// Create sample market data
export async function createSampleMarkets(): Promise<void> {
  const sampleMarkets = [
    {
      symbol: 'BTCUSDT',
      baseAsset: 'BTC',
      quoteAsset: 'USDT',
      isSpot: true,
      isTmnBased: false,
      isUsdtBased: true,
      amountPrecision: 6,
      pricePrecision: 2,
      minNotional: 10,
    },
    {
      symbol: 'ETHUSDT',
      baseAsset: 'ETH',
      quoteAsset: 'USDT',
      isSpot: true,
      isTmnBased: false,
      isUsdtBased: true,
      amountPrecision: 5,
      pricePrecision: 2,
      minNotional: 10,
    },
    {
      symbol: 'BTCTMN',
      baseAsset: 'BTC',
      quoteAsset: 'TMN',
      isSpot: true,
      isTmnBased: true,
      isUsdtBased: false,
      amountPrecision: 6,
      pricePrecision: 0,
      minNotional: 500000,
    },
  ];
  
  for (const market of sampleMarkets) {
    await prisma.market.upsert({
      where: { symbol: market.symbol },
      update: market,
      create: market as any,
    });
  }
  
  console.log('Sample markets created/updated');
}

// Run all seeds
export async function seedDatabase(): Promise<void> {
  console.log('Starting database seeding...');
  
  const admin = await createAdminUserIfNotExists();
  await createDemoExchangeAccount(admin.id);
  await createSampleMarkets();
  
  console.log('Database seeding completed');
}
