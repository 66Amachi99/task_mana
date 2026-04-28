'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LabelList
} from 'recharts';
import { Layers, CheckSquare, MessageSquare, AlertTriangle, Users, BarChart3, TrendingUp, Briefcase } from 'lucide-react';
import { Loading } from '@/components/ui/loading/loading';
import styles from './StatsPage.module.css';

const THEME_COLORS = [
  { fill: '#41A5F340', stroke: '#41A5F3' },
  { fill: '#48C88440', stroke: '#48C884' },
  { fill: '#AB48BF40', stroke: '#AB48BF' },
  { fill: '#F7ADC440', stroke: '#F7ADC4' },
  { fill: '#FE4D3D40', stroke: '#FE4D3D' },
  { fill: '#44962740', stroke: '#449627' },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    const color = data.payload?.stroke || data.stroke || data.fill || '#41A5F3';
    const title = data.payload?.name || label || 'Данные';
    const metricName = data.name || 'Значение';

    return (
      <div className={styles.customTooltip}>
        <p className={styles.tooltipLabel}>{title}</p>
        <div className={styles.tooltipDataRow}>
          <span className={styles.tooltipMetricName}>{metricName}:</span>
          <span className={styles.tooltipValue} style={{ color: color.length > 7 ? color.substring(0, 7) : color }}>
            {data.value}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export default function StatsPage() {
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('week');

  const { data, isLoading } = useQuery({
    queryKey: ['global-stats', period],
    queryFn: () => fetch(`/api/stats?period=${period}`).then(res => res.json()),
    refetchInterval: 60000
  });

  const sortedTeam = useMemo(() => {
    if (!data?.team) return [];
    return [...data.team]
      .map(u => ({ ...u, total: (u.posts || 0) + (u.tasks || 0) }))
      .sort((a, b) => b.total - a.total);
  }, [data?.team]);

  const maxProjectCount = useMemo(() => {
    if (!data?.tags || data.tags.length === 0) return 0;
    return Math.max(...data.tags.map((t: any) => t.count));
  }, [data?.tags]);

  // ПРОВЕРКИ НА ПУСТОТУ
  const isPlatformEmpty = useMemo(() => {
    if (!data?.platforms || !Array.isArray(data.platforms)) return true;
    return data.platforms.every((p: any) => p.value === 0);
  }, [data?.platforms]);

  const isComplexityEmpty = useMemo(() => {
    if (!data?.complexity || !Array.isArray(data.complexity)) return true;
    return data.complexity.every((c: any) => c.value === 0);
  }, [data?.complexity]);

  const isProjectsEmpty = useMemo(() => {
    return !data?.tags || data.tags.length === 0;
  }, [data?.tags]);

  const platformData = useMemo(() => {
    if (isPlatformEmpty) return [{ name: 'Нет данных', value: 1 }];
    return data.platforms;
  }, [data?.platforms, isPlatformEmpty]);

  if (isLoading || !data) return <Loading text='Загрузка...'/>;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Статистика</h1>
          <div className={styles.filterGroup}>
            {(['week', 'month', 'all'] as const).map((p) => (
              <button key={p} className={`${styles.filterButton} ${period === p ? styles.filterButtonActive : ''}`} onClick={() => setPeriod(p)}>
                {p === 'week' ? 'Неделя' : p === 'month' ? 'Месяц' : 'Все время'}
              </button>
            ))}
          </div>
        </header>

        <div className={styles.mainLayout}>
          <div className={styles.leftColumn}>
            <div className={`${styles.statCard} ${styles.areaPie}`}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Охват площадок</h3>
                <BarChart3 size={32} color="#41A5F3" />
              </div>
              <div className={styles.chartWrapper}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={platformData} innerRadius="60%" outerRadius="90%" paddingAngle={5} dataKey="value" nameKey="name" isAnimationActive={true} stroke="none">
                      {isPlatformEmpty ? (
                        <Cell fill="rgba(255,255,255,0.05)" />
                      ) : (
                        platformData.map((entry: any, index: number) => (
                          <Cell key={`cell-pie-${index}`} fill={THEME_COLORS[index % THEME_COLORS.length].fill} stroke={THEME_COLORS[index % THEME_COLORS.length].stroke} strokeWidth={2} />
                        ))
                      )}
                    </Pie>
                    {!isPlatformEmpty && <Tooltip content={<CustomTooltip />} cursor={false} />}
                    <Legend verticalAlign="bottom" height={36} formatter={(value) => <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14pt' }}>{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className={`${styles.statCard} ${styles.areaTeam}`}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Нагрузка на команду</h3>
                <Users size={32} color="#AB48BF" />
              </div>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr><th>Сотрудник</th><th>Посты</th><th>Задачи</th><th>Всего</th></tr>
                  </thead>
                  <tbody>
                    {sortedTeam.map((u: any) => (
                      <tr key={u.login}>
                        <td className={styles.userNameInTable}>{u.login}</td>
                        <td>{u.posts}</td>
                        <td>{u.tasks}</td>
                        <td style={{ fontWeight: 800, color: '#41A5F3' }}>{u.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className={styles.rightContent}>
            <div className={styles.topRightSection}>
              <div className={styles.pulseGrid}>
                <PulseCard icon={Layers} label="Посты" value={data.pulse.activePosts} color="#48C884" />
                <PulseCard icon={CheckSquare} label="Задачи" value={data.pulse.activeTasks} color="#41A5F3" />
                <PulseCard icon={MessageSquare} label="Правки" value={data.pulse.totalComments} color="#AB48BF" />
                <PulseCard icon={AlertTriangle} label="Дедлайны" value={data.pulse.overduePosts} color="#FE4D3D" />
              </div>

              <div className={`${styles.statCard} ${styles.areaFriction}`}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>Индекс правок</h3>
                  <TrendingUp size={32} color="#AB48BF" />
                </div>
                <div className={styles.chartWrapper}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.friction} margin={{ top: 30, right: 20, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorFriction" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#AB48BF" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#AB48BF" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="name" padding={{ left: 10, right: 0 }} tickMargin={10} axisLine={false} tickLine={false} tick={{fill: 'rgba(255,255,255,0.3)', fontSize: '14pt'}} />
                      <YAxis axisLine={false} allowDecimals={false} tickLine={false} tick={{fill: 'rgba(255,255,255,0.5)', fontSize: '14pt'}} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="value" name="Правки" stroke="#AB48BF" strokeWidth={3} fillOpacity={1} fill="url(#colorFriction)">
                        <LabelList dataKey="value" position="top" offset={15} fill="#F7ADC4" fontSize="14pt" fontWeight={400} />
                      </Area>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className={styles.bottomRightSection}>
              <div className={`${styles.statCard} ${styles.areaComplexity}`}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>Количество контента</h3>
                  <BarChart3 size={32} color="#449627" />
                </div>
                <div className={styles.chartWrapper}>
                  {isComplexityEmpty ? (
                    <div className={styles.noDataOverlay}>Нет данных</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.complexity} layout="vertical" margin={{ left: 20, right: 60, top: 10, bottom: 10 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" interval={0} axisLine={false} tickLine={false} tick={{fill: '#fff', fontSize: '14pt'}} width={120} />
                        <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
                        <Bar dataKey="value" name="Постов" radius={[0, 10, 10, 0]}>
                          <LabelList dataKey="value" position="right" fill="#fff" fontSize="14pt" fontWeight={400} offset={10} />
                          {data.complexity.map((entry: any, index: number) => (
                            <Cell key={`cell-bar-${index}`} fill={THEME_COLORS[index % THEME_COLORS.length].fill} stroke={THEME_COLORS[index % THEME_COLORS.length].stroke} strokeWidth={2} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className={`${styles.statCard} ${styles.areaEmpty}`}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>Топ проектов</h3>
                  <Briefcase size={32} color="#F7ADC4" />
                </div>
                <div className={`${styles.projectGrid} no-scrollbar`}>
                  {isProjectsEmpty ? (
                    <div className={styles.noDataOverlayFull}>Нет активных проектов</div>
                  ) : (
                    data.tags.map((tag: any) => (
                      <div key={tag.name} className={styles.projectCard}>
                        <div className={styles.projectHeader}>
                          <span className={styles.projectName}>{tag.name}</span>
                          <span className={styles.projectCount}>{tag.count}</span>
                        </div>
                        <div className={styles.projectBarTrack}>
                          <div className={styles.projectBarFill} style={{ width: `${(tag.count / maxProjectCount) * 100}%`, backgroundColor: tag.color, border: `1px solid ${tag.color.replace('40', 'ff')}` }} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PulseCard({ icon: Icon, label, value, color }: any) {
  return (
    <div className={styles.pulseCardMini} style={{ borderLeft: `3px solid ${color}` }}>
      <div className={styles.pulseCardLeft}>
        <Icon size={26} color={color} strokeWidth={2.5} />
        <div className={styles.pulseLabel}>{label}</div>
      </div>
      <div className={styles.pulseValue} style={{color: color}}>{value}</div>
    </div>
  );
}