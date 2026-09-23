import { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Liên Hệ',
  description: 'Liên hệ với không gian gốm sứ nghệ thuật Nghĩa Phái.',
  alternates: { canonical: '/contact' },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
