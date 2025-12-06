
import React from 'react';
import { ResponsiveContainer, LineChart, Line } from 'recharts';

const dummyData = Array.from({ length: 20 }, (_, i) => ({
    value: Math.random() * 100 + i * 2
}));

const ChartSparkline = ({ data = dummyData, isUp }) => {
    // Matched to tailwind.config: neon-green OR red-500 for down (since neon-red wasn't defined, red-500 is good, or we can make it pink/purple)
    // Let's use neon-green (#0aff00) and a bright red (#ff0000) or neon-purple (#bd00ff) for consistency if preferred.
    // The 'StockCard' uses red-500 for down.
    const color = isUp ? '#0aff00' : '#ef4444';

    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
                <Line
                    type="monotone"
                    dataKey="value"
                    stroke={color}
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={true}
                />
            </LineChart>
        </ResponsiveContainer>
    );
};

export default ChartSparkline;
