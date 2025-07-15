"use client"

import type React from "react"

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import { useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, GraduationCap, Clock, TrendingUp } from "lucide-react"

type UserStats = {
  materials: { total: number; summaries: number; tagged: number; words_extracted: number }
  subjects: { topics: number; topics_completed: number }
  study_blocks: { completed: number; skipped: number }
}

/* Custom tooltip */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-lg border bg-background/95 backdrop-blur-sm px-3 py-2 shadow-lg">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-sm font-semibold text-foreground">{payload[0].value.toLocaleString()}</p>
    </div>
  )
}

/* Chart colors */
const COLORS = {
  primary: "hsl(var(--primary))",
  secondary: "hsl(var(--secondary))",
  blue: "#3b82f6",
  green: "#10b981",
  amber: "#f59e0b",
  red: "#ef4444",
  purple: "#8b5cf6",
  teal: "#14b8a6",
}

/* Helper function to build chart data */
const buildChartData = (stats: UserStats) => {
  const materialsData = [
    { name: "Celkom", value: stats.materials.total, fill: COLORS.blue },
    { name: "Súhrny", value: stats.materials.summaries, fill: COLORS.primary },
    { name: "Tagované", value: stats.materials.tagged, fill: COLORS.purple },
    { name: "Slová", value: stats.materials.words_extracted, fill: COLORS.teal },
  ]

  const subjectsData = [
    { name: "Témy", value: stats.subjects.topics, fill: COLORS.green },
    { name: "Dokončené", value: stats.subjects.topics_completed, fill: COLORS.secondary },
  ]

  const blocksData = [
    { name: "Dokončené", value: stats.study_blocks.completed, fill: COLORS.green },
    { name: "Preskočené", value: stats.study_blocks.skipped, fill: COLORS.amber },
  ]

  const progressData = [
    {
      name: "Pokrok",
      completed: stats.subjects.topics_completed,
      remaining: stats.subjects.topics - stats.subjects.topics_completed,
    },
  ]

  return { materialsData, subjectsData, blocksData, progressData }
}

/* Chart Card Component */
const ChartCard = ({
  title,
  icon,
  badge,
  children,
}: {
  title: string
  icon: React.ReactNode
  badge?: string
  children: React.ReactNode
}) => (
  <Card className="border-muted/40 hover:border-primary/40 transition-colors">
    <CardHeader className="pb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">{icon}</div>
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
        {badge && (
          <Badge variant="outline" className="text-xs">
            {badge}
          </Badge>
        )}
      </div>
    </CardHeader>
    <CardContent>
      <div className="h-64">{children}</div>
    </CardContent>
  </Card>
)

export default function StatsCharts({ data }: { data: UserStats }) {
  const { materialsData, subjectsData, blocksData } = useMemo(() => buildChartData(data), [data])

  const completionRate =
    data.subjects.topics > 0 ? Math.round((data.subjects.topics_completed / data.subjects.topics) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Materials Bar Chart */}
      <ChartCard
        title="Študijné Materiály"
        icon={<FileText className="h-5 w-5" />}
        badge={`${data.materials.total} celkom`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={materialsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" opacity={0.2} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {materialsData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Subjects Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartCard title="Pokrok v Témach" icon={<TrendingUp className="h-5 w-5" />} badge={`${completionRate}%`}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={[
                  { name: "Dokončené", value: data.subjects.topics_completed, fill: COLORS.green },
                  {
                    name: "Zostáva",
                    value: data.subjects.topics - data.subjects.topics_completed,
                    fill: "hsl(var(--muted))",
                  },
                ]}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {subjectsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: "12px" }} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Študijné Bloky"
          icon={<Clock className="h-5 w-5" />}
          badge={`${data.study_blocks.completed + data.study_blocks.skipped} celkom`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={blocksData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" opacity={0.2} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {blocksData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Summary Stats */}
      <Card className="border-muted/40">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            Súhrn Pokroku
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <div className="text-2xl font-bold text-blue-600">{data.materials.total}</div>
              <div className="text-sm text-blue-600/80">Materiálov</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
              <div className="text-2xl font-bold text-green-600">{data.subjects.topics}</div>
              <div className="text-sm text-green-600/80">Tém</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20">
              <div className="text-2xl font-bold text-amber-600">{data.study_blocks.completed}</div>
              <div className="text-sm text-amber-600/80">Dokončených</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20">
              <div className="text-2xl font-bold text-purple-600">{completionRate}%</div>
              <div className="text-sm text-purple-600/80">Úspešnosť</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
