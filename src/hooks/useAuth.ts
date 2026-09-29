// src/hooks/useAuth.ts
import { useEffect, useState } from "react";
import { pb } from "@/lib/pocketbase";

export function useAuth() {
  // L'état initial est synchrone
  const [user, setUser] = useState(pb.authStore.model);
  const [initializing, setInitializing] = useState(false); // Toujours faux avec PB car synchrone

  useEffect(() => {
    // S'abonner aux changements du store d'authentification
    const unsubscribe = pb.authStore.onChange((token, model) => {
      setUser(model);
    }, true);

    return () => {
      unsubscribe();
    };
  }, []);

  return { user, initializing };
}