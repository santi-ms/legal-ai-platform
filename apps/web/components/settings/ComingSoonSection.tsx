"use client";

import { Construction } from "lucide-react";

interface ComingSoonSectionProps {
  title: string;
  description: string;
  features?: string[];
}

export function ComingSoonSection({ title, description, features }: ComingSoonSectionProps) {
  return (
    <div className="px-4 py-12">
      <div className="max-w-2xl mx-auto text-center">
        <div className="flex justify-center mb-6">
          <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Construction className="w-8 h-8" />
          </div>
        </div>
        <h3 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">{title}</h3>
        <p className="text-slate-500 dark:text-slate-400 mb-8">{description}</p>
        
        {features && features.length > 0 && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 text-left">
            <h4 className="font-semibold mb-4 text-slate-900 dark:text-white">
              Funcionalidades próximas:
            </h4>
            <ul className="space-y-2">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <span className="text-primary mt-1">•</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

