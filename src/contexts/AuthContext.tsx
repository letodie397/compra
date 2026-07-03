import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User } from 'firebase/auth'
import { onAuthChange, signOut as firebaseSignOut } from '../firebase/auth'
import { getUserProfile, saveUserProfile, listUserProfiles } from '../firebase/repository'
import type { UserProfile } from '../types'

interface AuthContextValue {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  reloadProfile: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  async function fetchProfile(firebaseUser: User): Promise<UserProfile | null> {
    let p = await getUserProfile(firebaseUser.uid)

    // Se não existe perfil algum no sistema, este é o primeiro usuário → cria admin automático
    if (!p) {
      const all = await listUserProfiles()
      if (all.length === 0) {
        const adminProfile: UserProfile = {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName ?? firebaseUser.email?.split('@')[0] ?? 'Admin',
          sector: 'admin',
        }
        await saveUserProfile(adminProfile)
        p = adminProfile
      }
    }

    return p
  }

  useEffect(() => {
    const unsub = onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        try {
          const p = await fetchProfile(firebaseUser)
          setProfile(p)
        } catch {
          setProfile(null)
        }
      } else {
        setProfile(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  async function reloadProfile() {
    if (!user) return
    try {
      const p = await fetchProfile(user)
      setProfile(p)
    } catch {
      setProfile(null)
    }
  }

  async function signOut() {
    await firebaseSignOut()
    setUser(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, reloadProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
