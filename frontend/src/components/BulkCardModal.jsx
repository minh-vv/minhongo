import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Trash2, Clipboard, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { flashcardApi } from '../api/flashcardApi';

export default function BulkCardModal({ isOpen, onClose, onSuccess, deckId, deckCategory }) {
  const [activeTab, setActiveTab] = useState('excel'); // 'table' or 'excel'
  const [excelText, setExcelText] = useState('');
  const [rows, setRows] = useState([
    { front: '', romaji: '', back: '', example: '' },
    { front: '', romaji: '', back: '', example: '' },
    { front: '', romaji: '', back: '', example: '' },
    { front: '', romaji: '', back: '', example: '' },
    { front: '', romaji: '', back: '', example: '' },
  ]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const isKanji = deckCategory === 'HANTU';

  const handleExcelParse = () => {
    if (!excelText.trim()) {
      setErrorMsg('Vui lòng dán dữ liệu trước.');
      return;
    }
    setErrorMsg('');
    try {
      const lines = excelText.split('\n');
      const parsed = [];
      for (const line of lines) {
        if (!line.trim()) continue;
        const cols = line.split('\t');
        parsed.push({
          front: (cols[0] || '').trim(),
          romaji: (cols[1] || '').trim(),
          back: (cols[2] || '').trim(),
          example: (cols[3] || '').trim(),
        });
      }

      if (parsed.length === 0) {
        setErrorMsg('Không tìm thấy dữ liệu hợp lệ nào.');
        return;
      }

      // Lọc các hàng hoàn toàn trống
      const newRows = parsed.filter(r => r.front || r.back || r.romaji || r.example);
      
      // Nếu các hàng mặc định đang trống hoàn toàn, thay thế chúng
      const isDefaultEmpty = rows.every(r => !r.front && !r.back && !r.romaji && !r.example);
      if (isDefaultEmpty) {
        setRows(newRows);
      } else {
        setRows([...rows, ...newRows]);
      }
      setExcelText('');
      setActiveTab('table');
    } catch (err) {
      setErrorMsg('Có lỗi xảy ra khi phân tích dữ liệu.');
    }
  };

  const handleAddRow = () => {
    setRows([...rows, { front: '', romaji: '', back: '', example: '' }]);
  };

  const handleRemoveRow = (index) => {
    const nextRows = [...rows];
    nextRows.splice(index, 1);
    setRows(nextRows);
  };

  const handleCellChange = (index, field, val) => {
    const nextRows = [...rows];
    nextRows[index][field] = val;
    setRows(nextRows);
  };

  const handleClearAll = () => {
    if (confirm('Bạn có chắc muốn xóa toàn bộ bảng hiện tại?')) {
      setRows([
        { front: '', romaji: '', back: '', example: '' },
        { front: '', romaji: '', back: '', example: '' },
        { front: '', romaji: '', back: '', example: '' },
      ]);
    }
  };

  const handleSave = async () => {
    setErrorMsg('');
    // Chỉ lấy dòng có dữ liệu hợp lệ
    const cardsToSave = rows.filter(r => r.front.trim() && r.back.trim());

    if (cardsToSave.length === 0) {
      setErrorMsg('Vui lòng nhập ít nhất 1 dòng có đầy đủ Mặt trước (Tiếng Nhật) và Mặt sau (Nghĩa).');
      return;
    }

    setLoading(true);
    try {
      await flashcardApi.createCardsBulk(deckId, cardsToSave);
      onSuccess();
    } catch (err) {
      console.error(err);
      setErrorMsg(err?.response?.data?.message || 'Có lỗi xảy ra khi lưu thẻ học.');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-up">
      <div className="bg-surface-container-lowest border border-outline-variant/40 sharp-shadow p-6 w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-outline-variant/20">
          <div>
            <h3 className="font-headline text-lg font-bold text-on-surface">
              {isKanji ? 'Thêm chữ Hán hàng loạt' : 'Thêm từ vựng hàng loạt'}
            </h3>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Nhanh chóng tạo nhiều thẻ học cùng một lúc bằng bảng nhập liệu hoặc dán từ Excel.
            </p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-surface-container transition-colors rounded text-on-surface-variant">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-2 border-b border-outline-variant/20 mt-4">
          <button
            onClick={() => setActiveTab('excel')}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 -mb-px flex items-center gap-1.5 transition-colors ${
              activeTab === 'excel'
                ? 'border-secondary text-secondary bg-secondary/[0.03]'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Clipboard className="w-3.5 h-3.5" />
            Dán từ Excel / Sheets
          </button>
          <button
            onClick={() => setActiveTab('table')}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 -mb-px flex items-center gap-1.5 transition-colors ${
              activeTab === 'table'
                ? 'border-secondary text-secondary bg-secondary/[0.03]'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Bảng nhập liệu ({rows.length} dòng)
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar my-4 min-h-[300px]">
          {errorMsg && (
            <div className="mb-4 bg-red-50 text-red-800 p-3 text-xs font-semibold flex items-center gap-2 border border-red-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {activeTab === 'excel' ? (
            <div className="space-y-4">
              <div className="bg-surface-container-low p-4 text-xs text-on-surface-variant leading-relaxed">
                <p className="font-bold text-on-surface mb-1">Hướng dẫn copy-paste:</p>
                <ol className="list-decimal pl-4 space-y-0.5">
                  <li>Chuẩn bị bảng từ vựng trong Excel hoặc Google Sheets gồm 4 cột theo thứ tự: 
                    <strong className="text-secondary"> {isKanji ? 'Chữ Hán, Cách đọc Onyomi/Kunyomi, Âm Hán Việt & Nghĩa, Từ ghép ví dụ' : 'Tiếng Nhật, Cách đọc, Nghĩa tiếng Việt, Câu ví dụ'}</strong>.
                  </li>
                  <li>Bôi đen và Copy (<kbd className="bg-white px-1 border">Ctrl+C</kbd>) các dòng dữ liệu.</li>
                  <li>Dán vào ô văn bản bên dưới và bấm nút <strong className="text-on-surface">"Đọc dữ liệu bảng"</strong>.</li>
                </ol>
              </div>

              <textarea
                value={excelText}
                onChange={(e) => setExcelText(e.target.value)}
                placeholder={
                  isKanji 
                    ? "Dán dữ liệu Hán tự ở đây...&#10;Ví dụ:&#10;日\tニチ, ジツ / ひ\tNhật (ngày)\t日本: nước Nhật"
                    : "Dán dữ liệu từ vựng ở đây...&#10;Ví dụ:&#10;猫\tねこ\tCon mèo\t猫がいます"
                }
                className="w-full h-64 p-3 text-sm bg-surface text-on-surface border border-outline-variant/60 focus:outline-none focus:border-secondary transition-colors resize-none font-mono"
              />

              <div className="flex justify-end">
                <button
                  onClick={handleExcelParse}
                  className="px-5 py-2.5 bg-primary text-white hover:bg-primary-container text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2"
                >
                  <Clipboard className="w-4 h-4" />
                  Đọc dữ liệu bảng
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto border border-outline-variant/30">
              <table className="w-full border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant/40">
                    <th className="px-3 py-2 text-left text-[10px] font-bold text-on-surface-variant uppercase tracking-wider w-12 text-center">STT</th>
                    <th className="px-3 py-2 text-left text-[10px] font-bold text-on-surface-variant uppercase tracking-wider w-1/4">
                      {isKanji ? 'Chữ Hán *' : 'Tiếng Nhật *'}
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-bold text-on-surface-variant uppercase tracking-wider w-1/5">
                      {isKanji ? 'Onyomi / Kunyomi' : 'Cách đọc (Kana/Romaji)'}
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-bold text-on-surface-variant uppercase tracking-wider w-1/4">
                      {isKanji ? 'Âm Hán Việt / Nghĩa *' : 'Nghĩa tiếng Việt *'}
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                      {isKanji ? 'Ví dụ ghép từ' : 'Ví dụ câu'}
                    </th>
                    <th className="px-3 py-2 text-center text-[10px] font-bold text-on-surface-variant uppercase tracking-wider w-12">Xóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {rows.map((row, index) => (
                    <tr key={index} className="hover:bg-surface-container/10 transition-colors">
                      <td className="px-2 py-1.5 text-center text-xs font-bold text-on-surface-variant tabular-nums">
                        {index + 1}
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="text"
                          value={row.front}
                          onChange={(e) => handleCellChange(index, 'front', e.target.value)}
                          placeholder={isKanji ? 'Ví dụ: 日' : 'Ví dụ: 猫'}
                          className="w-full px-2 py-1 text-sm bg-surface text-on-surface border border-outline-variant/45 focus:outline-none focus:border-secondary transition-colors"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="text"
                          value={row.romaji}
                          onChange={(e) => handleCellChange(index, 'romaji', e.target.value)}
                          placeholder={isKanji ? 'ニチ / ひ' : 'ねこ'}
                          className="w-full px-2 py-1 text-sm bg-surface text-on-surface border border-outline-variant/45 focus:outline-none focus:border-secondary transition-colors"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="text"
                          value={row.back}
                          onChange={(e) => handleCellChange(index, 'back', e.target.value)}
                          placeholder={isKanji ? 'Nhật (ngày)' : 'Con mèo'}
                          className="w-full px-2 py-1 text-sm bg-surface text-on-surface border border-outline-variant/45 focus:outline-none focus:border-secondary transition-colors"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="text"
                          value={row.example}
                          onChange={(e) => handleCellChange(index, 'example', e.target.value)}
                          placeholder={isKanji ? '日本: nước Nhật' : '猫がいます: Có con mèo.'}
                          className="w-full px-2 py-1 text-sm bg-surface text-on-surface border border-outline-variant/45 focus:outline-none focus:border-secondary transition-colors"
                        />
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <button
                          onClick={() => handleRemoveRow(index)}
                          className="p-1 hover:bg-red-50 text-on-surface-variant hover:text-secondary transition-colors rounded"
                          title="Xóa dòng này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-outline-variant/20">
          <div className="flex gap-2">
            {activeTab === 'table' && (
              <>
                <button
                  onClick={handleAddRow}
                  className="px-4 py-2 border border-outline-variant text-on-surface-variant hover:bg-surface-container text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Thêm dòng
                </button>
                <button
                  onClick={handleClearAll}
                  className="px-4 py-2 border border-red-200 text-red-800 hover:bg-red-50 text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Xóa sạch bảng
                </button>
              </>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 border border-outline-variant text-on-surface-variant hover:bg-surface-container text-xs font-bold uppercase tracking-wider transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-6 py-2.5 text-on-secondary hover:bg-secondary-dim disabled:opacity-60 transition-colors text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
              style={{ background: 'var(--secondary)' }}
            >
              {loading ? 'Đang lưu...' : 'Lưu tất cả thẻ'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
