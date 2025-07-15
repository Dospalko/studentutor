"use client"

import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend,
  BarChart, Bar, CartesianGrid
} from "recharts"

type UserStats = {
  materials: { total: number; summaries: number; tagged: number; words_extracted: number }
  subjects:  { topics: number; topics_completed: number }
  study_blocks: { completed: number; skipped: number; }
}

/* 🔸 Recharts očakáva pole – pripravíme jednoduché datasety */
const buildDatasets = (stats: UserStats) => {
  const mat = [
    { name: "Celkom",     value: stats.materials.total },
    { name: "Súhrny",     value: stats.materials.summaries },
    { name: "Tagované",   value: stats.materials.tagged },
  ]
  const subj = [
    { name: "Témy",       value: stats.subjects.topics },
    { name: "Dokončené",  value: stats.subjects.topics_completed },
  ]
  const blocks = [
    { name: "Dokončené",  value: stats.study_blocks.completed },
    { name: "Preskočené", value: stats.study_blocks.skipped },
  ]
  return { mat, subj, blocks }
}

export function StatsCharts({ data }: { data: UserStats }) {
  const { mat, subj, blocks } = buildDatasets(data)

  return (
    <div className="space-y-8">
      {/* --- materials bar --- */}
      <div className="w-full h-56">
        <ResponsiveContainer>
          <BarChart data={mat}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="value" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* --- subjects line --- */}
      <div className="w-full h-56">
        <ResponsiveContainer>
          <LineChart data={subj}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false}/>
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="value" strokeWidth={2} dot={{ r:4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* --- blocks bar --- */}
      <div className="w-full h-56">
        <ResponsiveContainer>
          <BarChart data={blocks}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name"/>
            <YAxis allowDecimals={false}/>
            <Tooltip/>
            <Bar dataKey="value" fillOpacity={0.8} radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
