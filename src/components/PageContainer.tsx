import { ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export function PageContainer({ children, className = '' }: PageContainerProps) {
  return (
    <div className={`px-4 sm:px-6 w-full max-w-[2000px] mx-auto ${className}`}>
      {children}
    </div>
  );
}
