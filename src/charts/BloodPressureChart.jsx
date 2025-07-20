import React, { useState, useRef } from "react";
import { IoFlagSharp } from "react-icons/io5";
import { Tooltip as TooltipProvider } from "react-tooltip";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const BloodPressureChart = ({ patient = [], selectedOption }) => {
  const chartRef = useRef(null);
  const [hoveredBar, setHoveredBar] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const formatDateToShort = (dateStr) => {
    const date = new Date(dateStr);
    if (isNaN(date)) return "--";
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
  };

  const calculateYAxisDomain = (data) => {
    const values = data.map((item) => item.value).filter((val) => val !== null);
    if (values.length === 0) return [0, 100]; // Default range if no data

    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    // Calculate padding (10% of the range or fixed amount for small ranges)
    const range = maxValue - minValue;
    const padding = Math.max(range * 0.1, 5); // Use at least 5 units padding

    // For specific measurement ranges
    if (selectedOption === "diastolic") {
      return [
        Math.max(50, Math.floor(minValue - padding)),
        Math.min(140, Math.ceil(maxValue + padding)),
      ];
    } else if (selectedOption === "systolic") {
      return [
        Math.max(80, Math.floor(minValue - padding)),
        Math.min(200, Math.ceil(maxValue + padding)),
      ];
    } else if (selectedOption === "heart_rate") {
      return [
        Math.max(40, Math.floor(minValue - padding)),
        Math.min(120, Math.ceil(maxValue + padding)),
      ];
    }

    return [Math.floor(minValue - padding), Math.ceil(maxValue + padding)];
  };

  const isAbnormalValue = (value) => {
    if (value === null || value === undefined) return false;
    
    switch (selectedOption) {
      case "systolic":
        return value >= 140 || value < 90;
      case "diastolic":
        return value >= 90 || value < 60;
      case "heart_rate":
        return value < 60 || value > 100;
      default:
        return false;
    }
  };

  const getAbnormalMessage = (value) => {
    switch (selectedOption) {
      case "systolic":
        if (value >= 140) return "Systolic hypertension (≥140 mmHg)";
        if (value < 90) return "Systolic hypotension (<90 mmHg)";
        break;
      case "diastolic":
        if (value >= 90) return "Diastolic hypertension (≥90 mmHg)";
        if (value < 60) return "Diastolic hypotension (<60 mmHg)";
        break;
      case "heart_rate":
        if (value < 60) return "Bradycardia (<60 bpm)";
        if (value > 100) return "Tachycardia (>100 bpm)";
        break;
      default:
        return "";
    }
    return "";
  };

  const normalizeLabData = (data) => {
    const formatted = data
      .map((entry) => ({
        date: formatDateToShort(entry.date),
        rawDate: new Date(entry.date),
        value:
          entry[selectedOption] !== undefined && entry[selectedOption] !== null
            ? Number(entry[selectedOption])
            : null,
        isAbnormal: isAbnormalValue(entry[selectedOption]),
        abnormalMessage: getAbnormalMessage(entry[selectedOption]),
      }))
      .sort((a, b) => a.rawDate - b.rawDate);

    // Strip rawDate for recharts
    const cleaned = formatted.map(({ rawDate, ...rest }) => rest);

    // Pad with nulls if less than 5
    while (cleaned.length < 5) {
      cleaned.push({ date: "--", value: null, isAbnormal: false });
    }

    return cleaned.slice(0, 5);
  };

  const normalizedData = normalizeLabData(patient);
  const yAxisDomain = calculateYAxisDomain(normalizedData);

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
            {data.isAbnormal && (
              <IoFlagSharp
                style={{
                  marginLeft: "5px",
                  marginBottom: "-2px",
                }}
                data-tooltip-id="my-lab-tooltip"
                data-tooltip-content={data.abnormalMessage}
                color="red"
              />
            )}
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
      <TooltipProvider id="my-lab-tooltip" style={{ fontSize: ".8em", zIndex: "9999" }} />
      <ResponsiveContainer>
        <AreaChart
          data={normalizedData}
          margin={{ left: -30 }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            <linearGradient id="weight" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#66BB6A" stopOpacity={0.6} />
              <stop offset="95%" stopColor="#66BB6A" stopOpacity={0.3} />
            </linearGradient>
          </defs>
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
                  x={x + (isFirst ? 20 : 0)}
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
            domain={yAxisDomain}
            axisLine={false}
            tickLine={false}
            fontSize=".8em"
            tickMargin={5}
            allowDecimals={true}
          />
          <Area
            dataKey="value"
            type={"monotone"}
            stroke="#66BB6A"
            fill="url(#weight)"
            strokeWidth={2}
            fillOpacity={0.2}
          />
        </AreaChart>
      </ResponsiveContainer>
      <CustomTooltip data={hoveredBar} position={tooltipPos} />
    </div>
  );
};

export default BloodPressureChart;