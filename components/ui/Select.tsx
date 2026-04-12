
import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
}

const Select: React.FC<SelectProps> = ({ children, label, id, className = '', ...props }) => {
    return (
        <div>
            {label && <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mr-2">{label}</label>}
            <select
                id={id}
                className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md ${className}`}
                {...props}
            >
                {children}
            </select>
        </div>
    );
};

export default Select;
