"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/use-auth";
import { getFavorites, removeFavorite } from "@/lib/db";
import type { ProfileWithDetails } from "@/lib/types";
import { ProfileCardSkeleton } from "@/components/ui/skeleton";

export default function FavoritesPage() {
  const { user, loading: authLoading } = useAuth();
  const [favorites, setFavorites] = useState<ProfileWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFavorites = async () => {
      if (!user) return;
      try {
        setError(null);
        const data = await getFavorites(user.id);
        setFavorites(data);
      } catch {
        setError("Failed to load favorites.");
      } finally {
        setLoading(false);
      }
    };
    loadFavorites();
  }, [user]);

  const handleRemove = async (profileId: string) => {
    if (!user) return;
    await removeFavorite(user.id, profileId);
    setFavorites(favorites.filter(f => f.id !== profileId));
  };

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-white">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-6 py-4">
            <Link href="/dashboard" className="text-2xl font-bold text-slate-950 hover:text-slate-700">FindTeamo</Link>
          </div>
        </header>
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <ProfileCardSkeleton />
            <ProfileCardSkeleton />
            <ProfileCardSkeleton />
          </div>
        </div>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="text-2xl font-bold text-slate-950 hover:text-slate-700">FindTeamo</Link>
          <Link href="/dashboard" className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">Back</Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-950">Your Favorites</h1>
          <p className="mt-2 text-slate-600">{favorites.length} favorite{favorites.length !== 1}s</p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {favorites.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
            <div className="text-6xl mb-4">⭐</div>
            <h2 className="text-xl font-semibold text-slate-950">No favorites yet</h2>
            <p className="mt-2 text-slate-600">Start discovering profiles and add favorites to see them here.</p>
            <Link href="/discover" className="mt-6 inline-block rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-blue-700">Discover Profiles</Link>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {favorites.map((fav) => (
              <div key={fav.id} className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-sm transition hover:shadow-md">
                <div className="h-48 bg-gradient-to-br from-blue-100 to-purple-100 relative">
                  {fav.avatar_url ? (
                    <Image src={fav.avatar_url} alt={fav.full_name || fav.username} fill className="object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-4xl">👤</div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-slate-950">{fav.full_name || fav.username}</h3>
                  {fav.experience_level && (
                    <span className="inline-block mt-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-900 capitalize">
                      {fav.experience_level}
                    </span>
                  )}
                  {fav.bio && (
                    <p className="mt-2 text-sm text-slate-600 line-clamp-2">{fav.bio}</p>
                  )}
                  <div className="mt-4 flex gap-2">
                    <Link href={`/profile/${fav.id}`} className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white text-center transition hover:bg-blue-700">View Profile</Link>
                    <button onClick={() => handleRemove(fav.id)} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">Remove</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}