
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
    sm: 'max-w-xs',
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  const alertSize = size || 'md';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className={cn(
        'w-full mx-auto overflow-hidden rounded-lg shadow-xl transition-all duration-300',
        sizeClasses[alertSize],
        className
      )}>
        <Alert variant={getVariant()} className="relative p-0">
          <div className="flex flex-col md:flex-row">
            {imageUrl && (
              <div className="w-full md:w-1/3 bg-gray-100 dark:bg-gray-800 flex items-center justify-center p-4">
                <div className="relative w-full h-48 md:h-auto md:min-h-[200px] flex items-center justify-center">
                  <img
                    src={imageUrl}
                    alt="Product"
                    className="max-h-full max-w-full object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = '/placeholder.svg';
                    }}
                  />
                </div>
              </div>
            )}

            <div className="flex-1 p-6">
              <div className="flex items-start justify-between">
                {title && (
                  <AlertTitle className="text-lg font-semibold mb-2">
                    {title}
                  </AlertTitle>
                )}
                {showCloseButton !== false && onClose && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="absolute right-2 top-2 h-8 w-8 p-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Fechar</span>
                  </Button>
                )}
              </div>

              {message && (
                <AlertDescription className="mt-2 text-sm text-muted-foreground">
                  {typeof message === 'string' ? (
                    <div className="whitespace-pre-line">{message}</div>
                  ) : (
                    message
                  )}
                </AlertDescription>
              )}

              {actions && actions.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {actions.map((action, index) => (
                    <Button
                      key={index}
                      size="sm"
                      variant={action.variant || 'default'}
                      onClick={action.onClick}
                      className="flex items-center gap-2"
                    >
                      {action.icon}
                      {action.label}
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
