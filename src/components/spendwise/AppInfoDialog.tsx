
"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Info, Package, Building, ArrowRightLeft, FolderTree, ListChecks, HelpCircle, BarChart3, Sparkles, Wand2, UploadCloud, FileSpreadsheet, MessageCircle } from "lucide-react";

interface AppInfoDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AppInfoDialog({ isOpen, onClose }: AppInfoDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Info className="mr-2 h-5 w-5 text-primary" />
            About Spend by TADA
          </DialogTitle>
          <DialogDescription>
            A comprehensive spend management and analysis tool.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4 text-sm">
            <div className="space-y-4 py-4">
                <section>
                    <h4 className="font-semibold mb-1">Purpose:</h4>
                    <p className="text-xs text-muted-foreground">
                        Spend by TADA is designed to help you manage, analyze, and optimize your procurement spend. 
                        It allows for detailed tracking of parts, suppliers, and their relationships,
                        facilitating what-if scenario modeling for cost adjustments, tariff changes, and demand fluctuations.
                    </p>
                </section>

                <section>
                    <h4 className="font-semibold mb-1">Key Features & Basic Instructions:</h4>
                    <ul className="list-disc list-inside space-y-2 text-xs text-muted-foreground">
                        <li>
                            <strong>Data Management (Tabs 1-4):</strong>
                            <ul className="list-circle list-inside pl-4 mt-1 space-y-0.5">
                                <li><Package className="inline h-3 w-3 mr-1"/><strong>Add/Update Parts (Tab 1):</strong> Manage part details, including base cost, annual volume, and freight/OHD percentages. Select a part to view its "Part360" panel.</li>
                                <li><Building className="inline h-3 w-3 mr-1"/><strong>Add/Update Suppliers (Tab 2):</strong> Maintain supplier information and geocode their addresses for map visualization.</li>
                                <li><ArrowRightLeft className="inline h-3 w-3 mr-1"/><strong>Update Source Mix (Tab 3):</strong> Create many-to-many relationships by dragging parts to suppliers (or vice-versa).</li>
                                <li><FolderTree className="inline h-3 w-3 mr-1"/><strong>Add/Update Categories (Tab 4):</strong> Organize parts by dragging them into defined categories.</li>
                            </ul>
                        </li>
                        <li>
                            <ListChecks className="inline h-3 w-3 mr-1"/><strong>Validate Spend Network (Tab 5):</strong> Run various data consistency checks (e.g., parts without suppliers, duplicate entries) to ensure data integrity.
                        </li>
                        <li>
                            <HelpCircle className="inline h-3 w-3 mr-1"/><strong>What-if Analysis (Tab 6):</strong> Model different scenarios by adjusting global parameters (home country, tariff, logistics), category-specific costs, country-specific tariffs, and demand. Save and load scenarios to compare impacts.
                        </li>
                        <li>
                            <BarChart3 className="inline h-3 w-3 mr-1"/><strong>Review Spend (Tab 7):</strong> Analyze your current spend data through various charts. Use filters for parts, suppliers, and categories to drill down into specific areas.
                        </li>
                         <li>
                            <Sparkles className="inline h-3 w-3 mr-1"/><strong>Release Notes (Tab 8):</strong> Stay updated with the latest changes and features in the application.
                        </li>
                        <li>
                            <Wand2 className="inline h-3 w-3 mr-1"/><strong>Generate Sample Data (AI):</strong> Use the wand icon in the header to generate sample data if you're starting fresh.
                        </li>
                        <li>
                            <UploadCloud className="inline h-3 w-3 mr-1"/><strong>Upload Data:</strong> Use the upload icons (XML, Excel, CSV per tab) in the header or within specific tabs to import your existing data.
                        </li>
                        <li>
                            <MessageCircle className="inline h-3 w-3 mr-1"/><strong>SpendWise Assistant:</strong> Click the chat icon in the header to ask questions about your current data. The AI uses the data loaded in the app.
                        </li>
                    </ul>
                </section>
                 <section>
                    <h4 className="font-semibold mb-1">General Tips:</h4>
                    <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground">
                        <li>Use the tooltips (hover over icons or elements) for more information.</li>
                        <li>Data is saved locally in your browser. Use the Download/Load XML buttons to backup or transfer your configuration.</li>
                        <li>The application theme (Light, Dark, TADA) can be changed using the selector in the header.</li>
                    </ul>
                </section>
            </div>
        </ScrollArea>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
