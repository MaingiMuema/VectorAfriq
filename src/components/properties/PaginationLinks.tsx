'use client';

import { useEffect, useRef, useTransition, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export interface PaginationItem {
  page?: number;
  href?: string;
  ellipsis?: boolean;
}

function isPlainLeftClick(event: MouseEvent) {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}

export default function PaginationLinks({
  currentPage,
  totalPages,
  prevHref,
  nextHref,
  items,
}: {
  currentPage: number;
  totalPages: number;
  prevHref: string | null;
  nextHref: string | null;
  items: PaginationItem[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const wasPending = useRef(false);

  // Scroll to top only once the newly-navigated page has actually rendered,
  // instead of jumping the instant the pagination link is clicked.
  useEffect(() => {
    if (wasPending.current && !isPending) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    wasPending.current = isPending;
  }, [isPending]);

  const navigate = (href: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    if (!isPlainLeftClick(event)) {
      return;
    }
    event.preventDefault();
    startTransition(() => {
      // scroll: false — Next's built-in post-navigation scroll only scrolls
      // to the top of the new segment (which can land mid-page under the
      // shared layout); we scroll the whole window ourselves once isPending
      // clears instead.
      router.push(href, { scroll: false });
    });
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <>
      {isPending &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed top-0 left-0 right-0 z-[60] h-1 bg-gray-100">
            <div className="h-full w-1/3 bg-[#468AD1] animate-pulse" />
          </div>,
          document.body
        )}

      <nav
        className={`flex items-center justify-center gap-1 sm:gap-2 mt-8 transition-opacity ${
          isPending ? 'opacity-60 pointer-events-none' : ''
        }`}
        aria-label="Pagination"
        aria-busy={isPending}
      >
        {prevHref ? (
          <Link
            href={prevHref}
            onClick={navigate(prevHref)}
            className="px-3 sm:px-4 py-2 rounded-md text-sm sm:text-base bg-white text-gray-700 hover:bg-gray-50 border"
          >
            Previous
          </Link>
        ) : (
          <span className="px-3 sm:px-4 py-2 rounded-md text-sm sm:text-base bg-gray-100 text-gray-400 border">
            Previous
          </span>
        )}

        <div className="flex gap-1 sm:gap-2">
          {items.map((item, index) =>
            item.ellipsis ? (
              <span
                key={`ellipsis-${index}`}
                className="px-2 sm:px-3 py-2 text-gray-500 text-sm sm:text-base"
              >
                ...
              </span>
            ) : (
              <Link
                key={item.page}
                href={item.href!}
                onClick={navigate(item.href!)}
                className={`px-2 sm:px-4 py-2 rounded-md text-sm sm:text-base min-w-[32px] sm:min-w-[40px] text-center ${
                  currentPage === item.page
                    ? "bg-[#468AD1] text-white border border-[#468AD1]"
                    : "bg-white text-gray-700 hover:bg-gray-50 border"
                }`}
              >
                {item.page}
              </Link>
            )
          )}
        </div>

        {nextHref ? (
          <Link
            href={nextHref}
            onClick={navigate(nextHref)}
            className="px-3 sm:px-4 py-2 rounded-md text-sm sm:text-base bg-white text-gray-700 hover:bg-gray-50 border"
          >
            Next
          </Link>
        ) : (
          <span className="px-3 sm:px-4 py-2 rounded-md text-sm sm:text-base bg-gray-100 text-gray-400 border">
            Next
          </span>
        )}
      </nav>
    </>
  );
}
