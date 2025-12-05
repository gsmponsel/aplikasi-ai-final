
import React from 'react';

interface AttentionModalProps {
  onClose: () => void;
}

const AttentionModal: React.FC<AttentionModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full text-center">
        <h2 className="text-xl font-bold mb-4 text-gray-900">Perhatian</h2>
        
        <div className="space-y-4 mb-6">
            <p className="text-gray-700">
              Aplikasi ini jangan dijual, silahkan dipakai saja untuk kebutuhan pribadi.
            </p>
            <p className="text-gray-700 font-medium">
              Jangan generate konten tak senonoh, dosa tanggung sendiri ya..
            </p>
            <p className="text-sm text-gray-600">
              Credit dan doa semoga cepat naik haji dan selamat dunia akhirat untuk kreator:{' '}
              <a
                href="https://www.tiktok.com/@fihsan"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-600 font-semibold hover:underline"
              >
                @fihsan
              </a>
            </p>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-purple-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
        >
          Oke
        </button>
      </div>
    </div>
  );
};

export default AttentionModal;
