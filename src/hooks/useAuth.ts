import { useAuthStore } from "@/store/authStore";

/** La session PocketBase est restaurée de façon synchrone depuis le
 *  localStorage : pas d'état "initialisation" à attendre. */
export function useAuth() {
  const user = useAuthStore((s) => s.user);
  return { user, initializing: false };
}
