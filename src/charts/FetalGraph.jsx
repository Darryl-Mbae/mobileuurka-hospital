import React, { useState, useRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const FetalGraph = ({ patient = [], selectedOption }) => {
  const chartRef = useRef(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const formatWeekLabel = (week) => {
    return `${week}`;
  };

  const normalizeFetalData = (data) => {
    const formatted = data
      .map((entry) => ({
        date: formatWeekLabel(entry.gestationWeek),
        rawWeek: entry.gestationweek,
        value:
          entry[selectedOption] !== undefined && entry[selectedOption] !== null
            ? Number(entry[selectedOption])
            : null,
      }))
      .sort((a, b) => b.rawWeek - a.rawWeek) // Newest to oldest
      .slice(0, 5)
      .reverse(); // Display oldest to newest

    // Pad to 5 entries if less than 5
    while (formatted.length < 5) {
      formatted.push({ date: "--", value: null });
    }

    // Prepend the zero baseline point
    const baseline = { date: "0", value: 0 };
    return [baseline, ...formatted];
  };

  const normalizedData = normalizeFetalData(patient);

  const handleMouseMove = (e) => {
    if (e && e.activePayload && e.activePayload.length > 0) {
      const payload = e.activePayload[0].payload;
      setHoveredPoint(payload);
      setTooltipPos({ 
        x: e.chartX || 0, 
        y: e.chartY || 0 
      });
    } else {
      setHoveredPoint(null);
    }
  };

  const handleMouseLeave = () => setHoveredPoint(null);

  const CustomTooltip = ({ data, position }) => {
    if (!data || data.value === null || data.value === undefined) return null;

    return (
      <div
        style={{
          position: "absolute",
          top: Math.max(0, position.y - 50),
          left: Math.max(0, position.x - 60),
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          color: "white",
          padding: "8px 12px",
          borderRadius: "6px",
          pointerEvents: "none",
          boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.3)",
          fontSize: "0.85em",
          zIndex: 10000,
          whiteSpace: "nowrap",
          textTransform: "capitalize",
          border: "1px solid rgba(255, 255, 255, 0.2)",
        }}
      >
        <div>
          <strong>{selectedOption}: {data.value}</strong>
        </div>
        <div style={{ fontSize: "0.75em", opacity: 0.8 }}>Week {data.date}</div>
      </div>
    );
  };

  return (
    <div
      style={{
        width: "85%",
        height: "68%",
        margin: "0px auto",
        position: "relative",
        paddingTop: 10,
      }}
      ref={chartRef}
    >
      <ResponsiveContainer width="100%" height="90%">
        <LineChart
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
            fontSize=".8em"
            tickMargin={10}
            tick={({ x, y, payload }) => {
              const isFirst = payload.index === 0;
              return (
                <text
                  x={x + (isFirst ? 20 : 0)} // shift first label 10px to right
                  y={y + 10}
                  textAnchor="middle"
                  fill="#666"
                  fontSize="0.8em"
                >
                  {payload.value}
                </text>
              );
            }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            fontSize=".8em"
            tickMargin={5}
            allowDecimals={true}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#ffc187"
            strokeWidth={3}
            dot={{ r: 5, stroke: "#ffc187", strokeWidth: 2, fill: "#fff" }}
            activeDot={{ r: 6 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
      <CustomTooltip data={hoveredPoint} position={tooltipPos} />
    </div>
  );
};

export default FetalGraph;
