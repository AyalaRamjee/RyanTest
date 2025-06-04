
"use client";

import { useState, useRef, useEffect } from 'react';
import type { Part, Supplier, PartCategoryMapping, PartCommodityMapping, PartSupplierAssociation } from '@/types/spendwise';
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
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, Loader2, User } from "lucide-react";
import { querySpendData } from '@/ai/flows/query-spend-data-flow';
import { useToast } from "@/hooks/use-toast";

interface SpendWiseBotProps {
  parts: Part[];
  suppliers: Supplier[];
  partCategoryMappings: PartCategoryMapping[];
  partCommodityMappings: PartCommodityMapping[];
  partSupplierAssociations: PartSupplierAssociation[];
  tariffChargePercent: number;
  totalLogisticsCostPercent: number;
  homeCountry: string;
  totalAnnualSpend: number;
  totalParts: number;
  totalSuppliers: number;
  totalCategories: number;
  totalCommodities: number;
}

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
}

export default function SpendWiseBot({
  parts,
  suppliers,
  partCategoryMappings,
  partCommodityMappings,
  partSupplierAssociations,
  tariffChargePercent,
  totalLogisticsCostPercent,
  homeCountry,
  totalAnnualSpend,
  totalParts,
  totalSuppliers,
  totalCategories,
  totalCommodities,
}: SpendWiseBotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = { id: Date.now().toString() + '_user', sender: 'user', text: inputValue };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const inputForAI = {
        question: userMessage.text,
        partsData: JSON.stringify(parts.map(({ id, freightOhdCost, ...rest}) => ({...rest, freightOhdCostPercent: (freightOhdCost * 100).toFixed(2) + '%'}))), // Show F&OHD as %
        suppliersData: JSON.stringify(suppliers),
        partCategoryMappingsData: JSON.stringify(partCategoryMappings),
        partCommodityMappingsData: JSON.stringify(partCommodityMappings),
        partSupplierAssociationsData: JSON.stringify(partSupplierAssociations),
        tariffPercent: tariffChargePercent,
        logisticsPercent: totalLogisticsCostPercent,
        homeCountry: homeCountry,
        totalAnnualSpend: totalAnnualSpend,
        totalParts,
        totalSuppliers,
        totalCategories,
        totalCommodities,
      };
      
      const response = await querySpendData(inputForAI);
      const botMessage: Message = { id: Date.now().toString() + '_bot', sender: 'bot', text: response.answer };
      setMessages(prev => [...prev, botMessage]);

    } catch (error) {
      console.error("Error querying spend data:", error);
      const errorMessage: Message = { id: Date.now().toString() + '_error', sender: 'bot', text: "Sorry, I encountered an error. Please try again." };
      setMessages(prev => [...prev, errorMessage]);
      toast({ variant: "destructive", title: "Bot Error", description: "Could not get a response from the AI." });
    } finally {
      setIsLoading(false);
    }
  };
  
  const openBot = () => {
    setMessages([]); // Clear previous messages when opening
    setIsOpen(true);
  }

  return (
    <>
      <Button variant="outline" size="icon" onClick={openBot} aria-label="Open SpendWise Assistant">
        <Bot className="h-5 w-5" />
      </Button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-lg h-[70vh] flex flex-col p-0">
          <DialogHeader className="p-4 border-b">
            <DialogTitle className="flex items-center">
              <Bot className="mr-2 h-5 w-5" />
              SpendWise Assistant
            </DialogTitle>
            <DialogDescription className="text-xs">
              Ask questions about your current spend data. The AI uses the data loaded in the app.
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="flex-grow p-4 overflow-y-auto" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-3 rounded-lg max-w-[80%] text-sm ${
                    msg.sender === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {msg.sender === 'user' && <User className="inline h-4 w-4 mr-1 mb-0.5"/>}
                    {msg.sender === 'bot' && <Bot className="inline h-4 w-4 mr-1 mb-0.5"/>}
                    {msg.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="p-3 rounded-lg bg-muted text-muted-foreground animate-pulse">
                    <Loader2 className="inline h-4 w-4 mr-1 animate-spin" /> Thinking...
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          
          <DialogFooter className="p-4 border-t">
            <div className="flex w-full items-center space-x-2">
              <Input
                id="bot-input"
                placeholder="Ask about your data..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
                disabled={isLoading}
                className="flex-grow"
              />
              <Button type="submit" size="icon" onClick={handleSendMessage} disabled={isLoading || !inputValue.trim()}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span className="sr-only">Send message</span>
              </Button>
            </div>
          </DialogFooter>
           <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground sr-only">
            Close
          </DialogClose>
        </DialogContent>
      </Dialog>
    </>
  );
}
