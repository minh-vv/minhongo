import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function ListeningPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const mode = searchParams.get('mode');
    const deckId = searchParams.get('deckId');

    if (deckId || mode === 'cloze' || mode === 'dictation') {
      navigate(`/listening/sentence?${searchParams.toString()}`, { replace: true });
    } else if (mode === 'shadowing') {
      navigate('/listening/dialogue', { replace: true });
    } else {
      navigate('/listening/dialogue', { replace: true });
    }
  }, [searchParams, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
      <div className="w-8 h-8 border-2 border-outline-variant border-t-secondary animate-spin rounded-full" />
      <span className="text-xs text-on-surface-variant font-medium">Đang chuyển hướng trang luyện nghe...</span>
    </div>
  );
}
