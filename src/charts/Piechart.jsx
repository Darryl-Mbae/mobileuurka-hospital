import React from "react";
import {
  PieChart as PieChartImage,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Custom Tooltip
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const { name, value, color } = payload[0].payload;

    return (
      <div className="custom-tooltip">
        <div className="label">
          <div className="dot" style={{ backgroundColor: color }}></div>
          {name}
        </div>
        <div className="values">{`${value}%`}</div>
      </div>
    );
  }
  return null;
};

// Transform real data into chart format
const transformData = (predictionResults) => {
  if (!predictionResults) return [];

  return [
    {
      name: "Current Pregnancy",
      value: predictionResults.cp || 0,
      color: "#6fc996",
    },
    {
      name: "Medical & Surgical",
      value: predictionResults.ms || 0,
      color: "#ffc38f",
    },
    {
      name: "Obstetric History",
      value: predictionResults.oh || 0,
      color: "#fed68e",
    },
    { name: "Risk factor", value: predictionResults.rf || 0, color: "#65b698" },
  ];
};

const PieChart = ({ data }) => {
  const chartData = transformData(data);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChartImage width="100%" height="100%">
        <Pie
          data={chartData}
          dataKey="value"
          innerRadius={"55%"}
          outerRadius={"100%"}
          stroke="none"
          cornerRadius={10}
          paddingAngle={5}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
      </PieChartImage>
    </ResponsiveContainer>
  );
};

export default function Chart({ patient, selectedDate, explanations }) {
  // Find explanation for selected date or use the latest one
  const getExplanationData = () => {
    if (!explanations || explanations.length === 0) return null;
    
    // Convert selectedDate to Date object for comparison
    const selectedDateObj = selectedDate ? new Date(selectedDate) : new Date();
    
    // If selected date is in the future, use the latest explanation
    if (selectedDateObj > new Date()) {
      // Sort by date descending and take the most recent
      const sorted = [...explanations].sort((a, b) => new Date(b.date) - new Date(a.date));
      return sorted[0];
    }
    
    // Find explanation for the exact selected date
    const selectedDateStr = selectedDateObj.toISOString().split('T')[0];
    const exactMatch = explanations
    .filter(exp => exp.date.split('T')[0] === selectedDateStr)
    .at(-1) || null;
  
    
    if (exactMatch) return exactMatch;
    
    // If no exact match, find the closest previous date
    const previousMatches = explanations.filter(exp => 
      new Date(exp.date) <= selectedDateObj
    );
    
    if (previousMatches.length > 0) {
      // Sort by date descending and take the most recent before selected date
      const sorted = previousMatches.sort((a, b) => new Date(b.date) - new Date(a.date));
      return sorted[0];
    }
    
    // If no previous matches, use the earliest available
    const sorted = [...explanations].sort((a, b) => new Date(a.date) - new Date(b.date));
    return sorted[0];
  };

  const explanationData = getExplanationData();

  return (
    <div style={{ width: "100%", height: "80%" }}>
      <PieChart data={explanationData || {
        cp: 0,
        ms: 0,
        oh: 0,
        rf: 0
      }} />
    </div>
  );
}