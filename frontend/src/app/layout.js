import '../styles/globals.css';
import { Be_Vietnam_Pro } from 'next/font/google';

export const metadata = {
  title: 'Hệ thống Quản lý Sinh viên',
  description: 'Quản lý học tập, điểm số và tài chính theo cách rõ ràng, gọn gàng.',
}

import { AuthProvider } from '@/components/providers/AuthProvider';
import PopupHost from '@/components/providers/PopupHost';
import { NotificationProvider } from '@/components/providers/NotificationProvider';

const beVietnamPro = Be_Vietnam_Pro({
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  subsets: ['vietnamese', 'latin'],
  display: 'swap',
});

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body className={beVietnamPro.className}>
        <AuthProvider>
          <NotificationProvider>
            <PopupHost />
            {children}
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
