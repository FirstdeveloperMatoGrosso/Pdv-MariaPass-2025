
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Info, CheckCircle, XCircle, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SystemAlertProps {
  type?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message?: string | React.ReactNode;
  imageUrl?: string;
  onClose?: () => void;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary';
    icon?: React.ReactNode;
  }>;
  className?: string;
  showCloseButton?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const SystemAlert: React.FC<SystemAlertProps> = ({
  type = 'info',
  title,
  message,
  imageUrl,
  onClose,
  actions,
  className = '',
  showCloseButton = true,
  size = 'md',
}) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-600" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getVariant = () => {
    switch (type) {
      case 'error':
        return 'destructive' as const;
      default:
        return 'default' as const;
    }
  };

  const sizeClasses = {
    sm: 'w-[calc(100%-2rem)] sm:max-w-xs',
    md: 'w-[calc(100%-2rem)] sm:max-w-md',
    lg: 'w-[calc(100%-2rem)] sm:max-w-2xl',
    xl: 'w-[calc(100%-2rem)] sm:max-w-4xl',
  };

  const alertSize = size || 'md';

  return (
    <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-2 sm:p-4 bg-black bg-opacity-50 backdrop-blur-sm overflow-y-auto">
      <div 
        className={cn(
          'w-full mx-auto overflow-hidden rounded-lg shadow-xl transition-all duration-300 bg-background',
          sizeClasses[alertSize],
          className
        )}
      >
        <Alert variant={getVariant()} className="relative p-0 h-full">
          <div className="flex flex-col md:flex-row h-full">
            {imageUrl && (
              <div className="w-full md:w-2/5 lg:w-1/3 bg-gray-100 dark:bg-gray-800 flex items-center justify-center p-2 sm:p-4">
                <div className="relative w-full h-40 sm:h-48 md:h-full md:min-h-[200px] flex items-center justify-center">
                  <img
                    src={imageUrl}
                    alt="Product"
                    className="max-h-full max-w-full object-contain"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = '/placeholder.svg';
                    }}
                  />
                </div>
              </div>
            )}

            <div className="flex-1 p-4 sm:p-6 overflow-y-auto max-h-[80vh] md:max-h-[90vh]">
              <div className="flex items-start justify-between gap-2">
                {title && (
                  <AlertTitle className="text-base sm:text-lg font-semibold mb-2 break-words">
                    {title}
                  </AlertTitle>
                )}
                <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                  {showCloseButton && onClose && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-muted-foreground hover:text-foreground"
                      onClick={onClose}
                    >
                      <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="sr-only">Fechar</span>
                    </Button>
                  )}
                </div>
              </div>

              {message && (
                <AlertDescription className="mt-2 text-sm text-muted-foreground break-words">
                  {typeof message === 'string' ? (
                    <div className="overflow-auto max-h-[50vh] pr-2">
                      <p className="whitespace-pre-line">{message}</p>
                    </div>
                  ) : (
                    <div className="overflow-auto max-h-[50vh] pr-2">
                      {message}
                    </div>
                  )}
                </AlertDescription>
              )}

              {actions && actions.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {actions.map((action, index) => (
                    <Button
                      key={index}
                      variant={action.variant || 'default'}
                      size="sm"
                      className="text-xs sm:text-sm flex-1 sm:flex-initial min-w-[100px]"
                      onClick={action.onClick}
                    >
                      {action.icon && <span className="mr-1">{action.icon}</span>}
                      <span className="truncate">{action.label}</span>
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Alert>
      </div>
    </div>
  );
};

export default SystemAlert;
