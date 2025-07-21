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
      setTooltipPos({
        x: e.chartX || 0,
        y: e.chartY || 0,
      });
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
          top: Math.max(0, position.y - 40), // Position above the point
          left: Math.max(0, position.x - 30), // Center horizontally
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          color: "white",
          padding: "8px 12px",
          borderRadius: "6px",
          pointerEvents: "none",
          boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.3)",
          fontSize: "0.85em",
          zIndex: 10000,
          whiteSpace: "nowrap",
          border: "1px solid rgba(255, 255, 255, 0.2)",
        }}
      >
        <div>
          <strong>{data.weight} kg</strong>
        </div>
        <div style={{ fontSize: "0.75em", opacity: 0.8 }}>{data.date}</div>
      </div>
    );
  };

  return (
    <div style={{ width: "100%", height: "90%", paddingTop: "10px", position: "relative" }} ref={chartRef}>
      <ResponsiveContainer>
        <BarChart
          data={normalizedData}
          margin={{ left: -30 }}
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
          {/* Remove default Tooltip */}
          <Bar
            dataKey="weight"
            fill="#79B49A"
            radius={20}
            // isAnimationActive={false} // optional: avoid animation jitter
          />
        </BarChart>
      </ResponsiveContainer>
      {/* Custom Tooltip */}
      <CustomTooltip data={hoveredBar} position={tooltipPos} />
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
