"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "./supabase";
import type { User } from "@supabase/supabase-js";

export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Fast: reads from local storage, no network round trip
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (!session?.user) {
        setLoading(false);
        router.push("/login");
        return;
      }
      setUser(session.user);
      setLoading(false);
    });

    // Keep in sync with future auth changes (login/logout in another tab, token refresh, etc.)
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (!session?.user) {
        setUser(null);
        router.push("/login");
        return;
      }
      setUser(session.user);
      setLoading(false);
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  return { user, loading };
}