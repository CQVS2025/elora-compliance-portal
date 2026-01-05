import Home from './pages/Home';
import Leaderboard from './pages/Leaderboard';
import MobileDashboard from './pages/MobileDashboard';
import NotificationSettings from './pages/NotificationSettings';
import SiteAnalytics from './pages/SiteAnalytics';
import Dashboard from './pages/Dashboard';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Leaderboard": Leaderboard,
    "MobileDashboard": MobileDashboard,
    "NotificationSettings": NotificationSettings,
    "SiteAnalytics": SiteAnalytics,
    "Dashboard": Dashboard,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};