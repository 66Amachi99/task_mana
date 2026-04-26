'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { Layers, CheckSquare, MessageSquare, AlertTriangle, Users, BarChart3, TrendingUp, Briefcase } from 'lucide-react';
import styles from './StatsPage.module.css';
import { ApexOptions } from 'apexcharts';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });
const COLORS = ['#41A5F3', '#48C884', '#AB48BF', '#F7ADC4', '#FE4D3D', '#449627'];

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
      .map(u => ({ ...u, total: u.posts + u.tasks }))
      .sort((a, b) => b.total - a.total);
  }, [data?.team]);

  const maxProjectCount = useMemo(() => {
    if (!data?.tags || data.tags.length === 0) return 0;
    return Math.max(...data.tags.map((t: any) => t.count));
  }, [data?.tags]);

  if (isLoading || !data) return <div className={styles.loading}><div className={styles.spinner} /></div>;

  const complexityOptions: ApexOptions = {
    chart: { toolbar: { show: false }, background: 'transparent' },
    theme: { mode: 'dark' },
    colors: COLORS,
    plotOptions: { bar: { horizontal: true, borderRadius: 10, distributed: true, barHeight: '55%' } },
    grid: { show: false },
    xaxis: { categories: ['Видео', 'SMM Видео', 'Обложки', 'Карточки', 'Галереи'], labels: { show: false }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { show: true, style: { fontSize: '14pt', colors: '#ffffff' } } },
    dataLabels: { enabled: true, style: { fontSize: '14pt', colors: ['#ffffff'] } },
    legend: { show: false }
  };

  const platformOptions: ApexOptions = {
    labels: ['Telegram', 'VK', 'MAX'],
    colors: COLORS,
    theme: { mode: 'dark' },
    chart: { background: 'transparent' },
    stroke: { show: false },
    legend: { position: 'bottom', fontSize: '14pt', markers: { shape: 'circle' } },
    plotOptions: { pie: { donut: { size: '70%', labels: { show: true, total: { show: true, label: 'Всего', color: '#fff', fontSize: '14pt' }, value: { fontSize: '20pt', color: '#fff' } } } } },
    dataLabels: { enabled: false }
  };

  const frictionOptions: ApexOptions = {
    chart: { toolbar: { show: false }, background: 'transparent' },
    tooltip: { enabled: true, theme: 'dark', shared: true, intersect: false },
    markers: { size: 0, hover: { size: 0 } },
    stroke: { curve: 'smooth', width: 4, colors: ['#AB48BF'] },
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05 } },
    theme: { mode: 'dark' },
    xaxis: { categories: data?.friction?.labels || [], labels: { style: { fontSize: '10pt', colors: 'rgba(255,255,255,0.5)' } }, axisBorder: { show: false } },
    yaxis: { show: true, labels: { style: { fontSize: '14pt', colors: '#ffffff' } } },
    grid: { borderColor: 'rgba(255,255,255,0.05)', xaxis: { lines: { show: true } }, yaxis: { lines: { show: true } } },
    dataLabels: { enabled: true, style: { fontSize: '12pt', colors: ['#AB48BF'] } }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Статистика предприятия</h1>
          <div className={styles.filterGroup}>
            {(['week', 'month', 'all'] as const).map((p) => (
              <button key={p} className={`${styles.filterButton} ${period === p ? styles.filterButtonActive : ''}`} onClick={() => setPeriod(p)}>
                {p === 'week' ? 'Неделя' : p === 'month' ? 'Месяц' : 'Все время'}
              </button>
            ))}
          </div>
        </header>

        <div className={styles.mainLayout}>
            {/* ЛЕВЫЙ СТОЛБЕЦ (1/3) */}
            <div className={styles.leftColumn}>
                <div className={`${styles.statCard} ${styles.areaPie}`}>
                    <div className={styles.cardHeader}>
                        <h3 className={styles.cardTitle}>Охват площадок</h3>
                        <BarChart3 size={32} color="#41A5F3" />
                    </div>
                    <div className={styles.chartWrapper}>
                        <Chart options={platformOptions} series={[data?.platforms?.telegram_published || 0, data?.platforms?.vkontakte_published || 0, data?.platforms?.MAX_published || 0]} type="donut" height="100%" />
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
                                <tr>
                                    <th>Сотрудник</th>
                                    <th>Посты</th>
                                    <th>Задачи</th>
                                    <th>Всего</th>
                                </tr>
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

            {/* ПРАВАЯ ЧАСТЬ (2/3) */}
            <div className={styles.rightContent}>
                <div className={styles.topRightSection}>
                    <div className={styles.pulseGrid}>
                        <PulseCard icon={Layers} label="Посты" value={data.pulse.activePosts} color="#48C884" />
                        <PulseCard icon={CheckSquare} label="Задачи" value={data.pulse.activeTasks} color="#41A5F3" />
                        <PulseCard icon={MessageSquare} label="Правки" value={data.pulse.totalComments} color="#AB48BF" />
                        <PulseCard icon={AlertTriangle} label="Срок" value={data.pulse.overduePosts} color="#FE4D3D" />
                    </div>

                    <div className={`${styles.statCard} ${styles.areaFriction}`}>
                        <div className={styles.cardHeader}>
                            <h3 className={styles.cardTitle}>Индекс правок</h3>
                            <TrendingUp size={32} color="#AB48BF" />
                        </div>
                        <div className={styles.chartWrapper}>
                            <Chart options={frictionOptions} series={[{ name: 'Правки', data: data?.friction?.data || [] }]} type="area" height="100%" />
                        </div>
                    </div>
                </div>

                <div className={styles.bottomRightSection}>
                    <div className={`${styles.statCard} ${styles.areaComplexity}`}>
                        <div className={styles.cardHeader}>
                            <h3 className={styles.cardTitle}>Сложность контента</h3>
                            <BarChart3 size={32} color="#449627" />
                        </div>
                        <div className={styles.chartWrapper}>
                            <Chart options={complexityOptions} series={[{ name: 'Кол-во', data: [data?.complexity?.video || 0, data?.complexity?.mini_video || 0, data?.complexity?.cover || 0, data?.complexity?.cards || 0, data?.complexity?.gallery || 0] }]} type="bar" height="100%" />
                        </div>
                    </div>

                    <div className={`${styles.statCard} ${styles.areaEmpty}`}>
                        <div className={styles.cardHeader}>
                            <h3 className={styles.cardTitle}>Активные проекты</h3>
                            <Briefcase size={32} color="#F7ADC4" />
                        </div>
                        <div className={styles.projectList}>
                          {data?.tags?.map((tag: any) => (
                            <div key={tag.name} className={styles.projectItem}>
                              <div className={styles.projectInfo}>
                                <span className={styles.projectName}>{tag.name}</span>
                                <span className={styles.projectCount}>{tag.count}</span>
                              </div>
                              <div className={styles.progressTrack}>
                                <div 
                                  className={styles.progressBar} 
                                  style={{ 
                                    width: `${(tag.count / maxProjectCount) * 100}%`,
                                    backgroundColor: tag.color 
                                  }} 
                                />
                              </div>
                            </div>
                          ))}
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
    <div className={styles.pulseCardMini}>
      <div className={styles.pulseCardLeft}>
        <Icon size={32} color={color} strokeWidth={2.5} />
        <div className={styles.pulseLabel}>{label}</div>
      </div>
      <div className={styles.pulseValue} style={{color}}>{value}</div>
    </div>
  );
}