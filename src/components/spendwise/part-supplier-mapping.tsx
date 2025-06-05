import React, { useState, useRef } from 'react';
import type { Part, Supplier, PartSupplierAssociation } from '@/types/spendwise';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Package, Building, ArrowRightLeft, UploadCloud, Info, Trash2, Plus, Target, CheckCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface PartSupplierMappingTabProps {
  parts: Part[];
  suppliers: Supplier[];
  partSupplierAssociations: PartSupplierAssociation[];
  setPartSupplierAssociations: React.Dispatch<React.SetStateAction<PartSupplierAssociation[]>>;
  onOpenUploadDialog: () => void;
}

interface DragItem {
  id: string;
  type: 'part' | 'supplier';
  data: Part | Supplier;
}

export default function PartSupplierMappingTab({ 
  parts, 
  suppliers, 
  partSupplierAssociations, 
  setPartSupplierAssociations, 
  onOpenUploadDialog 
}: PartSupplierMappingTabProps) {
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);
  const [hoveredMapping, setHoveredMapping] = useState<string | null>(null);
  const dragCounterRef = useRef(0);

  const getPartDisplay = (partId: string) => {
    const part = parts.find(p => p.id === partId);
    return part ? `${part.name} (${part.partNumber})` : 'Unknown Part';
  };

  const getSupplierDisplay = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    return supplier ? `${supplier.name} (${supplier.supplierId})` : 'Unknown Supplier';
  };

  const getPartAssociationCount = (partId: string) => {
    return partSupplierAssociations.filter(a => a.partId === partId).length;
  };

  const getSupplierAssociationCount = (supplierId: string) => {
    return partSupplierAssociations.filter(a => a.supplierId === supplierId).length;
  };

  const isValidDropTarget = (dragType: 'part' | 'supplier', targetType: string, targetId?: string) => {
    if (!draggedItem || !targetId) return false;
    
    if (dragType === 'part' && targetType === 'supplier') {
      // Check if this part-supplier association already exists
      return !partSupplierAssociations.some(a => 
        a.partId === draggedItem.data.id && a.supplierId === targetId
      );
    }
    
    if (dragType === 'supplier' && targetType === 'part') {
      // Check if this supplier-part association already exists
      return !partSupplierAssociations.some(a => 
        a.supplierId === draggedItem.data.id && a.partId === targetId
      );
    }
    
    return false;
  };

  const handleDragStart = (e: React.DragEvent, item: DragItem) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', ''); // For compatibility
    
    // Create a custom drag image
    const dragImage = document.createElement('div');
    dragImage.style.cssText = `
      padding: 8px 16px;
      background: #3b82f6;
      color: white;
      border-radius: 8px;
      font-size: 12px;
      position: absolute;
      top: -1000px;
      left: -1000px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    dragImage.textContent = item.type === 'part' 
      ? `📦 ${(item.data as Part).name}` 
      : `🏢 ${(item.data as Supplier).name}`;
    
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    
    setTimeout(() => document.body.removeChild(dragImage), 0);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverTarget(null);
    dragCounterRef.current = 0;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDragEnter = (e: React.DragEvent, targetType: string) => {
    e.preventDefault();
    dragCounterRef.current++;
    setDragOverTarget(targetType);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setDragOverTarget(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetType: string, targetId?: string) => {
    e.preventDefault();
    dragCounterRef.current = 0;
    setDragOverTarget(null);

    if (!draggedItem) return;

    // Handle direct part-to-supplier or supplier-to-part drops
    if (targetType === 'supplier' && draggedItem.type === 'part' && targetId) {
      createAssociation(draggedItem.data.id, targetId);
    } else if (targetType === 'part' && draggedItem.type === 'supplier' && targetId) {
      createAssociation(targetId, draggedItem.data.id);
    } else if (targetType === 'mapping') {
      // Fallback: drop in mapping area
      if (draggedItem.type === 'part') {
        const availableSupplier = suppliers.find(s => !isSupplierMapped(s.id)) || suppliers[0];
        if (availableSupplier) {
          createAssociation(draggedItem.data.id, availableSupplier.id);
        }
      } else if (draggedItem.type === 'supplier') {
        const availablePart = parts.find(p => !isPartMapped(p.id)) || parts[0];
        if (availablePart) {
          createAssociation(availablePart.id, draggedItem.data.id);
        }
      }
    }

    setDraggedItem(null);
  };

  const createAssociation = (partId: string, supplierId: string) => {
    // Check if association already exists
    const exists = partSupplierAssociations.some(a => 
      a.partId === partId && a.supplierId === supplierId
    );
    
    if (!exists) {
      const newAssociation: PartSupplierAssociation = {
        id: `psa_drag_${Date.now()}_${Math.random()}`,
        partId,
        supplierId
      };
      setPartSupplierAssociations(prev => [...prev, newAssociation]);
    }
  };

  const handleRemoveAssociation = (associationId: string) => {
    setPartSupplierAssociations(prev => prev.filter(a => a.id !== associationId));
  };

  const handleQuickMap = () => {
    // Create one-to-one mappings for parts that don't have any suppliers yet
    const newAssociations: PartSupplierAssociation[] = [];
    
    parts.forEach((part, index) => {
      const hasAssociations = partSupplierAssociations.some(a => a.partId === part.id);
      
      if (!hasAssociations && suppliers.length > 0) {
        // Assign to a supplier in round-robin fashion
        const supplierIndex = index % suppliers.length;
        const supplier = suppliers[supplierIndex];
        
        newAssociations.push({
          id: `psa_quickmap_${Date.now()}_${index}`,
          partId: part.id,
          supplierId: supplier.id
        });
      }
    });
    
    if (newAssociations.length > 0) {
      setPartSupplierAssociations(prev => [...prev, ...newAssociations]);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <ArrowRightLeft className="mr-2 h-6 w-6" />
            <div>
              <CardTitle className="text-lg">Source & Mix Parts with Suppliers</CardTitle>
              <CardDescription className="text-sm">
                Drag parts onto suppliers (or vice versa) to create many-to-many sourcing relationships
              </CardDescription>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="ml-2 h-5 w-5">
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs max-w-xs">
                  Drag parts directly onto suppliers to create associations. Each part can be 
                  sourced from multiple suppliers. Green ring indicates valid drop target.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleQuickMap} size="sm" variant="outline">
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Quick Start
            </Button>
            <Button onClick={onOpenUploadDialog} size="sm" variant="outline">
              <UploadCloud className="mr-1.5 h-3.5 w-3.5" /> Upload CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="grid md:grid-cols-3 gap-6 text-xs">
        {/* Parts Column */}
        <section>
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <Package className="mr-2 h-5 w-5 text-primary" /> 
            Available Parts ({parts.length} total)
          </h3>
          <ScrollArea className="h-[400px] border rounded-md p-3 bg-gradient-to-b from-blue-50/50 to-blue-100/30 dark:from-blue-950/30 dark:to-blue-900/20">
            <div className="space-y-2">
              {parts.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No parts available.
                </p>
              )}
              {parts.map((part) => {
                const associationCount = getPartAssociationCount(part.id);
                const isDropTarget = draggedItem?.type === 'supplier' && 
                  isValidDropTarget('supplier', 'part', part.id);
                
                return (
                  <Card 
                    key={part.id} 
                    className={`p-3 cursor-grab active:cursor-grabbing transition-all duration-200 hover:shadow-lg ${
                      isDropTarget && dragOverTarget === `part-${part.id}`
                        ? 'ring-2 ring-green-400 bg-green-50 dark:bg-green-950/30 scale-105' 
                        : 'bg-white dark:bg-gray-800 hover:scale-105'
                    }`}
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, { id: part.id, type: 'part', data: part })}
                    onDragEnd={handleDragEnd}
                    onDragOver={handleDragOver}
                    onDragEnter={(e) => handleDragEnter(e, `part-${part.id}`)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, 'part', part.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm flex items-center">
                          <Package className="h-3 w-3 text-blue-500 mr-1" />
                          {part.name}
                          {associationCount > 0 && (
                            <span className="ml-2 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full">
                              {associationCount} supplier{associationCount !== 1 ? 's' : ''}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">{part.partNumber}</p>
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          ${part.price} • {part.annualDemand.toLocaleString()} units
                        </p>
                      </div>
                      {isDropTarget && dragOverTarget === `part-${part.id}` && (
                        <div className="flex items-center text-green-600 dark:text-green-400">
                          <Target className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </section>

        {/* Suppliers Column */}
        <section>
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <Building className="mr-2 h-5 w-5 text-primary" /> 
            Available Suppliers ({suppliers.length} total)
          </h3>
          <ScrollArea className="h-[400px] border rounded-md p-3 bg-gradient-to-b from-purple-50/50 to-purple-100/30 dark:from-purple-950/30 dark:to-purple-900/20">
            <div className="space-y-2">
              {suppliers.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No suppliers available.
                </p>
              )}
              {suppliers.map((supplier) => {
                const associationCount = getSupplierAssociationCount(supplier.id);
                const isDropTarget = draggedItem?.type === 'part' && 
                  isValidDropTarget('part', 'supplier', supplier.id);
                
                return (
                  <Card 
                    key={supplier.id} 
                    className={`p-3 cursor-grab active:cursor-grabbing transition-all duration-200 hover:shadow-lg ${
                      isDropTarget && dragOverTarget === `supplier-${supplier.id}`
                        ? 'ring-2 ring-green-400 bg-green-50 dark:bg-green-950/30 scale-105' 
                        : 'bg-white dark:bg-gray-800 hover:scale-105'
                    }`}
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, { id: supplier.id, type: 'supplier', data: supplier })}
                    onDragEnd={handleDragEnd}
                    onDragOver={handleDragOver}
                    onDragEnter={(e) => handleDragEnter(e, `supplier-${supplier.id}`)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, 'supplier', supplier.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm flex items-center">
                          <Building className="h-3 w-3 text-purple-500 mr-1" />
                          {supplier.name}
                          {associationCount > 0 && (
                            <span className="ml-2 px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-full">
                              {associationCount} part{associationCount !== 1 ? 's' : ''}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">{supplier.supplierId}</p>
                        <p className="text-xs text-purple-600 dark:text-purple-400">
                          {supplier.country} • {supplier.city}
                        </p>
                      </div>
                      {isDropTarget && dragOverTarget === `supplier-${supplier.id}` && (
                        <div className="flex items-center text-green-600 dark:text-green-400">
                          <Target className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </section>
        
        {/* Mapping Area */}
        <section>
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <Target className="mr-2 h-5 w-5 text-accent" /> 
            Mapped Relationships ({partSupplierAssociations.length})
          </h3>
          
          <div
            className={`min-h-[400px] border-2 border-dashed rounded-lg transition-all duration-300 ${
              dragOverTarget === 'mapping'
                ? 'border-green-400 bg-green-50/50 dark:bg-green-950/20 scale-105'
                : 'border-accent/50 bg-accent/5'
            }`}
            onDragOver={handleDragOver}
            onDragEnter={(e) => handleDragEnter(e, 'mapping')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'mapping')}
          >
            {partSupplierAssociations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <Target className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground font-medium mb-2">
                  Drop Zone
                </p>
                <p className="text-xs text-muted-foreground max-w-xs">
                  Drag parts directly onto suppliers (or suppliers onto parts) to create relationships. 
                  Use "Quick Start" to give each unassigned part one supplier.
                </p>
                {dragOverTarget === 'mapping' && (
                  <div className="mt-4 px-4 py-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <p className="text-green-700 dark:text-green-300 text-sm font-medium">
                      Drop to create mapping!
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <ScrollArea className="h-[400px] p-2">
                <div className="space-y-2">
                  {partSupplierAssociations.map((assoc) => (
                    <Card 
                      key={assoc.id} 
                      className={`p-3 transition-all duration-200 hover:shadow-md ${
                        hoveredMapping === assoc.id ? 'ring-2 ring-blue-200 dark:ring-blue-800' : ''
                      }`}
                      onMouseEnter={() => setHoveredMapping(assoc.id)}
                      onMouseLeave={() => setHoveredMapping(null)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <Package className="h-4 w-4 text-blue-500 mr-2" />
                            <p className="text-sm font-medium">
                              {getPartDisplay(assoc.partId)}
                            </p>
                          </div>
                          <div className="flex items-center">
                            <Building className="h-4 w-4 text-purple-500 mr-2" />
                            <p className="text-sm">
                              {getSupplierDisplay(assoc.supplierId)}
                            </p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 hover:bg-red-50 dark:hover:bg-red-950/30" 
                          onClick={() => handleRemoveAssociation(assoc.id)}
                          aria-label="Remove Association"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </section>
      </CardContent>
    </Card>
  );
}