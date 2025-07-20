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
  if (e && e.activePayload && e.activePayload.length) {
    const containerRect = chartRef.current.getBoundingClientRect();
    const relativeX = e.chartX;
    const relativeY = e.chartY;
    const payload = e.activePayload[0].payload;

    setHoveredBar(payload);
    setTooltipPos({
      x: relativeX,
      y: relativeY,
    });
  } else {
    // Not hovering a bar
    setHoveredBar(null);
  }
};

  // Mouse enter handler to capture hovered bar data & tooltip position
  const handleMouseEnter = (e) => {
    if (e && chartRef.current) {
      const containerRect = chartRef.current.getBoundingClientRect();

      // Mouse coordinates relative to container
      const relativeX = e.chartX;
      const relativeY = e.chartY;

      // Use e.activePayload to get hovered data item
      const payload = e.activePayload?.[0]?.payload;

      if (payload) {
        setHoveredBar(payload);
        setTooltipPos({
          x: relativeX,
          y: relativeY,
        });
      }
    }
  };

  const handleMouseLeave = () => {
    setHoveredBar(null);
  };

  // Custom tooltip component with absolute positioning inside chart container
  const CustomTooltip = ({ data, position }) => {
    if (!data) return null;

    return (
      <div
        style={{
          position: "absolute",
          top: position.y + 10, // offset a bit downward
          left: position.x + 10, // offset a bit rightward
          backgroundColor: "black",
          color: "white",
          padding: "8px",
          borderRadius: "5px",
          pointerEvents: "none",
          boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)",
          fontSize: "0.85em",
          zIndex: 1000,
          whiteSpace: "nowrap",
        }}
      >
        {/* <div>{data.date}</div> */}
        <div>
          <strong>{data.weight !== null ? `${data.weight} kg` : "No data"}</strong>
        </div>
      </div>
    );
  };

  return (
    <div style={{ width: "100%", height: "90%", paddingTop: "10px", position: "relative" }} ref={chartRef}>
      <ResponsiveContainer>
        <BarChart
          data={normalizedData}
          margin={{ left: -30 }}
          onMouseMove={handleMouseEnter}
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
