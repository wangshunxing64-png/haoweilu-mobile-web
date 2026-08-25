import React, { useState } from 'react';
import { X, Check } from 'lucide-react';

interface EditReviewModalProps {
  initialText: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (newText: string) => void;
}

export const EditReviewModal: React.FC<EditReviewModalProps> = ({
  initialText,
  isOpen,
  onClose,
  onSave,
}) => {
  const [text, setText] = useState(initialText);

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end justify-center">
      <div className="w-full bg-white rounded-t-3xl p-5 shadow-2xl animate-in slide-in-from-bottom duration-200 border-t border-stone-100">
        <div className="flex items-center justify-between pb-2.5 border-b border-stone-100">
          <h3 className="text-[15px] font-bold text-[#2E2926]">微调评价内容</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-stone-400 hover:text-stone-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="my-3.5">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            className="w-full p-3 rounded-2xl bg-[#FAF8F5] border border-stone-200 text-[13.5px] text-[#2E2926] leading-relaxed focus:outline-none focus:border-[#932115]"
            placeholder="输入您的真实就餐评价..."
          />
        </div>

        <div className="flex space-x-2.5 pt-1">
          <button
            onClick={onClose}
            className="flex-1 h-[44px] rounded-full border border-stone-300 text-stone-700 text-[13.5px] font-medium active:bg-stone-50 cursor-pointer"
          >
            取消
          </button>
          <button
            onClick={() => {
              onSave(text);
              onClose();
            }}
            className="flex-1 h-[44px] rounded-full bg-[#932115] text-white text-[13.5px] font-semibold flex items-center justify-center space-x-1 shadow-md hover:bg-[#831D12] active:scale-[0.99] cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>保存修改</span>
          </button>
        </div>
      </div>
    </div>
  );
};

