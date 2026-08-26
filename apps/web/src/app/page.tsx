'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '../lib/api';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace(getToken() ? '/dashboard' : '/login');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-deep">
      <div className="h-8 w-8 rounded-full border-2 border-edge-strong border-t-accent animate-spin" />
    </div>
  );
}
