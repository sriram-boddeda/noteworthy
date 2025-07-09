
'use client';

import React, { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Button } from './ui/button';
import { Palette } from 'lucide-react';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { useAppContext } from '@/context/app-provider';
import { cn } from '@/lib/utils';

const hslStringToParts = (hsl: string): [number, number, number] => {
  const [h, s, l] = hsl.split(' ').map((val) => parseInt(val, 10));
  return [h, s, l];
};

const partsToHslString = (h: number, s: number, l: number): string => {
  return `${h} ${s}% ${l}%`;
};

function ColorSlider({ label, value, onValueChange, max, step = 1 }: { label: string, value: number, onValueChange: (value: number) => void, max: number, step?: number }) {
    return (
        <div className="grid grid-cols-4 items-center gap-x-2">
            <Label className="text-xs text-right col-span-1">{label}</Label>
            <Slider
                value={[value]}
                onValueChange={([v]) => onValueChange(v)}
                max={max}
                step={step}
                className="col-span-3"
            />
        </div>
    )
}

export function ThemeCustomizer() {
  const { customTheme, handleThemeChange } = useAppContext();

  const [primaryH, primaryS, primaryL] = hslStringToParts(customTheme.primary);
  const [accentH, accentS, accentL] = hslStringToParts(customTheme.accent);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8">
          <Palette className="size-4" />
          <span className="sr-only">Customize Theme</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Customize Theme</h4>
            <p className="text-sm text-muted-foreground">
              Adjust the colors to your liking.
            </p>
          </div>
          <div className="grid gap-4 rounded-md border p-4">
            <div className="flex items-center justify-between">
                <Label>Primary Color</Label>
                <div className="h-6 w-6 rounded-full border" style={{ backgroundColor: `hsl(${customTheme.primary})`}} />
            </div>
            <ColorSlider label="Hue" value={primaryH} onValueChange={(h) => handleThemeChange({ primary: partsToHslString(h, primaryS, primaryL) })} max={360} />
            <ColorSlider label="Sat" value={primaryS} onValueChange={(s) => handleThemeChange({ primary: partsToHslString(primaryH, s, primaryL) })} max={100} />
            <ColorSlider label="Light" value={primaryL} onValueChange={(l) => handleThemeChange({ primary: partsToHslString(primaryH, primaryS, l) })} max={100} />
          </div>
           <div className="grid gap-4 rounded-md border p-4">
             <div className="flex items-center justify-between">
                <Label>Accent Color</Label>
                <div className="h-6 w-6 rounded-full border" style={{ backgroundColor: `hsl(${customTheme.accent})`}} />
            </div>
            <ColorSlider label="Hue" value={accentH} onValueChange={(h) => handleThemeChange({ accent: partsToHslString(h, accentS, accentL) })} max={360} />
            <ColorSlider label="Sat" value={accentS} onValueChange={(s) => handleThemeChange({ accent: partsToHslString(accentH, s, accentL) })} max={100} />
            <ColorSlider label="Light" value={accentL} onValueChange={(l) => handleThemeChange({ accent: partsToHslString(accentH, accentS, l) })} max={100} />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
