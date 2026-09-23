import { BrowserRouter as Router } from 'react-router-dom';

import '@/styles/globals.css';
import { initTheme } from '@onaeko/ui';
import { Toaster } from '@onaeko/ui/sonner';
import UserState from './context/user/userState';
import AppState from './context/app/appState';
import MainRoutes from './routes/routes';
import { AppErrorBoundary } from '@/components/base/common/error-boubdary';

initTheme('light');

function App() {
    return (
        <AppErrorBoundary>
            <Router>
                <UserState>
                    <AppState>
                        <MainRoutes />
                    </AppState>
                </UserState>
            </Router>
            <Toaster />
        </AppErrorBoundary>
    );
}

export default App;

