import AuthCard from '../components/AuthCard';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-surface asanoha-bg flex items-center justify-center p-4 md:p-8">
      <AuthCard initialMode="login" />
    </div>
  );
}
