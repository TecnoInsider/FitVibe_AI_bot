import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { WorkoutsData, Workout } from '../types';
import { Plus, Calendar, HeartPulse, Flame } from 'lucide-react';
import AddWorkoutModal from '../components/AddWorkoutModal';
import { useTelegram } from '../contexts/TelegramContext';
import { useAppContext } from '../contexts/AppContext';
import ProgressBar from '../components/ProgressBar';
import { getWorkouts, addWorkout, updateWorkout, deleteWorkout } from '../hooks/api';
import WorkoutsEmptyState from '../components/WorkoutsEmptyState';
import WorkoutCard from '../components/WorkoutCard';
import WorkoutNotesModal from '../components/WorkoutNotesModal';

const WorkoutsSkeleton: React.FC = () => (
    <div className="animate-pulse">
        <div className="h-8 bg-slate-200 rounded-md w-1/2 mb-6"></div>
        <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="h-28 bg-slate-200 rounded-2xl"></div>
            <div className="h-28 bg-slate-200 rounded-2xl"></div>
        </div>
        <div className="h-24 bg-slate-200 rounded-2xl mb-6"></div>
        <div className="h-8 bg-slate-200 rounded-md w-1/3 mb-4"></div>
        <div className="h-40 bg-slate-200 rounded-2xl"></div>
    </div>
);

const getStartOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const start = new Date(d.setDate(diff));
  start.setHours(0, 0, 0, 0);
  return start;
};


