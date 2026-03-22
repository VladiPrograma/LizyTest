"use client";

import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  inMemoryPersistence,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type NextOrObserver,
  type Persistence,
  type User,
} from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase";

export type AuthPersistenceMode = "local" | "session" | "none";

const persistenceMap: Record<AuthPersistenceMode, Persistence> = {
  local: browserLocalPersistence,
  session: browserSessionPersistence,
  none: inMemoryPersistence,
};

const resolvePersistence = (mode: AuthPersistenceMode = "local") => persistenceMap[mode];
const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: "select_account",
});

export type AuthCredentials = {
  email: string;
  password: string;
};

export type RegisterCredentials = AuthCredentials & {
  displayName?: string;
  persistence?: AuthPersistenceMode;
};

export type LoginCredentials = AuthCredentials & {
  persistence?: AuthPersistenceMode;
};

class AuthService {
  readonly auth = firebaseAuth;

  async setPersistence(mode: AuthPersistenceMode = "local") {
    await setPersistence(this.auth, resolvePersistence(mode));
  }

  async register({ email, password, displayName, persistence = "local" }: RegisterCredentials) {
    await this.setPersistence(persistence);

    const credential = await createUserWithEmailAndPassword(this.auth, email, password);

    if (displayName) {
      await updateProfile(credential.user, { displayName });
    }

    return credential.user;
  }

  async login({ email, password, persistence = "local" }: LoginCredentials) {
    await this.setPersistence(persistence);

    const credential = await signInWithEmailAndPassword(this.auth, email, password);

    return credential.user;
  }

  async sendPasswordReset(email: string) {
    await sendPasswordResetEmail(this.auth, email);
  }

  async signInWithGoogle(persistence: AuthPersistenceMode = "local") {
    await this.setPersistence(persistence);

    const credential = await signInWithPopup(this.auth, googleProvider);

    return credential.user;
  }

  async logout() {
    await signOut(this.auth);
  }

  getCurrentUser() {
    return this.auth.currentUser;
  }

  onAuthStateChanged(nextOrObserver: NextOrObserver<User>) {
    return onAuthStateChanged(this.auth, nextOrObserver);
  }
}

export const authService = new AuthService();
