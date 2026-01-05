import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import Leaderboard from './pages/Leaderboard';
import MobileDashboard from './pages/MobileDashboard';
import NotificationSettings from './pages/NotificationSettings';
import SiteAnalytics from './pages/SiteAnalytics';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Home": Home,
    "Leaderboard": Leaderboard,
    "MobileDashboard": MobileDashboard,
    "NotificationSettings": NotificationSettings,
    "SiteAnalytics": SiteAnalytics,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};