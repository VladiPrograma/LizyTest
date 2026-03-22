'use server';

import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import bcrypt from 'bcryptjs';
import { db } from '@/db';
import { account, user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { validateUsername } from '@/lib/username-validation';

export async function signUpWithEmail(email: string, password: string, username: string, captchaToken: string) {
    try {
        const validation = validateUsername(username);
        if (!validation.isValid) {
            return { error: validation.error };
        }

        // Check if email already exists
        const existingEmail = await db
            .select()
            .from(user)
            .where(eq(user.email, email))
            .limit(1);
        
        if (existingEmail.length > 0) {
            return { error: 'An account with this email already exists. Please sign in instead.' };
        }

        // Check if username already exists
        const existingUser = await db
            .select()
            .from(user)
            .where(eq(user.username, validation.sanitized!))
            .limit(1);
        
        if (existingUser.length > 0) {
            return { error: 'Username already taken' };
        }

        const result = await auth.api.signUpEmail({
            body: {
                email,
                password,
                name: validation.sanitized!,
                username: validation.sanitized!,
            },
            headers: {
                'x-captcha-response': captchaToken,
            }
        });

        return { data: result, error: null };
    } catch (error: any) {
        console.error('Signup error:', error);
        // Handle Better Auth specific errors
        if (error.code === 'USER_ALREADY_EXISTS' || error.message?.includes('already exists')) {
            return { error: 'An account with this email already exists. Please sign in instead.' };
        }
        return { 
            error: error.message || 'An error occurred during signup. Please try again.' 
        };
    }
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error('You must be signed in to change your password');
  }

  // Get the user's current password hash
  const userAccount = await db
    .select()
    .from(account)
    .where(eq(account.userId, session.user.id))
    .limit(1);

  if (userAccount.length === 0 || !userAccount[0].password) {
    throw new Error('No password found for this account');
  }

  // Verify current password
  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userAccount[0].password);
  if (!isCurrentPasswordValid) {
    throw new Error('Current password is incorrect');
  }

  // Hash new password
  const hashedNewPassword = await bcrypt.hash(newPassword, 12);

  // Update password
  await db
    .update(account)
    .set({
      password: hashedNewPassword,
      updatedAt: new Date(),
    })
    .where(eq(account.userId, session.user.id));

  return { success: true };
}