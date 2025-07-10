
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input';
import { Label } from "@/components/ui/label";
import { useAppContext } from "@/context/app-provider";
import { toast } from "sonner";
import { Download, Upload, Loader2 } from 'lucide-react';

export function DataManagement() {
    const { handleImportData, handleExportData } = useAppContext();
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useState<HTMLInputElement>(null);

    const onExportClick = () => {
        try {
            const fileName = handleExportData();
            toast.success("Export successful!", {
                description: `Your data has been saved to ${fileName}.`
            });
        } catch (error) {
            toast.error("Export failed", {
                description: "Could not export your data. Please try again."
            });
            console.error(error);
        }
    };

    const onImportChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const content = e.target?.result;
                if (typeof content === 'string') {
                    try {
                        const { notes, folders } = handleImportData(content);
                        toast.success("Import successful!", {
                            description: `Imported ${notes.length} notes and ${folders.length} folders.`
                        });
                    } catch (error: any) {
                         toast.error("Import failed", {
                            description: error.message || "The selected file is not valid."
                        });
                    }
                }
                setIsImporting(false);
            };
            reader.readAsText(file);
        } catch (error) {
            toast.error("Import failed", {
                description: "Could not read the selected file."
            });
            setIsImporting(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Data Management</CardTitle>
                <CardDescription>Export your entire workspace or import data from a backup file.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-lg border p-4">
                    <div>
                        <h3 className="font-medium">Export Data</h3>
                        <p className="text-sm text-muted-foreground">Download all your notes and folders as a single JSON file.</p>
                    </div>
                    <Button onClick={onExportClick} variant="outline" className="mt-2 sm:mt-0">
                        <Download className="mr-2" />
                        Export
                    </Button>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-lg border p-4">
                     <div>
                        <h3 className="font-medium">Import Data</h3>
                        <p className="text-sm text-muted-foreground">Import from a previously exported JSON file.</p>
                    </div>
                    <div>
                        <Input
                            id="import-file"
                            type="file"
                            accept=".json"
                            onChange={onImportChange}
                            className="hidden"
                            ref={fileInputRef}
                        />
                        <Button
                            onClick={() => fileInputRef.current?.click()}
                            variant="outline"
                            disabled={isImporting}
                            className="mt-2 sm:mt-0"
                        >
                            {isImporting ? <Loader2 className="mr-2 animate-spin" /> : <Upload className="mr-2" />}
                            Import
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
