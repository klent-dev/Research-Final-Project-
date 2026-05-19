import { useLocation } from 'react-router-dom';
import BottomNavigation from './BottomNavigation.jsx';
import FloatingActionButton from './FloatingActionButton.jsx';
import TopHeader from './TopHeader.jsx';

const authRoutes = ['/', '/login', '/register'];
const noHeaderRoutes = ['/profile', '/reports', '/my-reports', '/alerts', '/map'];
const bottomNavRoutes = ['/home', '/reports', '/map', '/alerts', '/profile'];

export default function AppShell({ children }) {
  const { pathname } = useLocation();
  const isAuthRoute = authRoutes.includes(pathname);
  const isCreateReportRoute = pathname === '/reports/create' || pathname.startsWith('/reports/create/');
  const isReportDetailsRoute = /^\/reports\/(?!create(?:\/|$))[^/]+$/.test(pathname);
  const shouldHideHeader = isAuthRoute || noHeaderRoutes.includes(pathname) || isCreateReportRoute || isReportDetailsRoute;
  const hideFabRoutes = ['/home', '/dashboard', '/reports', '/map', '/alerts', '/profile', '/submit-report', '/reports/create', '/reports/create/location', '/reports/create/details', '/reports/create/success'];
  const shouldHideFab = hideFabRoutes.includes(pathname) || isReportDetailsRoute;
  const shouldShowBottomNav = bottomNavRoutes.includes(pathname) || isReportDetailsRoute;

  return (
    <div className={isAuthRoute ? 'app-shell app-shell--auth' : 'app-shell'}>
      {!shouldHideHeader && <TopHeader />}
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
