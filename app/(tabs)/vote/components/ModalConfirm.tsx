"use client";

export default function ModalConfirm({
  open,
  title,
  message,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white p-5 rounded-2xl w-72 shadow-lg">
        <div className="font-bold text-lg mb-2">{title}</div>
        <div className="text-sm text-gray-700 mb-4">{message}</div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-300 hover:bg-gray-400 py-2 rounded-xl"
          >
            취소
          </button>

          <button
            onClick={onConfirm}
            className="flex-1 bg-red-400 hover:bg-red-500 text-white py-2 rounded-xl"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
