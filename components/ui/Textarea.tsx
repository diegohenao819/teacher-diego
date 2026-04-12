
import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea: React.FC<TextareaProps> = ({ className = '', ...props }) => {
  return (
    <textarea
      className={`w-full p-3 border border-slate-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400 dark:text-white transition-shadow duration-200 ${className}`}
      {...props}
    />
  );
};

export default Textarea;
