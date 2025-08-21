
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Dhikr, Badge, HistoryLog } from './types';
import { INITIAL_DHIKRS, BADGE_DEFINITIONS } from './constants';
import { SunIcon, MoonIcon, ShareIcon, PlusIcon, FireIcon, AwardIcon, HistoryIcon } from './components/icons';

type Theme = 'light' | 'dark';

const usePersistentState = <T,>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [state, setState] = useState<T>(() => {
    try {
      const storedValue = localStorage.getItem(key);
      return storedValue ? JSON.parse(storedValue) : defaultValue;
    } catch (error) {
      console.error(`Error reading localStorage key “${key}”:`, error);
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error(`Error setting localStorage key “${key}”:`, error);
    }
  }, [key, state]);

  return [state, setState];
};

const generateRandomPastelColor = () => {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 80%)`;
};

const App: React.FC = () => {
    const [theme, setTheme] = usePersistentState<Theme>('sabhati-theme', 'light');
    const [dhikrs, setDhikrs] = usePersistentState<Dhikr[]>('sabhati-dhikrs', []);
    const [activeIndex, setActiveIndex] = usePersistentState<number>('sabhati-activeIndex', 0);
    const [streak, setStreak] = usePersistentState<number>('sabhati-streak', 0);
    const [lastVisit, setLastVisit] = usePersistentState<string | null>('sabhati-lastVisit', null);
    const [badges, setBadges] = usePersistentState<Badge[]>('sabhati-badges', BADGE_DEFINITIONS);
    const [history, setHistory] = usePersistentState<HistoryLog[]>('sabhati-history', []);
    
    const [showAddModal, setShowAddModal] = useState(false);
    const [showBadgesModal, setShowBadgesModal] = useState(false);
    const [newDhikrName, setNewDhikrName] = useState('');
    const [newDhikrTarget, setNewDhikrTarget] = useState(100);

    const activeDhikr = useMemo(() => dhikrs[activeIndex] || dhikrs[0], [dhikrs, activeIndex]);

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove(theme === 'light' ? 'dark' : 'light');
        root.classList.add(theme);
    }, [theme]);
    
    useEffect(() => {
        let didUpdate = false;
        const updatedDhikrs = dhikrs.map(d => {
            let needsUpdate = false;
            const newD = { ...d };
            if (d.dailyCount === undefined) {
                newD.dailyCount = 0;
                needsUpdate = true;
            }
            if (!d.color) {
                newD.color = generateRandomPastelColor();
                needsUpdate = true;
            }
            if(needsUpdate) didUpdate = true;
            return newD;
        });

        if (dhikrs.length === 0) {
            setDhikrs(INITIAL_DHIKRS.map(d => ({
                ...d,
                id: Date.now() + Math.random(),
                color: generateRandomPastelColor()
            })));
        } else if (didUpdate) {
            setDhikrs(updatedDhikrs);
        }

        const today = new Date().toDateString();
        if (lastVisit && lastVisit !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            const yesterdayActivity = dhikrs.filter(d => d.dailyCount > 0);
            if(yesterdayActivity.length > 0) {
                setHistory(prev => [{
                    date: lastVisit,
                    dhikrs: yesterdayActivity.map(d => ({ name: d.name, count: d.dailyCount }))
                }, ...prev]);
            }
            
            if (lastVisit === yesterday.toDateString()) {
                if (yesterdayActivity.length > 0) {
                    setStreak(s => s + 1);
                } else {
                    setStreak(0);
                }
            } else {
                 setStreak(yesterdayActivity.length > 0 ? 1 : 0);
            }

            // Reset daily counts
            setDhikrs(current => current.map(d => ({ ...d, dailyCount: 0 })));
        }
        setLastVisit(today);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const totalLifetimeCount = useMemo(() => dhikrs.reduce((total, d) => total + d.count, 0), [dhikrs]);

    useEffect(() => {
        setBadges(currentBadges => 
            currentBadges.map(badge => {
                if (!badge.unlocked && totalLifetimeCount >= badge.totalDhikrCount) {
                    return { ...badge, unlocked: true, dateUnlocked: new Date().toLocaleDateString('ar-EG') };
                }
                return badge;
            })
        );
    }, [totalLifetimeCount, setBadges]);

    const toggleTheme = useCallback(() => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    }, [setTheme]);

    const incrementCount = useCallback(() => {
        setDhikrs(currentDhikrs => 
            currentDhikrs.map((dhikr, index) => {
                if (index === activeIndex) {
                    return { ...dhikr, count: dhikr.count + 1, dailyCount: dhikr.dailyCount + 1 };
                }
                return dhikr;
            })
        );
        if (navigator.vibrate) navigator.vibrate(50);
    }, [activeIndex, setDhikrs]);

    const handleAddDhikr = (e: React.FormEvent) => {
        e.preventDefault();
        if (newDhikrName.trim() === '') return;
        const newDhikr: Dhikr = {
            id: Date.now(),
            name: newDhikrName,
            count: 0,
            dailyCount: 0,
            target: newDhikrTarget,
            color: generateRandomPastelColor(),
        };
        const newDhikrs = [...dhikrs, newDhikr];
        setDhikrs(newDhikrs);
        setActiveIndex(newDhikrs.length - 1);
        setShowAddModal(false);
        setNewDhikrName('');
        setNewDhikrTarget(100);
    };

    const shareProgress = useCallback(() => {
        const message = `أنجزت ${activeDhikr.dailyCount} تسبيحة من "${activeDhikr.name}" اليوم 🌿. #سبحتي`;
        if (navigator.share) {
            navigator.share({ title: 'إنجازي اليومي في سبحتي', text: message }).catch(console.error);
        } else {
            navigator.clipboard.writeText(message);
            alert('تم نسخ الإنجاز إلى الحافظة!');
        }
    }, [activeDhikr]);

    if (!activeDhikr) {
        return <div className="bg-secondary dark:bg-slate-900 min-h-screen"></div>; // Loading state
    }

    const rosaryRotation = (activeDhikr.dailyCount % 33) * (360 / 33);

    return (
        <div className="flex flex-col min-h-screen text-slate-800 dark:text-slate-200 p-4 transition-colors duration-300 overflow-hidden">
            <header className="flex justify-between items-center w-full max-w-2xl mx-auto z-10">
                <h1 className="text-2xl font-bold text-primary">سبحتي</h1>
                <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
            </header>

            <main className="flex-grow flex flex-col items-center justify-center text-center w-full max-w-lg mx-auto py-8">
                <div 
                    onClick={incrementCount}
                    className="relative w-72 h-72 md:w-80 md:h-80 flex items-center justify-center cursor-pointer select-none"
                    aria-label={`زيادة عداد ${activeDhikr.name}`}
                    role="button"
                >
                    {/* Beads container */}
                    <div className="absolute w-full h-full transition-transform duration-500 ease-out" style={{ transform: `rotate(${rosaryRotation}deg)`}}>
                        {[...Array(33)].map((_, i) => (
                            <div key={i} className="absolute w-full h-full" style={{ transform: `rotate(${i * (360 / 33)}deg)` }}>
                                <div className="absolute top-[-8px] left-1/2 -ml-3 w-6 h-6 bg-secondary-dark dark:bg-slate-700 rounded-full shadow-inner"/>
                            </div>
                        ))}
                    </div>

                    {/* Center button */}
                    <div className="absolute w-[70%] h-[70%] bg-white dark:bg-slate-800 rounded-full shadow-2xl flex flex-col items-center justify-center p-4">
                        <span className="text-5xl md:text-6xl font-bold tabular-nums text-primary-dark dark:text-primary-light">{activeDhikr.dailyCount}</span>
                        <p className="text-slate-500 dark:text-slate-400 mt-1 truncate">{activeDhikr.name}</p>
                    </div>
                </div>
            </main>

            <footer className="w-full max-w-2xl mx-auto pb-4 space-y-6">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg space-y-3">
                    <h3 className="text-lg font-bold mb-2 text-primary dark:text-primary-light">تقدم اليوم</h3>
                    {dhikrs.map((dhikr, index) => (
                        <div key={dhikr.id} onClick={() => setActiveIndex(index)} className={`p-3 rounded-lg cursor-pointer transition-all ${activeIndex === index ? 'bg-primary/10 dark:bg-primary/20 ring-2 ring-primary' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: dhikr.color }}></div>
                                    <span className="font-semibold">{dhikr.name}</span>
                                </div>
                                <span className="font-mono text-slate-500 dark:text-slate-400">{dhikr.dailyCount}/{dhikr.target}</span>
                            </div>
                            <div className="w-full bg-secondary dark:bg-slate-700 rounded-full h-2 mt-2">
                                <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (dhikr.dailyCount/dhikr.target)*100)}%`, backgroundColor: dhikr.color }}></div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-4 gap-2 text-center">
                    <FooterButton icon={<PlusIcon />} label="إضافة" onClick={() => setShowAddModal(true)} />
                    <FooterButton icon={<ShareIcon />} label="مشاركة" onClick={shareProgress} />
                    <FooterButton icon={<AwardIcon />} label="الأوسمة" onClick={() => setShowBadgesModal(true)} value={badges.filter(b=>b.unlocked).length} />
                    <FooterButton icon={<FireIcon />} label="متتالية" onClick={() => {}} value={streak} isStatic={true} />
                </div>
            </footer>
            
            <AddDhikrModal visible={showAddModal} onClose={() => setShowAddModal(false)} onSubmit={handleAddDhikr} name={newDhikrName} setName={setNewDhikrName} target={newDhikrTarget} setTarget={setNewDhikrTarget} />
            <BadgesModal visible={showBadgesModal} onClose={() => setShowBadgesModal(false)} badges={badges} history={history} />
        </div>
    );
}

const ThemeToggle: React.FC<{ theme: Theme, toggleTheme: () => void }> = ({ theme, toggleTheme }) => (
    <button onClick={toggleTheme} className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" aria-label="Toggle theme">
        {theme === 'dark' ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
    </button>
);

const FooterButton: React.FC<{icon: React.ReactNode, label: string, onClick: () => void, value?: number, isStatic?: boolean}> = ({icon, label, onClick, value, isStatic}) => (
    <div className="flex flex-col items-center gap-1">
        <button onClick={onClick} disabled={isStatic} className={`relative w-14 h-14 rounded-2xl flex items-center justify-center transition-colors text-primary-dark dark:text-primary-light ${isStatic ? 'bg-secondary dark:bg-slate-700/50' : 'bg-secondary dark:bg-slate-800 hover:bg-primary/20 dark:hover:bg-primary/20 active:scale-95'}`}>
             <div className="w-6 h-6">{icon}</div>
             {value !== undefined && (
                <span className={`absolute -top-1 -right-1 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center ${isStatic ? 'bg-amber-400 text-white' : 'bg-primary text-white'}`}>
                    {value}
                </span>
             )}
        </button>
        <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
    </div>
);

const AddDhikrModal: React.FC<{visible: boolean, onClose: () => void, onSubmit: (e: React.FormEvent) => void, name: string, setName: (s:string)=>void, target: number, setTarget: (n:number)=>void}> = ({visible, onClose, onSubmit, name, setName, target, setTarget}) => {
    if(!visible) return null;
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4">إضافة ذِكر جديد</h2>
                <form onSubmit={onSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="dhikrName" className="block text-sm font-medium mb-1">اسم الذِكر</label>
                        <input type="text" id="dhikrName" value={name} onChange={e => setName(e.target.value)} placeholder="مثال: أستغفر الله" className="w-full bg-secondary dark:bg-slate-700 border-none rounded-lg p-3 focus:ring-2 focus:ring-primary" required />
                    </div>
                    <div>
                        <label htmlFor="dhikrTarget" className="block text-sm font-medium mb-1">الهدف اليومي</label>
                        <input type="number" id="dhikrTarget" value={target} onChange={e => setTarget(Number(e.target.value))} className="w-full bg-secondary dark:bg-slate-700 border-none rounded-lg p-3 focus:ring-2 focus:ring-primary" min="1" />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">إلغاء</button>
                        <button type="submit" className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors shadow">إضافة</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const BadgesModal: React.FC<{visible: boolean, onClose: () => void, badges: Badge[], history: HistoryLog[]}> = ({visible, onClose, badges, history}) => {
    const [activeTab, setActiveTab] = useState<'badges' | 'history'>('badges');
    if(!visible) return null;
    
    return (
         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xl w-full max-w-sm h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex border-b border-slate-200 dark:border-slate-700 mb-4">
                    <button onClick={() => setActiveTab('badges')} className={`flex-1 py-2 font-semibold ${activeTab === 'badges' ? 'text-primary border-b-2 border-primary' : 'text-slate-500'}`}>الأوسمة</button>
                    <button onClick={() => setActiveTab('history')} className={`flex-1 py-2 font-semibold ${activeTab === 'history' ? 'text-primary border-b-2 border-primary' : 'text-slate-500'}`}>السجل</button>
                </div>
                <div className="flex-grow overflow-y-auto pr-2">
                    {activeTab === 'badges' && (
                        <div className="space-y-3">
                            {badges.map(badge => (
                                <div key={badge.tier} className={`p-4 rounded-lg border-2 ${badge.unlocked ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20' : 'border-dashed border-slate-300 dark:border-slate-600'}`}>
                                    <h3 className={`font-bold text-lg ${badge.unlocked ? 'text-amber-600 dark:text-amber-400' : ''}`}>{badge.tier}</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">الوصول إلى {badge.totalDhikrCount.toLocaleString('ar-EG')} تسبيحة</p>
                                    {badge.unlocked && <p className="text-xs text-slate-400 mt-1">تم الفتح في: {badge.dateUnlocked}</p>}
                                </div>
                            ))}
                        </div>
                    )}
                    {activeTab === 'history' && (
                        <div className="space-y-4">
                            {history.length === 0 ? <p className="text-center text-slate-500 py-8">لا يوجد سجل حتى الآن.</p> :
                            history.map(log => (
                                <div key={log.date}>
                                    <h4 className="font-bold mb-2">{new Date(log.date).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h4>
                                    <ul className="space-y-1 text-sm list-disc list-inside text-slate-600 dark:text-slate-300">
                                        {log.dhikrs.map(d => <li key={d.name}>{d.name}: <span className="font-semibold">{d.count.toLocaleString('ar-EG')}</span></li>)}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                 <div className="flex justify-end pt-4 mt-4 border-t border-slate-200 dark:border-slate-700">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors shadow">إغلاق</button>
                </div>
            </div>
        </div>
    );
};


export default App;