const WorkoutsPage: React.FC = () => {
    const [workoutsData, setWorkoutsData] = useState<WorkoutsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
    const [viewingNotesFor, setViewingNotesFor] = useState<Workout | null>(null);

    const { user, hapticFeedback } = useTelegram();
    const { showToast } = useAppContext();
    
    const sliderRef = useRef<HTMLDivElement>(null);
    const weekRefs = useRef<(HTMLDivElement | null)[]>([]);


    const fetchWorkouts = useCallback(async () => {
        if (!user?.id) {
            setIsLoading(false);
            setWorkoutsData(null);
            return;
        }
        try {
            if (!workoutsData) setIsLoading(true);
            const data = await getWorkouts(user.id);
            if (data && data.todayStats && Array.isArray(data.recentWorkouts)) {
                setWorkoutsData(data);
            } else {
                setWorkoutsData(null); 
            }
        } catch (error) {
            console.warn("Failed to fetch workouts, assuming empty state:", error);
            setWorkoutsData(null);
        } finally {
            setIsLoading(false);
        }
    }, [user, workoutsData]);
    
    useEffect(() => {
        if (user) {
            fetchWorkouts();
        }
    }, [user]);

    const { groupedWeeks, currentWeekIndex } = useMemo(() => {
        if (!workoutsData?.recentWorkouts) {
            return { groupedWeeks: [], currentWeekIndex: -1 };
        }

        const weeksMap = new Map<string, { workouts: Workout[]; startDate: Date }>();
        const now = new Date();
        for (let i = 0; i < 4; i++) {
            const weekStartDate = getStartOfWeek(new Date(new Date().setDate(now.getDate() - (i * 7))));
            const weekKey = weekStartDate.toISOString().split('T')[0];
            if (!weeksMap.has(weekKey)) {
                weeksMap.set(weekKey, { workouts: [], startDate: weekStartDate });
            }
        }

        workoutsData.recentWorkouts.forEach(workout => {
            const workoutDate = new Date(workout.date);
            workoutDate.setHours(12, 0, 0, 0); // Normalize time to avoid timezone issues
            const weekStartDate = getStartOfWeek(workoutDate);
            const weekKey = weekStartDate.toISOString().split('T')[0];
            
            if (weeksMap.has(weekKey)) {
                weeksMap.get(weekKey)!.workouts.push(workout);
            }
        });

        const sortedWeeks = Array.from(weeksMap.values()).sort((a, b) => b.startDate.getTime() - a.startDate.getTime());

        const formattedWeeks = sortedWeeks.map(week => {
            const endDate = new Date(week.startDate);
            endDate.setDate(endDate.getDate() + 6);
            const dateRange = `${week.startDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })} - ${endDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}`;
            const sortedWorkouts = week.workouts.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            
            return {
                key: week.startDate.toISOString().split('T')[0],
                dateRange,
                workouts: sortedWorkouts,
            };
        });

        const currentWeekStartDate = getStartOfWeek(new Date());
        const currentWeekKey = currentWeekStartDate.toISOString().split('T')[0];
        const foundIndex = formattedWeeks.findIndex(w => w.key === currentWeekKey);

        return { groupedWeeks: formattedWeeks, currentWeekIndex: foundIndex >= 0 ? foundIndex : 0 };
    }, [workoutsData]);

    const currentWeekWorkouts = useMemo(() => {
        if (currentWeekIndex === -1 || !groupedWeeks[currentWeekIndex]) {
            return [];
        }
        return groupedWeeks[currentWeekIndex].workouts;
    }, [groupedWeeks, currentWeekIndex]);

    const weeklyStats = useMemo(() => {
        return currentWeekWorkouts.reduce((acc, workout) => {
            acc.totalMinutes += workout.minutes;
            acc.totalKcal += workout.kcal;
            return acc;
        }, { totalMinutes: 0, totalKcal: 0 });
    }, [currentWeekWorkouts]);

    useEffect(() => {
        if (isLoading || !sliderRef.current || currentWeekIndex === -1) return;
        
        const currentWeekElement = weekRefs.current[currentWeekIndex];
        if (currentWeekElement) {
             setTimeout(() => {
                if (sliderRef.current) {
                    const scrollLeft = currentWeekElement.offsetLeft - sliderRef.current.offsetLeft;
                    sliderRef.current.scrollTo({ left: scrollLeft, behavior: 'auto' });
                }
            }, 100);
        }
    }, [isLoading, currentWeekIndex]);


    const handleAddWorkout = async (newWorkoutData: Omit<Workout, 'id'>) => {
        if (!user?.id) return;
        setIsAddModalOpen(false);
        const optimisticWorkout: Workout = { ...newWorkoutData, id: `temp-${Date.now()}` };
        
        setWorkoutsData(prev => {
            if (!prev) {
                return {
                    weeklyTarget: 5, doneThisWeek: 1,
                    todayStats: { totalMinutes: optimisticWorkout.minutes, totalKcal: optimisticWorkout.kcal, },
                    recentWorkouts: [optimisticWorkout]
                };
            }
            return { ...prev, recentWorkouts: [optimisticWorkout, ...prev.recentWorkouts], };
        });
        
        try {
            await addWorkout(newWorkoutData, user.id);
            hapticFeedback.notificationOccurred('success');
            showToast("Тренировка добавлена");
            await fetchWorkouts();
        } catch (error) {
            console.error("Failed to add workout", error);
            showToast("Ошибка добавления тренировки");
            fetchWorkouts();
        }
    };

    const handleUpdateWorkout = async (updatedWorkoutData: Workout) => {
        if (!user?.id) return;
        setEditingWorkout(null);
        const originalData = workoutsData;

        setWorkoutsData(prev => prev ? ({ ...prev, recentWorkouts: prev.recentWorkouts.map(w => w.id === updatedWorkoutData.id ? updatedWorkoutData : w) }) : null);

        try {
            await updateWorkout(updatedWorkoutData, user.id);
            showToast("Тренировка обновлена");
            await fetchWorkouts();
        } catch(e) {
            showToast("Ошибка обновления");
            setWorkoutsData(originalData);
        }
    }

    const handleDeleteWorkout = async (id: string) => {
        const originalData = workoutsData;
        setWorkoutsData(prev => prev ? ({ ...prev, recentWorkouts: prev.recentWorkouts.filter(w => w.id !== id) }) : null);
        try {
            const result = await deleteWorkout(id);
            if (result !== null) {
                showToast("Тренировка удалена");
                await fetchWorkouts();
            } else {
                setWorkoutsData(originalData);
            }
        } catch (e) {
            showToast("Ошибка удаления");
            setWorkoutsData(originalData);
        }
    }

    const handleOpenEditModal = (workout: Workout) => setEditingWorkout(workout);
    
    if (isLoading) {
        return <div className="p-4 sm:p-6"><WorkoutsSkeleton /></div>;
    }
    
    if (!workoutsData || workoutsData.recentWorkouts.length === 0) {
        return (
             <div className="p-4 sm:p-6">
                <h1 className="text-3xl font-bold text-slate-900 mb-6">Тренировки</h1>
                <WorkoutsEmptyState onAddFirst={() => setIsAddModalOpen(true)} />
                <AddWorkoutModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSave={handleAddWorkout}/>
            </div>
        );
    }
    
    const { totalMinutes, totalKcal } = workoutsData.todayStats || { totalMinutes: 0, totalKcal: 0 };

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 sm:p-6">
                <header className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-slate-900">Тренировки</h1>
                    <button onClick={() => setIsAddModalOpen(true)} className="p-2 bg-sky-100 text-sky-600 rounded-lg hover:bg-sky-200 transition-colors" aria-label="Добавить тренировку">
                        <Plus size={20} />
                    </button>
                </header>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-2xl shadow-sm flex flex-col justify-center items-center text-center h-28">
                        <HeartPulse className="w-7 h-7 text-sky-500 mb-2" />
                        <p className="text-xl font-bold text-slate-800">{totalMinutes} мин</p>
                        <p className="text-xs text-slate-500">Сегодня</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm flex flex-col justify-center items-center text-center h-28">
                        <Flame className="w-7 h-7 text-orange-500 mb-2" />
                        <p className="text-xl font-bold text-slate-800">{totalKcal}</p>
                        <p className="text-xs text-slate-500">Сегодня</p>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl shadow-sm">
                    <p className="font-bold text-slate-800 mb-2">Прогресс недели</p>
                    <ProgressBar value={workoutsData.doneThisWeek} max={workoutsData.weeklyTarget} label={`${workoutsData.doneThisWeek} из ${workoutsData.weeklyTarget}`} />
                    <div className="flex justify-between items-center mt-3 text-sm text-slate-500">
                        <div className="flex items-center">
                            <HeartPulse size={16} className="mr-1.5 text-sky-500" />
                            <span>{weeklyStats.totalMinutes} мин</span>
                        </div>
                        <div className="flex items-center">
                            <Flame size={16} className="mr-1.5 text-orange-500" />
                            <span>{weeklyStats.totalKcal} ккал</span>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
            <div ref={sliderRef} className="flex-grow flex overflow-x-auto snap-x snap-mandatory scroll-p-4 gap-4 px-4 no-scrollbar">
                {groupedWeeks.map((week, index) => (
                    <div
                        key={week.key}
                        ref={el => { weekRefs.current[index] = el; }}
                        className="flex-shrink-0 w-full snap-center flex flex-col"
                    >
                        <h2 className="text-lg font-bold text-slate-800 mb-4 sticky top-0 bg-slate-50 py-2">{week.dateRange}</h2>
                        <div className="space-y-3">
                            {week.workouts.length > 0 ? (
                                week.workouts.map(w => (
                                    <WorkoutCard 
                                        key={w.id} 
                                        workout={w}
                                        onEdit={() => handleOpenEditModal(w)}
                                        onDelete={() => handleDeleteWorkout(w.id)}
                                        onViewNotes={() => setViewingNotesFor(w)}
                                        showDate={true}
                                    />
                                ))
                            ) : (
                                <div className="text-center py-10 text-slate-500">
                                    На этой неделе тренировок не было
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            
            <AddWorkoutModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSave={handleAddWorkout} />
            <AddWorkoutModal isOpen={!!editingWorkout} onClose={() => setEditingWorkout(null)} onSave={(data) => handleUpdateWorkout({...(data as Workout), id: editingWorkout!.id})} initialData={editingWorkout}/>
            <WorkoutNotesModal isOpen={!!viewingNotesFor} onClose={() => setViewingNotesFor(null)} notes={viewingNotesFor?.notes}/>
        </div>
    );
};

export default WorkoutsPage;