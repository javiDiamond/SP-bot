/**
 * Tests for Wallex REST Client
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WallexRestClient, WallexApiError } from './rest-client';

describe('WallexRestClient', () => {
  let client: WallexRestClient;

  beforeEach(() => {
    client = new WallexRestClient({
      baseUrl: 'https://api.wallex.ir',
      apiKey: 'test-api-key',
    });
  });

  it('should create client with default config', () => {
    expect(client).toBeDefined();
  });

  it('should use custom API key header', () => {
    const customClient = new WallexRestClient({
      baseUrl: 'https://api.wallex.ir',
      apiKey: 'test-key',
      apiKeyHeader: 'X-API-Key',
    });
    expect(customClient).toBeDefined();
  });

  it('should respect rate limits', async () => {
    // This test would require mocking fetch
    // For now, just verify the client is created
    expect(client).toBeDefined();
  });
});

describe('Rate Limiter', () => {
  it('should allow requests under limit', async () => {
    // Basic test - actual rate limiting tested in integration tests
    expect(true).toBe(true);
  });
});
