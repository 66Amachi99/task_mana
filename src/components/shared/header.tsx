'use client';

import React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Container } from './container';
import { HeaderAuthButton } from './header_auth_button';
import { useUser, ROLE_FILTERS } from '../../hooks/use-roles';
import Link from 'next/link';
import { ChevronDown, Menu, X, Camera, Video, PenTool, Layout } from 'lucide-react';

interface Props {
    className?: string;
    selectedTaskFilter: string | null;
    onTaskFilterChange: (filter: string | null) => void;
    viewMode?: 'all' | 'posts' | 'tasks';
    onViewModeChange?: (mode: 'all' | 'posts' | 'tasks') => void;
}

const roleIcons: Record<string, React.ReactNode> = {
  'smm': <Video className="w-4 h-4" />,
  'photographer': <Camera className="w-4 h-4" />,
  'designer': <PenTool className="w-4 h-4" />,
};

export const Header: React.FC<Props> = ({ 
  className, 
  selectedTaskFilter, 
  onTaskFilterChange,
  viewMode = 'all',
  onViewModeChange
}) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isViewModeDropdownOpen, setIsViewModeDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const viewModeDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
            if (viewModeDropdownRef.current && !viewModeDropdownRef.current.contains(event.target as Node)) {
                setIsViewModeDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleFilterSelect = (filterId: string | null) => {
        onTaskFilterChange(filterId);
        setIsDropdownOpen(false);
        setIsMobileMenuOpen(false);
    };

    const handleViewModeSelect = (mode: 'all' | 'posts' | 'tasks') => {
        if (onViewModeChange) {
            onViewModeChange(mode);
        }
        setIsViewModeDropdownOpen(false);
        setIsMobileMenuOpen(false);
    };

    const clearFilter = () => {
        onTaskFilterChange(null);
        setIsDropdownOpen(false);
        setIsMobileMenuOpen(false);
    };

    const selectedFilterLabel = selectedTaskFilter 
        ? ROLE_FILTERS.find(f => f.id === selectedTaskFilter)?.label 
        : null;

    const getViewModeLabel = (mode: 'all' | 'posts' | 'tasks') => {
        switch (mode) {
            case 'posts': return 'Только посты';
            case 'tasks': return 'Только задачи';
            default: return 'Все';
        }
    };

    return (
        <header className={`${className} sticky top-0 z-40 bg-white border-b shadow-sm`}>
            <Container className='flex items-center justify-between py-3 md:py-4 px-3 md:px-4'>
                <div className='flex items-center gap-2 md:gap-6'>
                    <div className='hidden md:flex gap-1 bg-slate-100 p-1 rounded-2xl'>
                        <div className='flex items-center h-11'>
                            <Link href="/" className='flex items-center font-bold h-full rounded-2xl px-5 hover:bg-white hover:shadow-sm transition-all text-sm'>
                                Посты и задачи
                            </Link>
                            <Link href="/calendar" className='flex items-center font-bold h-full rounded-2xl px-5 hover:bg-white hover:shadow-sm transition-all text-sm'>
                                Календарь
                            </Link>
                        </div>
                    </div>

                    <div className='md:hidden'>
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className='p-2 hover:bg-slate-100 rounded-lg transition-colors'
                        >
                            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>

                    {onViewModeChange && (
                        <div className="relative hidden md:block" ref={viewModeDropdownRef}>
                            <button
                                onClick={() => setIsViewModeDropdownOpen(!isViewModeDropdownOpen)}
                                className="flex items-center gap-2 h-13 px-5 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-colors font-bold text-sm cursor-pointer"
                            >
                                <Layout className="w-4 h-4" />
                                <span className="max-w-37.5 truncate">
                                    {getViewModeLabel(viewMode)}
                                </span>
                                <ChevronDown className={`w-4 h-4 transition-transform ${isViewModeDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isViewModeDropdownOpen && (
                                <div className="absolute top-full left-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                                    <button
                                        onClick={() => handleViewModeSelect('all')}
                                        className={`w-full text-left px-4 py-2 cursor-pointer hover:bg-gray-100 transition-colors text-sm ${
                                            viewMode === 'all' ? 'bg-blue-50 text-blue-600 font-medium' : ''
                                        }`}
                                    >
                                        Все
                                    </button>
                                    <button
                                        onClick={() => handleViewModeSelect('posts')}
                                        className={`w-full text-left px-4 py-2 cursor-pointer hover:bg-gray-100 transition-colors text-sm ${
                                            viewMode === 'posts' ? 'bg-blue-50 text-blue-600 font-medium' : ''
                                        }`}
                                    >
                                        Только посты
                                    </button>
                                    <button
                                        onClick={() => handleViewModeSelect('tasks')}
                                        className={`w-full text-left px-4 py-2 cursor-pointer hover:bg-gray-100 transition-colors text-sm ${
                                            viewMode === 'tasks' ? 'bg-blue-50 text-blue-600 font-medium' : ''
                                        }`}
                                    >
                                        Только задачи
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {viewMode !== 'tasks' && (
                        <div className="relative hidden md:block" ref={dropdownRef}>
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center gap-2 h-13 px-5 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-colors font-bold text-sm cursor-pointer"
                            >
                                <span className="max-w-37.5 truncate">
                                    {selectedFilterLabel 
                                        ? `Роль: ${selectedFilterLabel}` 
                                        : 'Все посты'}
                                </span>
                                <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isDropdownOpen && (
                                <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50">
                                    <button
                                        onClick={clearFilter}
                                        className={`w-full text-left px-4 py-2.5 cursor-pointer hover:bg-gray-100 transition-colors text-sm font-medium ${
                                            !selectedTaskFilter ? 'bg-blue-50 text-blue-600' : ''
                                        }`}
                                    >
                                        Все посты
                                    </button>
                                    
                                    <div className="h-px bg-gray-200 my-2"></div>
                                    
                                    {ROLE_FILTERS.map((role, index) => (
                                        <div key={role.id}>
                                            <button
                                                onClick={() => handleFilterSelect(role.id)}
                                                className={`w-full text-left px-4 py-2.5 cursor-pointer hover:bg-gray-100 transition-colors ${
                                                    selectedTaskFilter === role.id ? 'bg-blue-50 text-blue-600 font-medium' : ''
                                                }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="text-gray-500">
                                                        {roleIcons[role.id]}
                                                    </span>
                                                    <span className="text-sm font-medium">{role.label}</span>
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1 ml-6">
                                                    {role.tasks.map(t => t.label).join(' • ')}
                                                </div>
                                            </button>
                                            {index < ROLE_FILTERS.length - 1 && (
                                                <div className="h-px bg-gray-100 my-1"></div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <HeaderAuthButton />

                {isMobileMenuOpen && (
                    <div className="fixed inset-0 top-14.25 bg-white z-30 md:hidden overflow-y-auto">
                        <div className="p-4 border-t">
                            <nav className="flex flex-col gap-2">
                                <Link 
                                    href="/" 
                                    className="py-3 px-4 hover:bg-slate-100 rounded-lg font-bold"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Посты и задачи
                                </Link>
                                <Link 
                                    href="/calendar" 
                                    className="py-3 px-4 hover:bg-slate-100 rounded-lg font-bold"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Календарь
                                </Link>
                                
                                <div className="h-px bg-gray-200 my-2"></div>
                                
                                {onViewModeChange && (
                                    <>
                                        <div className="py-2 px-4 font-bold text-gray-700">Показать:</div>
                                        <button
                                            onClick={() => handleViewModeSelect('all')}
                                            className={`py-3 px-4 text-left hover:bg-slate-100 rounded-lg ${
                                                viewMode === 'all' ? 'bg-blue-50 text-blue-600 font-bold' : ''
                                            }`}
                                        >
                                            Все
                                        </button>
                                        <button
                                            onClick={() => handleViewModeSelect('posts')}
                                            className={`py-3 px-4 text-left hover:bg-slate-100 rounded-lg ${
                                                viewMode === 'posts' ? 'bg-blue-50 text-blue-600 font-bold' : ''
                                            }`}
                                        >
                                            Только посты
                                        </button>
                                        <button
                                            onClick={() => handleViewModeSelect('tasks')}
                                            className={`py-3 px-4 text-left hover:bg-slate-100 rounded-lg ${
                                                viewMode === 'tasks' ? 'bg-blue-50 text-blue-600 font-bold' : ''
                                            }`}
                                        >
                                            Только задачи
                                        </button>
                                    </>
                                )}
                                
                                {viewMode !== 'tasks' && (
                                    <>
                                        <div className="h-px bg-gray-200 my-2"></div>
                                        <div className="py-2 px-4 font-bold text-gray-700">Фильтр по ролям:</div>
                                        
                                        <button
                                            onClick={clearFilter}
                                            className={`py-3 px-4 text-left hover:bg-slate-100 rounded-lg ${
                                                !selectedTaskFilter ? 'bg-blue-50 text-blue-600 font-bold' : ''
                                            }`}
                                        >
                                            Все посты
                                        </button>
                                        
                                        {ROLE_FILTERS.map(role => (
                                            <button
                                                key={role.id}
                                                onClick={() => handleFilterSelect(role.id)}
                                                className={`py-3 px-4 text-left hover:bg-slate-100 rounded-lg ${
                                                    selectedTaskFilter === role.id ? 'bg-blue-50 text-blue-600 font-bold' : ''
                                                }`}
                                            >
                                                <div className="flex items-center gap-2 font-medium">
                                                    <span className="text-gray-500">
                                                        {roleIcons[role.id]}
                                                    </span>
                                                    {role.label}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1 ml-6">
                                                    {role.tasks.map(t => t.label).join(' • ')}
                                                </div>
                                            </button>
                                        ))}
                                    </>
                                )}
                            </nav>
                        </div>
                    </div>
                )}
            </Container>
        </header>
    );
};