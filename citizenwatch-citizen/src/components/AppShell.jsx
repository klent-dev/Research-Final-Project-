import { useLocation } from 'react-router-dom';
import BottomNavigation from './BottomNavigation.jsx';
import FloatingActionButton from './FloatingActionButton.jsx';
import TopHeader from './TopHeader.jsx';

const authRoutes = ['/', '/login', '/register'];

export default function AppShell({ children }) {
  const { pathname } = useLocation();
  const isAuthRoute = authRoutes.includes(pathname);
  const isSubmitRoute = pathname === '/submit-report';

  return (
    <div className={isAuthRoute ? 'app-shell app-shell--auth' : 'app-shell'}>
      {!isAuthRoute && <TopHeader />}
      {children}
      {!isAuthRoute && (
        <>
          {!isSubmitRoute && <FloatingActionButton />}
          <BottomNavigation />
        </>
      )}
    </div>
  );
}
