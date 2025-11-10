import * as bcrypt from 'bcrypt';

/**
 * Utility class for password hashing operations
 *
 * Uses bcrypt with a cost factor of 12 for secure password hashing.
 *
 * @example
 * // Hash a password
 * const hash = await HashUtil.hash('myPassword123');
 *
 * @example
 * // Compare password with hash
 * const isValid = await HashUtil.compare('myPassword123', hash);
 */
export class HashUtil {
    /**
     * Salt rounds for bcrypt hashing
     * Higher number = more secure but slower
     * Recommended: 10-12 for production
     */
    private static readonly SALT_ROUNDS = 12;

    /**
     * Hash a plain text password
     *
     * @param password - Plain text password to hash
     * @returns Promise<string> - Hashed password
     *
     * @example
     * const hash = await HashUtil.hash('password123');
     * // Returns: $2b$12$...
     */
    static async hash(password: string): Promise<string> {
        return bcrypt.hash(password, this.SALT_ROUNDS);
    }

    /**
     * Compare a plain text password with a hash
     *
     * @param password - Plain text password
     * @param hash - Hashed password to compare against
     * @returns Promise<boolean> - True if password matches hash
     *
     * @example
     * const isValid = await HashUtil.compare('password123', storedHash);
     * if (isValid) {
     *   // Password is correct
     * }
     */
    static async compare(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }
}