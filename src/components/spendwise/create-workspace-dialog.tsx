
"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Globe, Mail, MapPin, Home, Building, PlusCircle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from '../ui/scroll-area';

interface CreateWorkspaceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  uniqueSupplierCountries: string[];
}

interface WorkspaceNameEntry {
  id: string;
  name: string;
}

export default function CreateWorkspaceDialog({ isOpen, onClose, uniqueSupplierCountries }: CreateWorkspaceDialogProps) {
  const { toast } = useToast();
  const [step, setStep] = useState(1); // 1: Form, 2: MFA (mock)

  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [domainName, setDomainName] = useState('');
  const [email, setEmail] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateProvince, setStateProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');
  const [workspaceNames, setWorkspaceNames] = useState<WorkspaceNameEntry[]>([{ id: `ws_${Date.now()}`, name: '' }]);
  const [mfaCode, setMfaCode] = useState('');

  const handleAddWorkspaceName = () => {
    setWorkspaceNames([...workspaceNames, { id: `ws_${Date.now()}_${workspaceNames.length}`, name: '' }]);
  };

  const handleRemoveWorkspaceName = (id: string) => {
    if (workspaceNames.length > 1) {
      setWorkspaceNames(workspaceNames.filter(ws => ws.id !== id));
    }
  };

  const handleWorkspaceNameChange = (id: string, value: string) => {
    setWorkspaceNames(workspaceNames.map(ws => (ws.id === id ? { ...ws, name: value } : ws)));
  };

  const handleSubmitForm = () => {
    // Basic validation
    if (!firstName || !lastName || !email || !country || workspaceNames.some(ws => !ws.name.trim())) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill out all required fields (First Name, Last Name, Email, Country, and at least one Workspace Name).",
      });
      return;
    }
    // Mock submission - in a real app, this would go to a backend
    console.log("Workspace Data:", {
      firstName, lastName, domainName, email,
      address: { streetAddress, city, stateProvince, postalCode, country },
      workspaces: workspaceNames.map(ws => ws.name),
    });
    // Proceed to mock MFA step
    setStep(2); 
  };

  const handleVerifyMfa = () => {
    // Mock MFA verification
    if (mfaCode.length === 6 && /^\d+$/.test(mfaCode)) { // Simple 6-digit check
      toast({
        title: "Workspace Created (Mock)",
        description: "Your workspace details have been submitted and email verified (mocked).",
      });
      handleCloseDialog();
    } else {
      toast({
        variant: "destructive",
        title: "Invalid MFA Code",
        description: "Please enter a 6-digit verification code.",
      });
    }
  };
  
  const handleCloseDialog = () => {
    // Reset form fields and step on close
    setFirstName('');
    setLastName('');
    setDomainName('');
    setEmail('');
    setStreetAddress('');
    setCity('');
    setStateProvince('');
    setPostalCode('');
    setCountry('');
    setWorkspaceNames([{ id: `ws_${Date.now()}`, name: '' }]);
    setMfaCode('');
    setStep(1);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleCloseDialog(); else onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <UserPlus className="mr-2 h-5 w-5" />
            Create New Workspace
          </DialogTitle>
          <DialogDescription>
            {step === 1 ? "Provide your details and desired workspace names." : "Please enter the verification code sent to your email."}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <ScrollArea className="max-h-[60vh] p-1 pr-3">
            <div className="grid gap-4 py-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name <span className="text-destructive">*</span></Label>
                  <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="h-8 text-xs" />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name <span className="text-destructive">*</span></Label>
                  <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} className="h-8 text-xs" />
                </div>
              </div>
              
              <div>
                <Label htmlFor="domainName" className="flex items-center"><Globe className="h-3 w-3 mr-1"/>Domain Name (e.g., company.com)</Label>
                <Input id="domainName" placeholder="yourcompany.com" value={domainName} onChange={(e) => setDomainName(e.target.value)} className="h-8 text-xs" />
              </div>
              <div>
                <Label htmlFor="email" className="flex items-center"><Mail className="h-3 w-3 mr-1"/>Email <span className="text-destructive">*</span></Label>
                <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-8 text-xs" />
              </div>

              <fieldset className="border p-3 rounded-md">
                <legend className="text-xs font-medium px-1 flex items-center"><MapPin className="h-3 w-3 mr-1"/>Address</legend>
                <div className="space-y-3 mt-1">
                  <div>
                    <Label htmlFor="streetAddress">Street Address</Label>
                    <Input id="streetAddress" value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} className="h-8 text-xs" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} className="h-8 text-xs" />
                    </div>
                    <div>
                      <Label htmlFor="stateProvince">State/Province</Label>
                      <Input id="stateProvince" value={stateProvince} onChange={(e) => setStateProvince(e.target.value)} className="h-8 text-xs" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="postalCode">Postal Code</Label>
                      <Input id="postalCode" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} className="h-8 text-xs" />
                    </div>
                    <div>
                      <Label htmlFor="country">Country <span className="text-destructive">*</span></Label>
                       <Select value={country} onValueChange={setCountry}>
                        <SelectTrigger id="country" className="h-8 text-xs"><SelectValue placeholder="Select country" /></SelectTrigger>
                        <SelectContent>
                          {uniqueSupplierCountries.map(c => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
                          <SelectItem value="Other" className="text-xs">Other (Not Listed)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </fieldset>
              
              <fieldset className="border p-3 rounded-md">
                <legend className="text-xs font-medium px-1 flex items-center"><Building className="h-3 w-3 mr-1"/>Workspace Names</legend>
                 <div className="space-y-2 mt-1">
                  {workspaceNames.map((ws, index) => (
                    <div key={ws.id} className="flex items-center gap-2">
                      <Input 
                        placeholder={`Workspace Name ${index + 1} ${index === 0 ? '(required)' : ''}`}
                        value={ws.name}
                        onChange={(e) => handleWorkspaceNameChange(ws.id, e.target.value)}
                        className="h-8 text-xs flex-grow"
                      />
                      {workspaceNames.length > 1 && (
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveWorkspaceName(ws.id)} className="h-7 w-7">
                          <Trash2 className="h-3.5 w-3.5 text-destructive"/>
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={handleAddWorkspaceName} className="text-xs h-7 mt-1">
                    <PlusCircle className="mr-1.5 h-3 w-3" /> Add Another Workspace
                  </Button>
                </div>
              </fieldset>
            </div>
          </ScrollArea>
        )}

        {step === 2 && (
            <div className="space-y-4 py-4">
                <p className="text-sm text-center">A verification code has been sent to <strong>{email}</strong>. <br/> (This is a mock step - enter any 6 digits).</p>
                <div>
                    <Label htmlFor="mfaCode" className="text-center block mb-1">Verification Code</Label>
                    <Input 
                        id="mfaCode" 
                        value={mfaCode} 
                        onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0,6))} 
                        maxLength={6}
                        className="h-10 text-lg tracking-[0.3em] text-center"
                        placeholder="______"
                    />
                </div>
            </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleCloseDialog}>Cancel</Button>
          {step === 1 && <Button type="button" onClick={handleSubmitForm}>Submit & Verify Email</Button>}
          {step === 2 && <Button type="button" onClick={handleVerifyMfa} disabled={mfaCode.length !== 6}>Verify & Create</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
