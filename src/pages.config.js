import Dashboard from './pages/Dashboard';
import MobileDashboard from './pages/MobileDashboard';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "MobileDashboard": MobileDashboard,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};