'use client';

import { Container } from './container';
import { HeaderAuthButton } from './header_auth_button';
import { useUser } from '../../hooks/use-roles';

interface Props {
    className?: string;
    showMyTasks: boolean;
    onShowMyTasksChange: (show: boolean) => void;
}

export const Header: React.FC<Props> = ({ className, showMyTasks, onShowMyTasksChange }) => {
    const { user, isAdminOrCoordinator, isDesigner, isVideomaker, isSmm } = useUser();

    const handleTaskCheck = () => {
        onShowMyTasksChange(!showMyTasks);
    };

    // Показываем кнопку только для дизайнера, видеомейкера и smm
    const showTasksButton = user && (isDesigner || isVideomaker || isSmm);

    return (
        <header className={`${className} sticky top-0 z-40 bg-white border-b shadow-sm`}>
            <Container className='flex items-center justify-between py-4'>
                <div className='flex items-center space-x-6'>
                    <div className='flex gap-1 bg-slate-100 p-1 rounded-2xl'>
                        <div className='flex items-center'>
                            <a className='flex items-center font-bold h-11 rounded-2xl px-5 hover:bg-white hover:shadow-sm transition-all'>
                                Посты
                            </a>
                            <a className='flex items-center font-bold h-11 rounded-2xl px-5 hover:bg-white hover:shadow-sm transition-all'>
                                Календарь
                            </a>
                            <a className='flex items-center font-bold h-11 rounded-2xl px-5 hover:bg-white hover:shadow-sm transition-all'>
                                Таймлайн
                            </a>
                        </div>
                    </div>
                    
                    {/* Кнопка Мои задачи - только для дизайнера, видеомейкера и smm */}
                    {showTasksButton && (
                        <div className='flex items-center space-x-3'>
                            <a className='flex items-center font-bold h-13 rounded-2xl px-5 bg-slate-100'>
                                Мои задачи
                                <button
                                    onClick={handleTaskCheck}
                                    className={`ml-2 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer ${
                                        showMyTasks
                                            ? 'bg-blue-500 border-blue-500'
                                            : 'bg-white border-gray-300 hover:border-blue-400'
                                    }`}
                                    aria-label={showMyTasks ? 'Снять галочку' : 'Поставить галочку'}
                                >
                                    {showMyTasks && (
                                        <svg 
                                            className="w-5 h-5 text-white" 
                                            fill="none" 
                                            stroke="currentColor" 
                                            viewBox="0 0 24 24" 
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path 
                                                strokeLinecap="round" 
                                                strokeLinejoin="round" 
                                                strokeWidth="3" 
                                                d="M5 13l4 4L19 7"
                                            />
                                        </svg>
                                    )}
                                </button>
                            </a>
                        </div>
                    )}
                </div>

                <HeaderAuthButton />
            </Container>
        </header>
    );
};