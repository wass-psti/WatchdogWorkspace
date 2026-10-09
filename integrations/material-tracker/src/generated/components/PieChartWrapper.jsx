import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

/**
 * Tier 3 Fix #19: Isolated Recharts wrapper loaded via React.lazy().
 * This keeps the ~40KB Recharts chunk out of the initial bundle.
 */
function PieChartWrapper({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} dataKey="value" cx="50%" cy="50%" innerRadius={22} outerRadius={34} strokeWidth={2} stroke="hsl(var(--card))">
          {data.map(d => <Cell key={d.name} fill={d.fill} />)}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}

export default PieChartWrapper;
