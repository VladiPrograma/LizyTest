'use server';

import { db } from '@/db';
import { userPreferences, user } from '@/db/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { eq, inArray } from 'drizzle-orm';

export async function getUserPreferences() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return null;
  }

  const prefs = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, session.user.id))
    .limit(1);

  if (prefs.length === 0) {
    // Create default preferences
    await db
      .insert(userPreferences)
      .values({
        userId: session.user.id,
        ignoredUsers: '[]',
      });
    
    return {
      ignoredUsers: [],
    };
  }

  const ignoredUserIds = JSON.parse(prefs[0].ignoredUsers) as string[];
  if (ignoredUserIds.length === 0) {
    return { ignoredUsers: [] };
  }

  const ignoredUsernames = await db
    .select({ username: user.username })
    .from(user)
    .where(inArray(user.id, ignoredUserIds));

  return {
    ignoredUsers: ignoredUsernames.map(u => u.username).filter((username): username is string => username !== null),
  };
}

export async function updateIgnoredUsers(ignoredUsernames: string[]) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error('You must be signed in to update preferences');
  }

  let ignoredUserIds: string[] = [];
  if (ignoredUsernames.length > 0) {
    const ignoredUsers = await db
      .select({ id: user.id })
      .from(user)
      .where(inArray(user.username, ignoredUsernames));
    ignoredUserIds = ignoredUsers.map(u => u.id);
  }

  // Check if preferences exist
  const existing = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, session.user.id))
    .limit(1);

  if (existing.length === 0) {
    // Create new preferences
    await db.insert(userPreferences).values({
      userId: session.user.id,
      ignoredUsers: JSON.stringify(ignoredUserIds),
    });
  } else {
    // Update existing preferences
    await db
      .update(userPreferences)
      .set({
        ignoredUsers: JSON.stringify(ignoredUserIds),
        updatedAt: new Date(),
      })
      .where(eq(userPreferences.userId, session.user.id));
  }

  return { success: true };
}

// Helper function to get user ID by username
export async function getUserIdByUsername(username: string) {
  const users = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.username, username))
    .limit(1);

  return users.length > 0 ? users[0].id : null;
}
