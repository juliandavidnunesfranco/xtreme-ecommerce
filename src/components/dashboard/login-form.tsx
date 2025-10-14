'use client'

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().email("Por favor, introduce un email válido."),
  password: z.string().min(1, "La contraseña no puede estar vacía."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    
    const result = await signIn('credentials', {
      redirect: false,
      email: data.email,
      password: data.password, 

    });

    setIsLoading(false);

    if (result?.error) {
      // Muestra un error genérico
      toast.error("Error de autenticación", {
        description: "El email o la contraseña son incorrectos. Por favor, inténtalo de nuevo.",
      });
    } else if (result?.ok) {
      // Si el login es exitoso, redirige al dashboard
      toast.success("¡Bienvenido!", {
        description: "Has iniciado sesión correctamente.",
      });
      // Redirige al callbackUrl si existe, o al dashboard por defecto
      const callbackUrl = searchParams.get("callbackUrl") || "/main";
      router.push(callbackUrl);
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input 
          id="email" 
          type="email" 
          placeholder="admin@example.com" 
          {...register('email')} 
          disabled={isLoading}
        />
        {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input 
          id="password" 
          type="password" 
          {...register('password')} 
          disabled={isLoading}
        />
        {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
      </Button>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-gray-500 dark:bg-gray-800">
            O continuar con
          </span>
        </div>
      </div>

      <Button 
        variant="outline" 
        type="button" 
        className="w-full" 
        disabled={isLoading} 
        onClick={() => signIn('google', { callbackUrl: searchParams.get('callbackUrl') || '/main' })}
      >
        {/* Aquí iría el logo de Google si lo tuviéramos disponible como componente */}
        Iniciar sesión con Google
      </Button>
    </form>
  );
}