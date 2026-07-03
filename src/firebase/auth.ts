import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  getAuth,
  type User,
  type UserCredential,
} from 'firebase/auth'
import { initializeApp, deleteApp } from 'firebase/app'
import { auth, firebaseConfig } from './config'

export function signIn(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password)
}

export function signOut() {
  return firebaseSignOut(auth)
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback)
}

/**
 * Cria um novo usuário Firebase Auth SEM trocar a sessão atual do admin.
 * Usa um app secundário temporário para isolar a criação.
 */
export async function createUserWithoutSignIn(
  email: string,
  password: string
): Promise<UserCredential> {
  const tempApp = initializeApp(firebaseConfig, `temp-create-${Date.now()}`)
  const tempAuth = getAuth(tempApp)
  try {
    const cred = await createUserWithEmailAndPassword(tempAuth, email, password)
    return cred
  } finally {
    await deleteApp(tempApp)
  }
}
