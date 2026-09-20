import { useEffect } from "react";
import { startAuthListener, useAuthStore } from "@/store/authStore";

export function useAuth() {
  useEffect(() => {
    startAuthListener();
  }, []);
  return useAuthStore();
}
