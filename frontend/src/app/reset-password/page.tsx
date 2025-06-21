"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { resetPassword } from '@/services/authService';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

const formSchema = z.object({
  new_password: z.string().min(8, { message: "Heslo musí mať aspoň 8 znakov." }),
  confirmPassword: z.string(),
}).refine(data => data.new_password === data.confirmPassword, {
  message: "Heslá sa nezhodujú.",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof formSchema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { new_password: "", confirmPassword: "" },
  });
  
  useEffect(() => {
    if (!token) {
        setError("Neplatný alebo chýbajúci odkaz na obnovenie hesla. Skúste požiadať o nový.");
    }
  }, [token]);

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    if (!token) return;
    setIsLoading(true);
    setError('');
    setMessage('');
    try {
      const result = await resetPassword(token, data.new_password);
      // Assuming result has a 'msg' property of type string
      const { msg } = result as { msg: string };
      setMessage(msg + " Budete presmerovaný na prihlásenie.");
      setTimeout(() => router.push('/login'), 4000);
    } catch (err) {
      setError((err as Error).message || "Vyskytla sa chyba.");
    } finally {
      setIsLoading(false);
    }
  };

  if (message) {
    return (
      <div className="text-center">
        <p className="text-green-600 dark:text-green-500">{message}</p>
        <Link href="/login" className="underline mt-4 inline-block">Prejsť na prihlásenie</Link>
      </div>
    );
  }
  
  if (!token) {
    return <p className="text-red-600 dark:text-red-500">{error}</p>
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField control={form.control} name="new_password" render={({ field }) => (
          <FormItem><FormLabel>Nové heslo</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
        )}/>
        <FormField control={form.control} name="confirmPassword" render={({ field }) => (
          <FormItem><FormLabel>Potvrďte nové heslo</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
        )}/>
        {error && <p className="text-sm text-red-600 dark:text-red-500">{error}</p>}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Zmeniť heslo
        </Button>
      </form>
    </Form>
  );
}

export default function ResetPasswordPage() {
    return (
        <div className="container flex items-center justify-center min-h-screen">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Nastavte si nové heslo</CardTitle>
              <CardDescription>Zadajte vaše nové bezpečné heslo.</CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
                  <ResetPasswordForm />
              </Suspense>
            </CardContent>
          </Card>
        </div>
    )
}