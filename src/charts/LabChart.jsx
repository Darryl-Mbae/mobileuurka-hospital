import React, { useState, useRef } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const LabChart = ({ patient = [], selectedOption }) => {
  const chartRef = useRef(null);
  const [hoveredBar, setHoveredBar] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Format date like "27 Apr"
  const formatDateToShort = (dateStr) => {
    const date = new Date(dateStr);
    if (isNaN(date)) return "--";
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
  };

  // Normalize and prepare chart data, pad to 5 entries
  const normalizeLabData = (data) => {
    const formatted = data
      .map((entry) => ({
        date: formatDateToShort(entry.date),
        rawDate: new Date(entry.date),
        value:
          entry[selectedOption] !== undefined && entry[selectedOption] !== null
            ? Number(entry[selectedOption])
            : null,
      }))
      .sort((a, b) => a.rawDate - b.rawDate);

    // Strip rawDate for recharts
    const cleaned = formatted.map(({ rawDate, ...rest }) => rest);

    // Pad with nulls if less than 5
    while (cleaned.length < 5) {
      cleaned.push({ date: "--", value: null }); // add blanks at the **end**
    }

    return cleaned.slice(0, 5); // take first 5 entries (real data + blanks)
  };

  const normalizedData = normalizeLabData(patient);

  // Handle mouse move & hover tooltip position inside chart container
  const handleMouseMove = (e) => {
    if (e && e.activePayload && e.activePayload.length) {
      const relativeX = e.chartX;
      const relativeY = e.chartY;
      const payload = e.activePayload[0].payload;

      setHoveredBar(payload);
      setTooltipPos({ x: relativeX, y: relativeY });
    } else {
      setHoveredBar(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredBar(null);
  };

  // Custom tooltip styled div absolutely positioned
  const CustomTooltip = ({ data, position }) => {
    if (!data) return null;

    return (
      <div
        style={{
          position: "absolute",
          top: position.y + 10,
          left: position.x - 70,
          backgroundColor: "rgba(0,0,0,0.75)",
          color: "white",
          padding: "8px",
          borderRadius: "5px",
          pointerEvents: "none",
          boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)",
          fontSize: "0.85em",
          zIndex: 1000,
          whiteSpace: "nowrap",
          textTransform: "capitalize",
        }}
      >
        <div>
          <strong>
            {selectedOption}:{" "}
            {data.value !== null && data.value !== undefined
              ? data.value
              : "No data"}
          </strong>
        </div>
        <div style={{ fontSize: "0.75em", opacity: 0.7 }}>{data.date}</div>
      </div>
    );
  };

  return (
    <div
      style={{
        width: "100%",
        height: "90%",
        position: "relative",
        paddingTop: 10,
      }}
      ref={chartRef}
    >
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
            fontSize=".8em"
            tickMargin={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            fontSize=".8em"
            tickMargin={5}
            allowDecimals={true}
          />
          <Bar
            dataKey="value"
            fill="#F8D798"
            radius={10}
            // Optional: customize bar color if value null:
            // fill={({ value }) => (value === null ? '#ccc' : '#79B49A')}
          />
        </BarChart>
      </ResponsiveContainer>
      {/* Custom Tooltip */}
      <CustomTooltip data={hoveredBar} position={tooltipPos} />
    </div>
  );
};

export default LabChart;
