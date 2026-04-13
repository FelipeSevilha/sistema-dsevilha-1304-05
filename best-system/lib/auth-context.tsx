'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase, UserProfile, UserRole } from './supabase';

export type { UserRole };

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  ativo: boolean;
  criadoEm: string;
}

export interface AuthContextType {
  user: AppUser | null;
  users: AppUser[];
  isAuthenticated: boolean;
  canEdit: (modulo: string) => boolean;
  canCreate: (modulo: string) => boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  addUser: (data: { name: string; email: string; password: string; role: UserRole; ativo: boolean }) => Promise<void>;
  updateUser: (id: string, data: Partial<AppUser & { password?: string }>) => Promise<void>;
  removeUser: (id: string) => Promise<void>;
}

const VENDEDOR_EDIT_MODULES = ['clientes', 'orcamentos', 'pedidos'];
const AuthContext = createContext<AuthContextType | null>(null);

function toAppUser(profile: UserProfile, email = ''): AppUser {
  return {
    id: profile.id,
    name: profile.name,
    email,
    role: profile.role,
    ativo: profile.ativo,
    criadoEm: profile.created_at?.slice(0, 10) ?? '',
  };
}

async function getEmailMap() {
  const { data } = await supabase.auth.admin.listUsers();
  const map: Record<string, string> = {};
  data.users.forEach((u) => {
    map[u.id] = u.email ?? '';
  });
  return map;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [users, setUsers] = useState<AppUser[]>([]);

  useEffect(() => {
    let mounted = true;

    async function boot() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      if (session?.user) {
        await loadCurrentUserProfile(session.user.id, session.user.email ?? '');
      }
      await loadAllUsers();
    }

    boot();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await loadCurrentUserProfile(session.user.id, session.user.email ?? '');
      } else {
        setUser(null);
      }
      await loadAllUsers();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function loadCurrentUserProfile(userId: string, email?: string) {
    const { data } = await supabase
      .from<UserProfile>('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (data) setUser(toAppUser(data as UserProfile, email));
  }

  async function loadAllUsers() {
    const [{ data: profiles }, emailMap] = await Promise.all([
      supabase.from<UserProfile>('user_profiles').select('*').order('created_at'),
      getEmailMap(),
    ]);

    const safeProfiles = Array.isArray(profiles) ? profiles : [];
    setUsers(safeProfiles.map((profile) => toAppUser(profile, emailMap[profile.id] ?? '')));
  }

  const canEdit = (modulo: string) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return VENDEDOR_EDIT_MODULES.includes(modulo);
  };

  const canCreate = (modulo: string) => canEdit(modulo);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) return false;
    const { data: profile } = await supabase
      .from<UserProfile>('user_profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

    if (!profile || !(profile as UserProfile).ativo) {
      await supabase.auth.signOut();
      return false;
    }

    await loadCurrentUserProfile(data.user.id, data.user.email ?? '');
    await loadAllUsers();
    return true;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const addUser = async (data: { name: string; email: string; password: string; role: UserRole; ativo: boolean }) => {
    const { data: authData, error } = await supabase.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { name: data.name },
    });
    if (error || !authData.user) throw error;

    await supabase.from<UserProfile>('user_profiles').insert({
      id: authData.user.id,
      name: data.name,
      role: data.role,
      ativo: data.ativo,
      created_at: new Date().toISOString(),
    });

    await loadAllUsers();
  };

  const updateUser = async (id: string, data: Partial<AppUser & { password?: string }>) => {
    const profileUpdate: Partial<UserProfile> = {};
    if (data.name !== undefined) profileUpdate.name = data.name;
    if (data.role !== undefined) profileUpdate.role = data.role;
    if (data.ativo !== undefined) profileUpdate.ativo = data.ativo;

    if (Object.keys(profileUpdate).length > 0) {
      await supabase.from<UserProfile>('user_profiles').update(profileUpdate).eq('id', id);
    }

    if (user?.id === id) {
      const email = users.find((u) => u.id === id)?.email ?? user.email;
      setUser((prev) => (prev ? { ...prev, ...data, email } : null));
    }

    await loadAllUsers();
  };

  const removeUser = async (id: string) => {
    await supabase.from<UserProfile>('user_profiles').delete().eq('id', id);
    await loadAllUsers();
  };

  const value = useMemo<AuthContextType>(
    () => ({ user, users, isAuthenticated: !!user, canEdit, canCreate, login, logout, addUser, updateUser, removeUser }),
    [user, users],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
