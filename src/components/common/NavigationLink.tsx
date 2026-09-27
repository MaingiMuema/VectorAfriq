"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useNavigationLoading } from "@/contexts/NavigationLoadingContext";

interface NavigationLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export default function NavigationLink({ href, children, className, onClick }: NavigationLinkProps) {
  const router = useRouter();
  const { setLoading } = useNavigationLoading();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) {
      onClick(e);
    }
    
    if (!e.defaultPrevented && href.startsWith("/")) {
      e.preventDefault();
      setLoading(true);
      router.push(href);
    }
  };

  return (
    <Link href={href} className={className} onClick={handleClick}>
      {children}
    </Link>
  );
}
