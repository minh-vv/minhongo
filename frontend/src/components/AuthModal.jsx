import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import AuthCard from './AuthCard';

export default function AuthModal() {
  const { authModalOpen, authModalMode, closeAuthModal } = useAuth();

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeAuthModal();
      }
    };
    if (authModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
      // Lock scroll on body
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [authModalOpen, closeAuthModal]);

  if (!authModalOpen) return null;

  const handleBackdropClick = (e) => {
    // Only close if clicked precisely on the backdrop overlay, not on children
    if (e.target === e.currentTarget) {
      closeAuthModal();
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/50 backdrop-blur-[4px] animate-fade-in"
      style={{
        animation: 'fadeIn 0.2s ease-out forwards',
      }}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
      
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto no-scrollbar rounded-2xl shadow-2xl">
        <AuthCard
          initialMode={authModalMode}
          onClose={closeAuthModal}
          isModal={true}
        />
      </div>
    </div>
  );
}
