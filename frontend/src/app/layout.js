import '../styles/globals.css';
import { Inter } from 'next/font/google';

export const metadata = {
  title: 'Hệ thống Quản lý Sinh viên',
  description: 'Quản lý học tập, điểm số và tài chính theo cách rõ ràng, gọn gàng.',
}

import { AuthProvider } from '@/components/providers/AuthProvider';
import PopupHost from '@/components/providers/PopupHost';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <PopupHost />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
