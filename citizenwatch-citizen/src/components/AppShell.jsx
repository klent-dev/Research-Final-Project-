import { useLocation } from 'react-router-dom';
import BottomNavigation from './BottomNavigation.jsx';
import FloatingActionButton from './FloatingActionButton.jsx';
import TopHeader from './TopHeader.jsx';

const authRoutes = ['/', '/login', '/register'];
const noHeaderRoutes = ['/profile', '/reports', '/my-reports'];
const createReportRoutes = ['/reports/create', '/reports/create/location'];

export default function AppShell({ children }) {
  const { pathname } = useLocation();
  const isAuthRoute = authRoutes.includes(pathname);
  const isCreateReportRoute = createReportRoutes.includes(pathname);
  const shouldHideHeader = isAuthRoute || noHeaderRoutes.includes(pathname) || isCreateReportRoute;
  const hideFabRoutes = ['/home', '/dashboard', '/reports', '/map', '/alerts', '/profile', '/submit-report', '/reports/create', '/reports/create/location'];
  const shouldHideFab = hideFabRoutes.includes(pathname);
  const shouldHideBottomNav = isCreateReportRoute;

  return (
    <div className={isAuthRoute ? 'app-shell app-shell--auth' : 'app-shell'}>
      {!shouldHideHeader && <TopHeader />}
      {children}
      {!isAuthRoute && (
        <>
          {!shouldHideFab && <FloatingActionButton />}
          {!shouldHideBottomNav && <BottomNavigation />}
        </>
      )}
    </div>
  );
}
