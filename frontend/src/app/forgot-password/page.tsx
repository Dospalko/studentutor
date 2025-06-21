"use client";

import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { requestPasswordReset } from '@/services/authService';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

const formSchema = z.object({
  email: z.string().email({ message: "Zadajte platnú e-mailovú adresu." }),
});

type FormData = z.infer<typeof formSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "" },
  });

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsLoading(true);
    setError('');
    setMessage('');
    try {
      const result = await requestPasswordReset(data.email);
      if (
        typeof result === 'object' &&
        result !== null &&
        'msg' in result &&
        typeof (result as { msg?: unknown }).msg === 'string'
      ) {
        setMessage((result as { msg: string }).msg); // Použijeme správu z API
      } else {
        setMessage("Odkaz na obnovenie bol odoslaný, ak e-mail existuje.");
      }
    } catch {
      setError("Vyskytla sa neočakávaná chyba. Skúste to prosím znova.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Zabudli ste heslo?</CardTitle>
          <CardDescription>
            Zadajte svoj e-mail. Ak s ním existuje účet, pošleme vám odkaz na obnovenie hesla.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({
                  field,
                }: {
                  field: import("react-hook-form").ControllerRenderProps<FormData, "email">;
                }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="vas.email@priklad.sk" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {message && <p className="text-sm text-green-600 dark:text-green-500">{message}</p>}
              {error && <p className="text-sm text-red-600 dark:text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Odoslať odkaz na obnovenie
              </Button>
            </form>
          </Form>
           <div className="mt-4 text-center text-sm">
             <Link href="/login" className="underline">Späť na prihlásenie</Link>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}