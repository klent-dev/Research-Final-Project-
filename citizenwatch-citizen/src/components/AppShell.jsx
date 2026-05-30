import { useLocation } from 'react-router-dom';
import BottomNavigation from './BottomNavigation.jsx';
import FloatingActionButton from './FloatingActionButton.jsx';
import TopHeader from './TopHeader.jsx';

const authRoutes = ['/', '/login', '/register'];
const bottomNavRoutes = ['/home', '/reports', '/map', '/alerts', '/profile', '/profile/edit'];

export default function AppShell({ children }) {
  const { pathname } = useLocation();
  const isAuthRoute = authRoutes.includes(pathname);
  const isCreateReportRoute = pathname === '/reports/create' || pathname.startsWith('/reports/create/');
  const isReportDetailsRoute = /^\/reports\/(?!create(?:\/|$))[^/]+$/.test(pathname);
  const shouldShowHeader = pathname === '/home';
  const shellClassName = [
    'app-shell',
    isAuthRoute ? 'app-shell--auth' : '',
    !isAuthRoute && !shouldShowHeader ? 'app-shell--no-header' : ''
  ].filter(Boolean).join(' ');
  const hideFabRoutes = ['/home', '/dashboard', '/reports', '/map', '/alerts', '/profile', '/profile/edit', '/submit-report', '/reports/create', '/reports/create/location', '/reports/create/details', '/reports/create/success'];
  const shouldHideFab = hideFabRoutes.includes(pathname) || isReportDetailsRoute;
  const shouldShowBottomNav = bottomNavRoutes.includes(pathname) || isReportDetailsRoute;

  return (
    <div className={shellClassName}>
      {!isAuthRoute && shouldShowHeader && <TopHeader />}
      {children}
      {!isAuthRoute && (
        <>
          {!shouldHideFab && <FloatingActionButton />}
          {shouldShowBottomNav && <BottomNavigation />}
        </>
      )}
    </div>
  );
}
