import React from 'react';
import { cn } from '../utils/cn';

interface DashboardCardProps {
  title: string;
  subtitle?: string;
  value?: string | number;
  change?: {
    value: number;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  iconBg?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function DashboardCard({
  title,
  subtitle,
  value,
  change,
  icon,
  iconBg = 'primary',
  children,
  className,
  onClick
}: DashboardCardProps) {
  const iconBgClasses = {
    primary: 'dashboard-card-icon-primary',
    success: 'dashboard-card-icon-success',
    warning: 'dashboard-card-icon-warning',
    danger: 'dashboard-card-icon-danger',
    info: 'dashboard-card-icon-primary', // Using primary for info as well
  };

  return (
    <div
      className={cn(
        'dashboard-card cursor-pointer transition-all duration-200',
        onClick && 'hover:shadow-xl-modern',
        className
      )}
      onClick={onClick}
    >
      <div className="dashboard-card-header">
        <div>
          <h3 className="dashboard-card-title">{title}</h3>
          {subtitle && <p className="dashboard-card-subtitle">{subtitle}</p>}
        </div>
        {icon && (
          <div className={iconBgClasses[iconBg]}>
            {icon}
          </div>
        )}
      </div>
      
      {value && (
        <div className="mb-2">
          <div className="stats-value">{value}</div>
          {change && (
            <div className={cn(
              'stats-change',
              change.isPositive ? 'stats-change-positive' : 'stats-change-negative'
            )}>
              {change.isPositive ? '+' : ''}{change.value}%
            </div>
          )}
        </div>
      )}
      
      {children}
    </div>
  );
} 