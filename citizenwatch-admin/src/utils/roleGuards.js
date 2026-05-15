export function isLguAdmin(profile) {
  return profile?.role === (import.meta.env.VITE_ADMIN_ALLOWED_ROLE ?? 'lgu_admin');
}

