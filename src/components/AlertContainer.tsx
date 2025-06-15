
import React from 'react';
import SystemAlert from './SystemAlert';
import { useSystemAlert } from '@/hooks/useSystemAlert';

const AlertContainer: React.FC = () => {
  const { alerts, removeAlert } = useSystemAlert();

  if (alerts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 w-96 max-w-sm">
      {alerts.map((alert) => (
        <SystemAlert
          key={alert.id}
          type={alert.type}
          title={alert.title}
          message={alert.message}
          actions={alert.actions}
          onClose={() => removeAlert(alert.id)}
        />
      ))}
    </div>
  );
};

export default AlertContainer;
