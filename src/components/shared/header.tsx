'use client';

import { useState, useRef, useEffect } from 'react';
import { Container } from './container';
import { HeaderAuthButton } from './header_auth_button';
import { useUser, AVAILABLE_TASKS } from '../../hooks/use-roles';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';

interface Props {
    className?: string;
    selectedTaskFilter: string | null;
    onTaskFilterChange: (filter: string | null) => void;
}

export const Header: React.FC<Props> = ({ className, selectedTaskFilter, onTaskFilterChange }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleFilterSelect = (filterId: string | null) => {
        onTaskFilterChange(filterId);
        setIsDropdownOpen(false);
    };

    const clearFilter = () => {
        onTaskFilterChange(null);
        setIsDropdownOpen(false);
    };

    const selectedFilterLabel = selectedTaskFilter 
        ? AVAILABLE_TASKS.find(f => f.id === selectedTaskFilter)?.label 
        : null;

    return (
        <header className={`${className} sticky top-0 z-40 bg-white border-b shadow-sm`}>
            <Container className='flex items-center justify-between py-4'>
                <div className='flex items-center space-x-6'>
                    <div className='flex gap-1 bg-slate-100 p-1 rounded-2xl'>
                        <div className='flex items-center h-11'>
                            <Link href="/" className='flex items-center font-bold h-full rounded-2xl px-5 hover:bg-white hover:shadow-sm transition-all'>
                                Посты
                            </Link>
                            <Link href="/calendar" className='flex items-center font-bold h-full rounded-2xl px-5 hover:bg-white hover:shadow-sm transition-all'>
                                Календарь
                            </Link>
                        </div>
                    </div>
                    
                    {/* Выпадающий список с фильтрами - доступен всем */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex items-center gap-2 h-13 px-5 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-colors font-bold text-sm cursor-pointer"
                        >
                            <span>
                                {selectedFilterLabel 
                                    ? `Фильтр: ${selectedFilterLabel}` 
                                    : 'Все посты'}
                            </span>
                            <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isDropdownOpen && (
                            <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                                <button
                                    onClick={clearFilter}
                                    className={`w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors text-sm ${
                                        !selectedTaskFilter ? 'bg-blue-50 text-blue-600 font-medium' : ''
                                    }`}
                                >
                                    Все посты
                                </button>
                                
                                <div className="h-px bg-gray-200 my-1"></div>
                                
                                {AVAILABLE_TASKS.map(filter => (
                                    <button
                                        key={filter.id}
                                        onClick={() => handleFilterSelect(filter.id)}
                                        className={`w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors text-sm cursor-pointer ${
                                            selectedTaskFilter === filter.id ? 'bg-blue-50 text-blue-600 font-medium' : ''
                                        }`}
                                    >
                                        {filter.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <HeaderAuthButton />
            </Container>
        </header>
    );
};