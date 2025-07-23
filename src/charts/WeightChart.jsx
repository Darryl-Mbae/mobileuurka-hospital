import React, { useState, useRef } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const WeightChart = ({ data }) => {
  const normalizedData = normalizeWeightData(data);
  const chartRef = useRef(null);
  const [hoveredBar, setHoveredBar] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  function formatDateToShort(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
  }

  const handleMouseMove = (e) => {
    if (e && e.activePayload && e.activePayload.length > 0) {
      const payload = e.activePayload[0].payload;
      setHoveredBar(payload);
      
      // Get the chart container bounds for better positioning
      const chartContainer = chartRef.current;
      if (chartContainer) {
        const rect = chartContainer.getBoundingClientRect();
        setTooltipPos({
          x: (e.chartX || 0),
          y: (e.chartY || 0),
        });
      }
    }
  };



  const handleMouseLeave = () => {
    setHoveredBar(null);
  };

  // Custom tooltip component with absolute positioning inside chart container
  const CustomTooltip = ({ data, position }) => {
    if (!data || data.weight === null) return null;

    return (
      <div
        style={{
          position: "absolute",
          top: Math.max(10, position.y - 60), // Position above the point with more space
          left: Math.max(10, Math.min(position.x - 40, window.innerWidth - 120)), // Better horizontal positioning
          backgroundColor: "rgba(0, 0, 0, 0.9)",
          color: "white",
          padding: "10px 14px",
          borderRadius: "8px",
          pointerEvents: "none",
          boxShadow: "0px 6px 20px rgba(0, 0, 0, 0.4)",
          fontSize: "0.9em",
          zIndex: 99999,
          whiteSpace: "nowrap",
          border: "1px solid rgba(255, 255, 255, 0.3)",
          transform: "translateZ(0)", // Force hardware acceleration
          backdropFilter: "blur(4px)",
        }}
      >
        <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
          {data.weight} kg
        </div>
        <div style={{ fontSize: "0.8em", opacity: 0.9 }}>{data.date}</div>
      </div>
    );
  };

  return (
    <div 
      style={{ 
        width: "100%", 
        height: "90%", 
        paddingTop: "10px", 
        position: "relative",
        zIndex:99999,
        overflow: "visible" // Allow tooltip to show outside container
      }} 
      ref={chartRef}
    >
      <ResponsiveContainer>
        <BarChart
          data={normalizedData}
          margin={{ left: -30, top: 20, right: 20, bottom: 5 }} // Add top margin for tooltip space
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            fontSize={".8em"}
            tickMargin={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            fontSize={".8em"}
            tickMargin={5}
          />
          <Bar
            dataKey="weight"
            fill="#79B49A"
            radius={20}
            cursor="pointer"
          />
        </BarChart>
        <CustomTooltip data={hoveredBar} position={tooltipPos} />

      </ResponsiveContainer>
      
      {/* Custom Tooltip */}
    </div>
  );
};

// Pad to 5 entries
function normalizeWeightData(data) {
  const formatted = data.map((entry) => ({
    ...entry,
    date: formatDateToShort(entry.date),
    rawDate: new Date(entry.date),
  }));

  formatted.sort((a, b) => a.rawDate - b.rawDate);

  const cleaned = formatted.map(({ rawDate, ...rest }) => rest);

  while (cleaned.length < 5) {
    cleaned.push({ date: "--", weight: null });
  }

  return cleaned.slice(0, 5);
}

function formatDateToShort(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

export default WeightChart;
