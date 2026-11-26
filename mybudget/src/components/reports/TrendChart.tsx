"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const data = [
  { month:"Jun", income:5420, expenses:4080, savings:1340 },
  { month:"Jul", income:5420, expenses:4410, savings:1010 },
  { month:"Aug", income:5610, expenses:3640, savings:1970 },
  { month:"Sep", income:5610, expenses:4130, savings:1480 },
  { month:"Oct", income:5730, expenses:3434, savings:2296 },
  { month:"Nov", income:5870, expenses:3412, savings:2458 },
];

export function TrendChart() {
  return <div className="h-72 w-full"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data} margin={{top:10,right:4,left:-20,bottom:0}}><XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={11} /><YAxis axisLine={false} tickLine={false} fontSize={11} tickFormatter={(value)=>`$${value/1000}k`} /><Tooltip formatter={(value)=>[`$${Number(value).toLocaleString()}`,""]} /><Area type="monotone" dataKey="income" stroke="#3d1f0c" fill="#3d1f0c" fillOpacity={0.08} strokeWidth={2} /><Area type="monotone" dataKey="expenses" stroke="#b85f24" fill="#de7b33" fillOpacity={0.18} strokeWidth={2} /><Area type="monotone" dataKey="savings" stroke="#7a8462" fill="#7a8462" fillOpacity={0.12} strokeWidth={2} /></AreaChart></ResponsiveContainer></div>;
}
