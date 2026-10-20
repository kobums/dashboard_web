import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

// 주별 운동 시간 바 차트 — 운동 페이지와 홈(데스크톱) 공용. 독서 탭은 dataKey·unit·label 로 페이지 차트에 쓴다.

export default function WeeklyChart({
  data,
  dataKey = '분',
  unit = '분',
  label = '운동 시간',
}: {
  data: { name: string; [key: string]: string | number }[]
  dataKey?: string
  unit?: string
  label?: string
}) {
  return (
    <div className="chart-box">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 0, left: -28, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--track)" />
          <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: 'var(--ink-48)', fontSize: 12 }} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: 'var(--ink-48)', fontSize: 12 }} />
          <Tooltip
            cursor={{ fill: 'var(--cursor-fill)' }}
            contentStyle={{ borderRadius: 11, border: '1px solid var(--tooltip-border)', background: 'var(--tooltip-bg)', color: 'var(--ink)', fontFamily: 'inherit', fontSize: 13 }}
            formatter={(value) => [`${value ?? 0}${unit}`, label]}
          />
          <Bar dataKey={dataKey} fill="var(--accent)" radius={[4, 4, 0, 0]} maxBarSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
