'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Toaster as Sonner } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="group toaster [&_[data-type=success]>[data-icon]]:text-success [&_[data-type=success]_[data-title]]:text-success [&_[data-type=info]_[data-title]]:text-info [&_[data-type=error]>[data-icon]]:text-destructive [&_[data-type=error]_[data-title]]:text-destructive"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground! group-[.toaster]:border-border group-[.toaster]:shadow-lg has-[[role=alert]]:border-0! has-[[role=alert]]:shadow-none! has-[[role=alert]]:bg-transparent!',
          success:
            'group-[.toaster]:bg-green-600! group-[.toaster]:text-white! group-[.toaster]:border-green-700!',
          error:
            'group-[.toaster]:bg-red-600! group-[.toaster]:text-white! group-[.toaster]:border-red-700!',
          description: 'group-[.toast]:text-muted-foreground group-data-[type=success]/toast:text-green-100! group-data-[type=error]/toast:text-red-100!',
          actionButton: 'group-[.toast]:rounded-md! group-[.toast]:bg-primary group-[.toast]:text-primary-foreground!',
          cancelButton:
            'group-[.toast]:rounded-md! group-[.toast]:bg-secondary group-[.toast]:text-secondary-foreground!',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
