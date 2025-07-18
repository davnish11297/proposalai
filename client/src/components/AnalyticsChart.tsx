import React from 'react';

interface ChartData {
  label: string;
  value: number;
  color?: string;
}

interface AnalyticsChartProps {
  title: string;
  data: ChartData[];
  type?: 'bar' | 'pie' | 'line';
  height?: number;
}

const AnalyticsChart: React.FC<AnalyticsChartProps> = ({ 
  title, 
  data, 
  type = 'bar', 
  height = 200 
}) => {
  const maxValue = Math.max(...data.map(d => d.value));
  const total = data.reduce((sum, d) => sum + d.value, 0);

  const getBarChart = () => (
    <div className="space-y-2">
      {data.map((item, index) => (
        <div key={index} className="flex items-center gap-3">
          <div className="w-20 text-sm text-gray-600 truncate">{item.label}</div>
          <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${(item.value / maxValue) * 100}%`,
                backgroundColor: item.color || '#3B82F6'
              }}
            />
          </div>
          <div className="w-12 text-sm font-medium text-gray-900 text-right">
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );

  const getPieChart = () => (
    <div className="flex items-center justify-center">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {data.map((item, index) => {
            const percentage = (item.value / total) * 100;
            const previousPercentages = data
              .slice(0, index)
              .reduce((sum, d) => sum + (d.value / total) * 100, 0);
            
            const startAngle = (previousPercentages / 100) * 360;
            const endAngle = ((previousPercentages + percentage) / 100) * 360;
            
            const x1 = 50 + 40 * Math.cos((startAngle * Math.PI) / 180);
            const y1 = 50 + 40 * Math.sin((startAngle * Math.PI) / 180);
            const x2 = 50 + 40 * Math.cos((endAngle * Math.PI) / 180);
            const y2 = 50 + 40 * Math.sin((endAngle * Math.PI) / 180);
            
            const largeArcFlag = percentage > 50 ? 1 : 0;
            
            return (
              <path
                key={index}
                d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                fill={item.color || '#3B82F6'}
                stroke="white"
                strokeWidth="1"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">{total}</div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
        </div>
      </div>
      <div className="ml-6 space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color || '#3B82F6' }}
            />
            <span className="text-sm text-gray-600">{item.label}</span>
            <span className="text-sm font-medium text-gray-900">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const getLineChart = () => (
    <div className="relative" style={{ height: `${height}px` }}>
      <svg className="w-full h-full" viewBox={`0 0 100 ${height}`}>
        <polyline
          fill="none"
          stroke="#3B82F6"
          strokeWidth="2"
          points={data.map((item, index) => {
            const x = (index / (data.length - 1)) * 100;
            const y = height - (item.value / maxValue) * height;
            return `${x},${y}`;
          }).join(' ')}
        />
        {data.map((item, index) => {
          const x = (index / (data.length - 1)) * 100;
          const y = height - (item.value / maxValue) * height;
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="3"
              fill="#3B82F6"
            />
          );
        })}
      </svg>
      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500">
        {data.map((item, index) => (
          <div key={index} className="text-center">
            <div className="font-medium text-gray-900">{item.value}</div>
            <div className="truncate max-w-16">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div style={{ minHeight: `${height}px` }}>
        {type === 'bar' && getBarChart()}
        {type === 'pie' && getPieChart()}
        {type === 'line' && getLineChart()}
      </div>
    </div>
  );
};

export default AnalyticsChart; 