import React from 'react';
import { ArrowDown, Plus } from 'lucide-react';

interface InsertConnectorProps {
  onInsert: () => void;
}

export const InsertConnector: React.FC<InsertConnectorProps> = ({ onInsert }) => {
  return (
    <div className="group relative flex flex-col items-center py-1 select-none">
      <div className="h-3 w-px bg-slate-300 dark:bg-slate-700" />
      <button
        type="button"
        onClick={onInsert}
        title="Insert block here"
        className="flex h-7 items-center gap-1.5 rounded-md border border-transparent px-2.5 text-xs font-medium text-slate-400 transition-all duration-150 hover:border-slate-300 hover:bg-white hover:text-indigo-600 focus-visible:border-indigo-500 focus-visible:text-indigo-500 focus-visible:outline-none dark:text-slate-500 dark:hover:border-slate-700 dark:hover:bg-slate-900 dark:hover:text-indigo-400"
      >
        <ArrowDown className="h-3.5 w-3.5 transition-transform group-hover:hidden" />
        <Plus className="hidden h-3.5 w-3.5 group-hover:block" />
        <span className="hidden whitespace-nowrap group-hover:inline">Insert Block</span>
      </button>
      <div className="h-3 w-px bg-slate-300 dark:bg-slate-700" />
    </div>
  );
};
