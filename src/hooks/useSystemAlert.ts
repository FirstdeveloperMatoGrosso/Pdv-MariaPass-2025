
import { useState, useCallback } from 'react';

interface AlertConfig {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary';
  }>;
}

interface SystemAlert extends AlertConfig {
  id: string;
}

export const useSystemAlert = () => {
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);

  const showAlert = useCallback((config: AlertConfig) => {
    const id = Date.now().toString();
    const alert: SystemAlert = { ...config, id };
    
    setAlerts(prev => [...prev, alert]);

    // Auto remove after duration (default 5 seconds)
    const duration = config.duration !== undefined ? config.duration : 5000;
    if (duration > 0) {
      setTimeout(() => {
        removeAlert(id);
      }, duration);
    }

    return id;
  }, []);

  const removeAlert = useCallback((id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  }, []);

  const clearAllAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  return {
    alerts,
    showAlert,
    removeAlert,
    clearAllAlerts
  };
};
