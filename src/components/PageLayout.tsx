import * as React from 'react';

interface PageLayoutProps {
  children: React.ReactNode;
  title: string;
  icon: React.ReactNode;
  headerRight?: React.ReactNode;
  className?: string;
}

export function PageLayout({ 
  children, 
  title, 
  icon, 
  headerRight,
  className = '' 
}: PageLayoutProps) {
  return (
    <div className="w-full min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 py-3 w-full">
        <div className="flex items-center space-x-2">
          {icon}
          <h1 className="text-lg sm:text-2xl font-bold text-gray-800">{title}</h1>
        </div>
        {headerRight && (
          <div className="flex-shrink-0">
            {headerRight}
          </div>
        )}
      </div>

      {/* Conteúdo */}
      <div className={className}>
        {children}
      </div>
    </div>
  );
}
