
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { DailyNutrition, NutritionLog, NutritionPageData, NutritionStats } from '../types';
import { useTelegram } from '../contexts/TelegramContext';
import { useAppContext } from '../contexts/AppContext';
import { getNutritionPageData, updateNutritionGoals, getNutritionHistory, addNutritionLog, updateNutritionLog, deleteNutritionLog } from '../hooks/api';
import { Plus, Target } from 'lucide-react';
import NutritionCard from '../components/NutritionCard';
import BarChart from '../components/BarChart';
import NutritionEmptyState from '../components/NutritionEmptyState';
import EditGoalsModal from '../components/EditGoalsModal';
import AddMealModal from '../components/AddMealModal';
import NutritionLogCard from '../components/NutritionLogCard';
import Chip from '../components/Chip';
import ConfirmModal from '../components/ConfirmModal';

const NutritionPageSkeleton: React.FC = () => (
    <div className="animate-pulse p-4 sm:p-6">
        <div className="flex justify-between items-center mb-6">
            <div className="h-8 bg-slate-200 rounded-md w-1/2"></div>
            <div className="flex items-center space-x-2">
                 <div className="h-10 w-24 bg-slate-200 rounded-lg"></div>
            </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-slate-200 rounded-2xl"></div>
            ))}
        </div>
        
        <div className="space-y-3 mt-6">
             <div className="h-8 bg-slate-200 rounded-md w-1/3 mb-4"></div>
            <div className="h-24 bg-slate-200 rounded-2xl"></div>
            <div className="h-24 bg-slate-200 rounded-2xl"></div>
        </div>
    </div>
);

type ActiveCard = 'kcal' | 'protein' | 'carbs' | 'fat';
type ChartPeriod = 7 | 30;

