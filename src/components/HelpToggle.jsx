import { useState } from 'react';

export default function HelpToggle({ children, color = '#c8e3d8' }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center
          transition-all duration-200 cursor-pointer shrink-0"
        style={{
          backgroundColor: open ? color : 'transparent',
          color: open ? '#171717' : '#54494B',
          border: `1.5px solid ${color}`,
        }}
        title={open ? 'Hide guide' : 'How to read this chart'}
      >
        ?
      </button>
      {open && (
        <div
          className="w-full rounded-lg p-4 text-xs leading-relaxed text-[#54494B] mt-3 space-y-2 animate-in"
          style={{ backgroundColor: color + '30', borderLeft: `3px solid ${color}` }}
        >
          {children}
        </div>
      )}
    </>
  );
}
