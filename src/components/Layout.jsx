import React from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import BottomNav from './BottomNav';
import MobileHeader from './MobileHeader';
import Footer from './Landing/Footer';

const Layout = ({ children }) => {
    return (
        <div className="bg-surface text-on-surface antialiased flex selection:bg-primary-container/30">
            <Sidebar />
            <main className="md:ml-64 min-h-screen bg-surface flex flex-col w-full pb-20 md:pb-0">
                <MobileHeader />
                <Navbar />
                <div className="flex-1 pt-16 md:pt-0">
                    {children}
                </div>
                <div className="hidden md:block">
                    <Footer />
                </div>
            </main>
            <BottomNav />
        </div>
    );
};

export default Layout;