const NutritionPage: React.FC = () => {
    const [pageData, setPageData] = useState<NutritionPageData | null>(null);
    const [history, setHistory] = useState<DailyNutrition[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeCard, setActiveCard] = useState<ActiveCard>('kcal');
    const [isChartVisible, setIsChartVisible] = useState(false);
    const [chartPeriod, setChartPeriod] = useState<ChartPeriod>(7);
    const [isGoalsModalOpen, setIsGoalsModalOpen] = useState(false);
    const [isAddMealModalOpen, setIsAddMealModalOpen] = useState(false);
    const [editingLog, setEditingLog] = useState<NutritionLog | null>(null);
    const [logToDelete, setLogToDelete] = useState<NutritionLog | null>(null);

    const { user } = useTelegram();
    const { showToast } = useAppContext();
    const isInitialLoad = useRef(true);

    const fetchData = useCallback(async (isInitial: boolean = false) => {
        if (!user?.id) return;
        try {
            const [data, historyData] = await Promise.all([
                getNutritionPageData(user.id),
                getNutritionHistory(user.id)
            ]);
            setPageData(data);
            setHistory(historyData);
        } catch (error) {
            console.error("Failed to fetch nutrition data", error);
            if (!isInitial && pageData) {
                showToast("Ошибка загрузки данных");
            }
        }
    }, [user, showToast, pageData]);

    useEffect(() => {
        if (user && isInitialLoad.current) {
            isInitialLoad.current = false;
            const loadInitialData = async () => {
                setIsLoading(true);
                await fetchData(true);
                setIsLoading(false);
            };
            loadInitialData();
        }
    }, [user, fetchData]);

    const chartData = useMemo(() => {
        if (!history) return [];
        const nutrientKeyMap: { [K in ActiveCard]: keyof Omit<DailyNutrition, 'date'> } = {
            kcal: 'kcal', protein: 'protein', carbs: 'carbs', fat: 'fat',
        };
        const key = nutrientKeyMap[activeCard];
        const validHistory = history.filter(day => day && typeof day.date !== 'undefined');
        return validHistory.slice(-chartPeriod).map(day => ({
            value: day[key] || 0,
            label: new Date(day.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }).replace(/\.$/, ''),
        }));
    }, [history, activeCard, chartPeriod]);

    const handleCardClick = (card: ActiveCard) => {
        if (activeCard === card) {
            setIsChartVisible(!isChartVisible);
        } else {
            setActiveCard(card);
            setIsChartVisible(true);
        }
    };
    
    const handleSaveGoals = async (newGoals: NutritionStats) => {
        if (!user?.id) return;
        
        const originalData = pageData;
        setIsGoalsModalOpen(false);

        if (originalData) {
            setPageData(prev => prev ? ({ ...prev, stats: { ...prev.stats, ...newGoals } }) : null);
        }

        try {
            await updateNutritionGoals(newGoals, user.id);
            showToast("Цели обновлены!");
            await fetchData();
        } catch (error) {
            console.error("Failed to update goals", error);
            showToast("Ошибка обновления целей");
            if (originalData) {
                setPageData(originalData);
            }
        }
    };


    const handleSaveLog = async (logData: Omit<NutritionLog, 'id' | 'created_at'> | NutritionLog) => {
        if (!user?.id) return;
        setIsAddMealModalOpen(false);
        setEditingLog(null);
        try {
            if ('id' in logData) {
                await updateNutritionLog(logData, user.id);
                showToast("Запись обновлена");
            } else {
                await addNutritionLog(logData, user.id);
                showToast("Прием пищи добавлен");
            }
            await fetchData();
        } catch (error) {
            console.error("Failed to save log", error);
            showToast("Ошибка сохранения записи");
        }
    };

    const handleRequestDelete = (log: NutritionLog) => {
        setLogToDelete(log);
    };

    const handleConfirmDelete = async () => {
        if (!logToDelete || !user?.id) return;
        const id = logToDelete.id;
        const originalData = pageData;
        
        // Close modal and perform optimistic update
        setLogToDelete(null);
        setPageData(p => p ? ({...p, logs: p.logs.filter(l => l.id !== id)}) : null);
        
        try {
            await deleteNutritionLog(id);
            showToast("Запись удалена");
            await fetchData();
        } catch (error) {
            console.error("Failed to delete log", error);
            showToast("Ошибка удаления записи");
            setPageData(originalData);
        }
    };
    
    if (isLoading) {
        return <NutritionPageSkeleton />;
    }

    if (!pageData) {
        const emptyStats: NutritionStats = {
            consumedKcal: 0, dailyGoalKcal: 1800, consumedProtein: 0, proteinGoal: 110,
            consumedCarbs: 0, carbsGoal: 200, consumedFat: 0, fatGoal: 60
        };
        return (
            <div className="p-4 sm:p-6">
                <h1 className="text-3xl font-bold text-slate-900 mb-6">Питание</h1>
                <NutritionEmptyState onSetGoals={() => setIsGoalsModalOpen(true)} />
                <EditGoalsModal 
                    isOpen={isGoalsModalOpen} 
                    onClose={() => setIsGoalsModalOpen(false)} 
                    onSave={handleSaveGoals} 
                    initialGoals={emptyStats} 
                />
            </div>
        );
    }
    
    const { stats, logs } = pageData;
    const validLogs = logs?.filter(log => log && log.id) || [];
    const sortedLogs = [...validLogs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return (
        <div className="p-4 sm:p-6 pb-24">
            <header className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-slate-900">Питание</h1>
                <button onClick={() => setIsGoalsModalOpen(true)} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors flex items-center space-x-2 px-3" aria-label="Редактировать цели">
                    <Target size={20} />
                    <span className="font-semibold text-sm">Цели</span>
                </button>
            </header>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <NutritionCard title="Калории" value={stats.consumedKcal} goal={stats.dailyGoalKcal} unit="ккал" isActive={activeCard === 'kcal'} onClick={() => handleCardClick('kcal')} isChartVisible={isChartVisible} />
                <NutritionCard title="Белки" value={stats.consumedProtein} goal={stats.proteinGoal} unit="г" isActive={activeCard === 'protein'} onClick={() => handleCardClick('protein')} isChartVisible={isChartVisible} />
                <NutritionCard title="Углеводы" value={stats.consumedCarbs} goal={stats.carbsGoal} unit="г" isActive={activeCard === 'carbs'} onClick={() => handleCardClick('carbs')} isChartVisible={isChartVisible} />
                <NutritionCard title="Жиры" value={stats.consumedFat} goal={stats.fatGoal} unit="г" isActive={activeCard === 'fat'} onClick={() => handleCardClick('fat')} isChartVisible={isChartVisible} />
            </div>

            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isChartVisible ? 'max-h-[260px] opacity-100 mb-6' : 'max-h-0 opacity-0'}`}>
                <div className="bg-white p-4 rounded-2xl shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-slate-800">Динамика</h3>
                        <div className="flex items-center space-x-2">
                           <Chip label="7 дней" isActive={chartPeriod === 7} onClick={() => setChartPeriod(7)} compact />
                           <Chip label="30 дней" isActive={chartPeriod === 30} onClick={() => setChartPeriod(30)} compact />
                        </div>
                    </div>
                    {chartData.length > 0 ? (
                        <div className="h-40">
                            <BarChart data={chartData} />
                        </div>
                    ) : (
                        <div className="h-40 flex items-center justify-center text-center text-slate-500 p-4">
                           <p>Пока недостаточно данных для построения графика. История появится здесь после нескольких дней отслеживания.</p>
                        </div>
                    )}
                </div>
            </div>

            <div>
                <h2 className="text-xl font-bold text-slate-800 mb-4">Сегодняшние приемы пищи</h2>
                {sortedLogs.length > 0 ? (
                    <div className="space-y-3">
                        {sortedLogs.map(log => (
                            <NutritionLogCard 
                                key={log.id} 
                                log={log} 
                                onEdit={() => { setEditingLog(log); setIsAddMealModalOpen(true); }}
                                onDelete={() => handleRequestDelete(log)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 bg-white rounded-2xl shadow-sm">
                        <p className="text-slate-500">Записей о приемах пищи за сегодня нет.</p>
                    </div>
                )}
            </div>
            
            <button onClick={() => { setEditingLog(null); setIsAddMealModalOpen(true); }} className="fixed bottom-24 right-5 w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-emerald-600 transition-colors z-30" aria-label="Добавить прием пищи">
                <Plus size={28} />
            </button>
            
            <EditGoalsModal isOpen={isGoalsModalOpen} onClose={() => setIsGoalsModalOpen(false)} onSave={handleSaveGoals} initialGoals={stats} />
            <AddMealModal 
                isOpen={isAddMealModalOpen} 
                onClose={() => { setIsAddMealModalOpen(false); setEditingLog(null); }} 
                onSave={handleSaveLog} 
                initialData={editingLog} 
            />
            <ConfirmModal
                isOpen={!!logToDelete}
                onClose={() => setLogToDelete(null)}
                onConfirm={handleConfirmDelete}
                title="TechnoTestBot"
                message="Удалить эту запись о приеме пищи?"
            />
        </div>
    );
};

export default NutritionPage;
