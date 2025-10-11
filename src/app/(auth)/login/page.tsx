import { LoginForm } from '@/components/dashboard/login-form';
import { Suspense } from 'react';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
        <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Acceso de Administrador</h1>
            <p className="text-gray-500 dark:text-gray-400">Ingresa tus credenciales para continuar</p>
        </div>
        <Suspense fallback={<div className="text-center text-gray-500 dark:text-gray-400">Cargando formulario...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
