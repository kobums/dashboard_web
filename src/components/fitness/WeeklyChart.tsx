import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

// 주별 운동 시간 바 차트 — 운동 페이지와 홈(데스크톱) 공용.

export default function WeeklyChart({ data }: { data: { name: string; 분: number }[] }) {
  return (
    <div className="chart-box">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 0, left: -28, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--track)" />
          <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#7a7a7a', fontSize: 12 }} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: '#7a7a7a', fontSize: 12 }} />
          <Tooltip
            cursor={{ fill: 'rgba(0,0,0,0.04)' }}
            contentStyle={{ borderRadius: 11, border: '1px solid #e0e0e0', fontFamily: 'inherit', fontSize: 13 }}
            formatter={(value) => [`${value ?? 0}분`, '운동 시간']}
          />
          <Bar dataKey="분" fill="var(--accent)" radius={[4, 4, 0, 0]} maxBarSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
