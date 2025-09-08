import React, { useState, useRef } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

// --- WeightChart (fixed) ---
// Key fixes:
// 1. Fallback to activeCoordinate and activeIndex when activePayload is missing.
// 2. Derive the payload from the chart data (normalizedData[idx]) when Recharts doesn't provide activePayload.
// 3. Compute tooltip position relative to the chart container and clamp it so it doesn't overflow.
// 4. Ignore padded (weight === null) entries so tooltip doesn't show for placeholders.

const WeightChart = ({ data }) => {
  const normalizedData = normalizeWeightData(data);
  const chartRef = useRef(null);
  const [hoveredBar, setHoveredBar] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    if (!e) return;

    // Recharts sometimes doesn't supply activePayload (esp. for placeholder points).
    // Use activeTooltipIndex/activeIndex to find the corresponding data entry.
    const rawIndex = e.activeTooltipIndex ?? e.activeIndex;
    const index = rawIndex != null ? Number(rawIndex) : null;

    // Get payload from event if present, otherwise pull from normalizedData by index
    let payload = null;
    if (e.activePayload && e.activePayload.length > 0) {
      payload = e.activePayload[0].payload;
    } else if (index !== null && Number.isFinite(index) && normalizedData[index]) {
      payload = normalizedData[index];
    }

    // Ignore padded / empty entries
    if (!payload || payload.weight == null) {
      setHoveredBar(null);
      return;
    }

    setHoveredBar(payload);

    // Positioning: prefer chartX/chartY, otherwise use activeCoordinate.x/y
    const rawX = e.chartX ?? (e.activeCoordinate && e.activeCoordinate.x) ?? 0;
    const rawY = e.chartY ?? (e.activeCoordinate && e.activeCoordinate.y) ?? 0;

    // Compute coordinates relative to the chart container (our tooltip is absolutely positioned inside it)
    // chartX/activeCoordinate are usually already relative to the chart, so we can use them directly.
    const container = chartRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();

      // Clamp so tooltip doesn't overflow
      const tooltipApproxWidth = 140; // tweak if your tooltip is wider
      const tooltipApproxHeight = 64;
      const maxX = Math.max(8, rect.width - tooltipApproxWidth - 8);
      const maxY = Math.max(8, rect.height - tooltipApproxHeight - 8);

      setTooltipPos({
        x: Math.max(8, Math.min(rawX - 40, maxX)),
        y: Math.max(8, Math.min(rawY - 60, maxY)),
      });
    } else {
      setTooltipPos({ x: rawX - 40, y: rawY - 60 });
    }
  };

  const handleMouseLeave = () => {
    setHoveredBar(null);
  };

  const CustomTooltip = ({ data, position }) => {
    if (!data || data.weight == null) return null;

    return (
      <div
        style={{
          position: "absolute",
          top: position.y,
          left: position.x,
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
          transform: "translateZ(0)",
          backdropFilter: "blur(4px)",
        }}
      >
        <div style={{ fontWeight: "bold", marginBottom: "4px" }}>{data.weight} kg</div>
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
        zIndex: 99999,
        overflow: "visible",
      }}
      ref={chartRef}
    >
      <ResponsiveContainer>
        <BarChart
          data={normalizedData}
          margin={{ left: -30, top: 20, right: 20, bottom: 5 }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" axisLine={false} tickLine={false} fontSize={".8em"} tickMargin={10} />
          <YAxis axisLine={false} tickLine={false} fontSize={".8em"} tickMargin={5} />
          <Bar dataKey="weight" fill="#79B49A" radius={20} cursor="pointer" />
        </BarChart>
      </ResponsiveContainer>

      {/* custom tooltip placed inside the same container */}
      <CustomTooltip data={hoveredBar} position={tooltipPos} />
    </div>
  );
};

// helpers
function normalizeWeightData(data) {
  const formatted = data.map((entry) => ({
    ...entry,
    date: formatDateToShort(entry.date),
    rawDate: new Date(entry.date),
  }));

  formatted.sort((a, b) => a.rawDate - b.rawDate);

  const cleaned = formatted.map(({ rawDate, ...rest }) => rest);

  // pad the list with placeholders (the tooltip will ignore items with weight === null)
  while (cleaned.length < 5) {
    cleaned.push({ date: "--", weight: null });
  }

  return cleaned.slice(0, 5);
}

function formatDateToShort(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default WeightChart;
