"use client";

interface Props {
  open: boolean;
  title: string;
  message?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ModalConfirm({
  open,
  title,
  message,
  onCancel,
  onConfirm,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-white rounded-3xl p-6 w-80 shadow-xl animate-pop">

        {/* 제목 */}
        <div className="text-lg font-bold text-gray-800 mb-2 text-center">
          {title}
        </div>

        {/* 메시지 */}
        {message && (
          <div className="text-sm text-gray-600 mb-6 text-center">
            {message}
          </div>
        )}

        {/* 버튼 */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded-xl border text-gray-700 bg-gray-100 hover:bg-gray-200"
          >
            아니요
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 rounded-xl text-white bg-rose-400 hover:bg-rose-500"
          >
            네, 취소할게요
          </button>
        </div>
      </div>

      <style jsx>{`
        .animate-pop {
          animation: pop 0.18s ease-out;
        }
        @keyframes pop {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
