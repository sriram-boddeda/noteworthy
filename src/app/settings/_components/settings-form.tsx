
'use client';

import { useAppContext } from "@/context/app-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { noteTypeOptions } from "@/lib/data";
import { useEffect, useState } from "react";
import type { UserSettings } from "@/lib/data";

export function SettingsForm() {
    const { settings, handleUpdateSettings } = useAppContext();
    const [localSettings, setLocalSettings] = useState<UserSettings>(settings);

    useEffect(() => {
        setLocalSettings(settings);
    }, [settings]);

    const handleSave = () => {
        handleUpdateSettings(localSettings);
    };
    
    const isChanged = JSON.stringify(localSettings) !== JSON.stringify(settings);

    return (
        <Card>
            <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Adjust your preferences for the Noteworthy app.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="defaultNoteType">Default Note Type</Label>
                    <Select
                        value={localSettings.defaultNoteType}
                        onValueChange={(value) => setLocalSettings(prev => ({...prev, defaultNoteType: value as UserSettings['defaultNoteType']}))}
                    >
                        <SelectTrigger id="defaultNoteType">
                            <SelectValue placeholder="Select default note type" />
                        </SelectTrigger>
                        <SelectContent>
                            {noteTypeOptions.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                        Choose the note type that is selected by default when you create a new note.
                    </p>
                </div>

                 <div className="space-y-2">
                    <Label htmlFor="recentNotesCount">Number of Recent Notes</Label>
                    <div className="flex items-center gap-4">
                         <Slider
                            id="recentNotesCount"
                            min={1}
                            max={10}
                            step={1}
                            value={[localSettings.recentNotesCount]}
                            onValueChange={([value]) => setLocalSettings(prev => ({...prev, recentNotesCount: value}))}
                        />
                        <span className="text-lg font-bold w-12 text-center">{localSettings.recentNotesCount}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Control how many recent notes appear in the sidebar for quick access.
                    </p>
                </div>
                
                <div className="flex justify-end pt-4">
                    <Button onClick={handleSave} disabled={!isChanged}>
                        Save Changes
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

