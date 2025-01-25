import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <main className="container mx-auto px-4 pt-24 pb-8">
      {children}
    </main>
  );
};

export default Layout;
