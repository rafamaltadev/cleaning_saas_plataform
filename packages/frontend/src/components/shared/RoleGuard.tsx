import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import type { UserRole } from '../../types';

interface RoleGuardProps {
  requiredRoles: UserRole[];
  children: ReactNode;
}

export default function RoleGuard({ requiredRoles, children }: RoleGuardProps) {
  const user = useSelector((state: RootState) => state.auth.user);

  if (!user || !requiredRoles.includes(user.role)) {
    return <Navigate to="/kanban" replace />;
  }

  return <>{children}</>;
}
