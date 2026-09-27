"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { FaHeart } from "react-icons/fa";
import {
  fetchFavoriteStatus,
  subscribeToFavoriteUpdates,
  toggleFavoriteProperty,
} from "@/lib/favorites";
import type { FavoritePropertyInput } from "@/lib/favorites";

interface FavoriteButtonProps {
  className?: string;
  property: FavoritePropertyInput;
}

export default function FavoriteButton({ className, property }: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = subscribeToFavoriteUpdates(() => {
      fetchFavoriteStatus(property.id)
        .then((nextIsFavorite) => {
          if (isMounted) {
            setIsFavorite(nextIsFavorite);
          }
        })
        .catch(() => {
          if (isMounted) {
            setIsFavorite(false);
          }
        });
    });

    fetchFavoriteStatus(property.id)
      .then((nextIsFavorite) => {
        if (isMounted) {
          setIsFavorite(nextIsFavorite);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsFavorite(false);
        }
      });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [property.id]);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isPending) {
      return;
    }

    const previousIsFavorite = isFavorite;
    const nextIsFavorite = !previousIsFavorite;

    setIsPending(true);
    setIsFavorite(nextIsFavorite);

    try {
      await toggleFavoriteProperty(property, previousIsFavorite);
      toast.success(
        nextIsFavorite
          ? "Property added to favorites"
          : "Property removed from favorites"
      );
    } catch (error) {
      setIsFavorite(previousIsFavorite);
      toast.error(error instanceof Error ? error.message : "Unable to update favorites");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <button
      type="button"
      className={className}
      onClick={handleFavoriteClick}
      aria-pressed={isFavorite}
      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
      disabled={isPending}
      title={isFavorite ? "Remove from favorites" : "Add to favorites"}
    >
      <FaHeart
        className={`w-3.5 h-3.5 transition-colors ${
          isFavorite
            ? "text-[#468AD1]"
            : "text-[#468AD1]/70 hover:text-[#468AD1]"
        }`}
      />
    </button>
  );
}
