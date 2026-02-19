import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const SALT_LENGTH = 64
const TAG_LENGTH = 16
const KEY_LENGTH = 32

/**
 * Derives a key from the master encryption key using PBKDF2
 */
function deriveKey(masterKey: string, salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(masterKey, salt, 100000, KEY_LENGTH, 'sha512')
}

/**
 * Encrypts API credentials using AES-256-GCM
 * @param plaintext - The API key to encrypt
 * @returns Encrypted string in format: salt:iv:tag:ciphertext (all hex-encoded)
 */
export function encryptCredential(plaintext: string): string {
    const masterKey = process.env.MASTER_ENCRYPTION_KEY

    if (!masterKey) {
        throw new Error('MASTER_ENCRYPTION_KEY is not set in environment variables')
    }

    if (masterKey.length < 32) {
        throw new Error('MASTER_ENCRYPTION_KEY must be at least 32 characters')
    }

    // Generate random salt and IV
    const salt = crypto.randomBytes(SALT_LENGTH)
    const iv = crypto.randomBytes(IV_LENGTH)

    // Derive key from master key
    const key = deriveKey(masterKey, salt)

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

    // Encrypt
    let encrypted = cipher.update(plaintext, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    // Get auth tag
    const tag = cipher.getAuthTag()

    // Return format: salt:iv:tag:ciphertext (all hex)
    return `${salt.toString('hex')}:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`
}

/**
 * Decrypts API credentials
 * @param encryptedData - Encrypted string in format: salt:iv:tag:ciphertext
 * @returns Decrypted plaintext
 */
export function decryptCredential(encryptedData: string): string {
    const masterKey = process.env.MASTER_ENCRYPTION_KEY

    if (!masterKey) {
        throw new Error('MASTER_ENCRYPTION_KEY is not set in environment variables')
    }

    try {
        // Parse encrypted data
        const parts = encryptedData.split(':')
        if (parts.length !== 4) {
            throw new Error('Invalid encrypted data format')
        }

        const [saltHex, ivHex, tagHex, encryptedHex] = parts

        const salt = Buffer.from(saltHex, 'hex')
        const iv = Buffer.from(ivHex, 'hex')
        const tag = Buffer.from(tagHex, 'hex')

        // Derive key
        const key = deriveKey(masterKey, salt)

        // Create decipher
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
        decipher.setAuthTag(tag)

        // Decrypt
        let decrypted = decipher.update(encryptedHex, 'hex', 'utf8')
        decrypted += decipher.final('utf8')

        return decrypted
    } catch (error) {
        throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
}

/**
 * Extracts last 4 characters from an API key for display purposes
 */
export function getLast4(apiKey: string): string {
    return apiKey.slice(-4)
}

/**
 * Validates API key format (basic check)
 */
export function validateApiKeyFormat(apiKey: string): boolean {
    // Basic validation: at least 20 chars, no whitespace
    return apiKey.length >= 20 && !/\s/.test(apiKey)
}
