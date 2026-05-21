import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner = () => {
  return (
    <div className="flex flex-col items-center justify-center p-12 min-h-[40vh] gap-4 w-full h-full">
      <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
      <p className="text-sm font-semibold text-neutral-500 uppercase tracking-widest animate-pulse">
        Đang tải dữ liệu...
      </p>
    </div>
  );
};
