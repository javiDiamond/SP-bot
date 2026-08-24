/**
 * Encrypt API key using AES-256-GCM
 */
export declare function encryptApiKey(apiKey: string, encryptionKey: string): {
    encrypted: string;
    iv: string;
    authTag: string;
};
/**
 * Decrypt API key using AES-256-GCM
 */
export declare function decryptApiKey(encrypted: string, iv: string, authTag: string, encryptionKey: string): string;
/**
 * Mask API key for display (show first 4 and last 4 characters)
 */
export declare function maskApiKey(apiKey: string): string;
