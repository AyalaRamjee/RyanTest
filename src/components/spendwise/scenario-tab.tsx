
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function ScenarioTab() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center">
          <Lightbulb className="mr-2 h-6 w-6 text-yellow-500" />
          <CardTitle className="text-lg">Scenario Planning</CardTitle>
           <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="ml-2 h-5 w-5">
                <Info className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs max-w-xs">
                This section is for exploring different what-if scenarios by adjusting global parameters or data.
                Functionality to be defined.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center min-h-[200px] border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center">
          <Lightbulb className="h-16 w-16 text-yellow-400 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Scenario Analysis</h3>
          <p className="text-muted-foreground">
            Explore potential impacts of changes to your supply chain.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            (Further functionality for this tab is pending.)
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
