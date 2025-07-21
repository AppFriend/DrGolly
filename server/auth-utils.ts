import bcrypt from 'bcryptjs';
import crypto from 'crypto-js';
import { nanoid } from 'nanoid';

export class AuthUtils {
  /**
   * Generate a secure temporary password for bulk user imports
   */
  static generateTemporaryPassword(): string {
    // Generate 8-character password with uppercase, lowercase, numbers
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /**
   * Hash a password using bcrypt (for permanent passwords)
   */
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  /**
   * Verify a password against a hash
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  /**
   * Generate a secure user ID for bulk imports
   */
  static generateUserId(): string {
    return nanoid(12);
  }

  /**
   * Validate password strength for new passwords
   */
  static validatePasswordStrength(password: string): { 
    isValid: boolean; 
    errors: string[] 
  } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Create expiration date for temporary passwords (30 days)
   */
  static createTempPasswordExpiry(): Date {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);
    return expiryDate;
  }
}