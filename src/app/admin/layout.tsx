import { AdminShell } from '@/components/admin/admin-shell';
import { QueryProvider } from '@/providers/query-provider';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AdminShell>{children}</AdminShell>
    </QueryProvider>
  );
}
