import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { flashcardApi } from '../api/flashcardApi';

export default function ImportAnkiModal({ isOpen, onClose, onSuccess }) {
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    deckName: '',
    description: '',
    frontField: '',
    backField: '',
    romajiField: '',
    exampleField: '',
  });

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.apkg')) {
      setError('Vui lòng chọn file .apkg');
      return;
    }

    setSelectedFile(file);
    setError('');
    setIsLoading(true);

    try {
      const previewData = await flashcardApi.previewAnkiFile(file);
      setPreview(previewData);

      // Auto-fill form với suggested mapping
      const mapping = previewData.suggestedMapping;
      setFormData((prev) => ({
        ...prev,
        deckName: file.name.replace('.apkg', ''),
        frontField: mapping.front || '',
        backField: mapping.back || '',
        romajiField: mapping.romaji || '',
        exampleField: mapping.example || '',
      }));
    } catch {
      setError('Không thể đọc file Anki. Vui lòng kiểm tra file.');
      setSelectedFile(null);
    } finally {
      setIsLoading(false);
    }
  };

  const importMutation = useMutation({
    mutationFn: () => flashcardApi.importAnkiFile(selectedFile, formData),
    onSuccess: (data) => {
      if (onSuccess) {
        onSuccess(data);
      }
      onClose();
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Import thất bại');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Vui lòng chọn file Anki');
      return;
    }
    if (!formData.deckName) {
      setError('Vui lòng nhập tên deck');
      return;
    }
    if (!formData.frontField || !formData.backField) {
      setError('Vui lòng chọn trường Front và Back');
      return;
    }
    importMutation.mutate();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">Import từ Anki</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chọn file .apkg *
            </label>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                selectedFile
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-blue-400'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".apkg"
                onChange={handleFileSelect}
                className="hidden"
              />
              {isLoading ? (
                <div className="text-gray-500">Đang đọc file...</div>
              ) : selectedFile ? (
                <div>
                  <svg className="w-12 h-12 mx-auto text-blue-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div>
                  <svg className="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-gray-600">Kéo thả file .apkg hoặc click để chọn</p>
                </div>
              )}
            </div>
          </div>

          {/* Preview Info */}
          {preview && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Thông tin file</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Số thẻ:</span>
                  <span className="ml-2 font-medium">{preview.totalNotes}</span>
                </div>
                <div>
                  <span className="text-gray-500">Trường có sẵn:</span>
                  <span className="ml-2 font-medium">{preview.fieldNames.length}</span>
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                Các trường: {preview.fieldNames.join(', ')}
              </div>
            </div>
          )}

          {/* Deck Info */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên deck *
            </label>
            <input
              type="text"
              required
              value={formData.deckName}
              onChange={(e) => setFormData({ ...formData, deckName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ví dụ: Từ vựng JLPT N5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mô tả
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Mô tả ngắn về deck..."
            />
          </div>

          {/* Field Mapping */}
          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-900 mb-3">Ánh xạ trường</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trường Front (Tiếng Nhật) *
                </label>
                <select
                  value={formData.frontField}
                  onChange={(e) => setFormData({ ...formData, frontField: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Chọn trường</option>
                  {preview?.fieldNames.map((field) => (
                    <option key={field} value={field}>{field}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trường Back (Nghĩa) *
                </label>
                <select
                  value={formData.backField}
                  onChange={(e) => setFormData({ ...formData, backField: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Chọn trường</option>
                  {preview?.fieldNames.map((field) => (
                    <option key={field} value={field}>{field}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trường Romaji (tùy chọn)
                </label>
                <select
                  value={formData.romajiField}
                  onChange={(e) => setFormData({ ...formData, romajiField: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Không chọn</option>
                  {preview?.fieldNames.map((field) => (
                    <option key={field} value={field}>{field}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trường Ví dụ (tùy chọn)
                </label>
                <select
                  value={formData.exampleField}
                  onChange={(e) => setFormData({ ...formData, exampleField: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Không chọn</option>
                  {preview?.fieldNames.map((field) => (
                    <option key={field} value={field}>{field}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={importMutation.isPending || !selectedFile}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {importMutation.isPending ? 'Đang import...' : 'Import'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
