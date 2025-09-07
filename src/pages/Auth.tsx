import AuthForm from '@/components/Auth/AuthForm';
import { ThemeProvider } from 'next-themes';

const Auth = () => {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AuthForm />
    </ThemeProvider>
  );
};

export default Auth;