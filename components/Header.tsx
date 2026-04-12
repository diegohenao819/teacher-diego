import React from 'react';
import Button from './ui/Button';
import { PageType } from '../types';

interface HeaderProps {
    onNew: () => void;
    activePage: PageType;
    onPageChange: (page: PageType) => void;
}

const NavButton: React.FC<{
    isActive: boolean;
    onClick: () => void;
    children: React.ReactNode;
}> = ({ isActive, onClick, children }) => {
    const activeClasses = 'bg-brand-light text-brand-primary dark:bg-slate-700 dark:text-white';
    const inactiveClasses = 'text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700/50 dark:hover:text-slate-200';
    return (
        <button
            onClick={onClick}
            className={`px-3 py-2 font-medium text-sm rounded-md transition-colors duration-200 ${isActive ? activeClasses : inactiveClasses}`}
        >
            {children}
        </button>
    );
};


const Header: React.FC<HeaderProps> = ({ onNew, activePage, onPageChange }) => {
    return (
        <header className="bg-white dark:bg-slate-800 shadow-md sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center space-x-4">
                        <h1 className="text-xl sm:text-2xl font-bold text-brand-primary dark:text-indigo-400">
                            Teacher Diego
                        </h1>
                        <nav className="hidden md:flex items-center space-x-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg">
                           <NavButton isActive={activePage === 'introduction'} onClick={() => onPageChange('introduction')}>Introduction</NavButton>
                           <NavButton isActive={activePage === 'body'} onClick={() => onPageChange('body')}>Body</NavButton>
                           <NavButton isActive={activePage === 'counterArgument'} onClick={() => onPageChange('counterArgument')}>Counter-Argument</NavButton>
                           <NavButton isActive={activePage === 'conclusion'} onClick={() => onPageChange('conclusion')}>Conclusion</NavButton>
                        </nav>
                    </div>
                    <div className="flex items-center space-x-2 sm:space-x-4">
                        <Button variant="secondary" onClick={onNew}>New</Button>
                    </div>
                </div>
                 <nav className="md:hidden flex items-center space-x-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg mb-2">
                    <NavButton isActive={activePage === 'introduction'} onClick={() => onPageChange('introduction')}>Introduction</NavButton>
                    <NavButton isActive={activePage === 'body'} onClick={() => onPageChange('body')}>Body</NavButton>
                    <NavButton isActive={activePage === 'counterArgument'} onClick={() => onPageChange('counterArgument')}>Counter-Argument</NavButton>
                    <NavButton isActive={activePage === 'conclusion'} onClick={() => onPageChange('conclusion')}>Conclusion</NavButton>
                </nav>
            </div>
        </header>
    );
};

export default Header;