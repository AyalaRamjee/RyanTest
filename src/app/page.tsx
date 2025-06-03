import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UpdatePartsTab from "@/components/spendwise/update-parts";
import UpdateSuppliersTab from "@/components/spendwise/update-suppliers";
import PartSupplierMappingTab from "@/components/spendwise/part-supplier-mapping";
import UploadPartCategoryTab from "@/components/spendwise/upload-part-category";
import UploadPartCommodityTab from "@/components/spendwise/upload-part-commodity";
import { LogoIcon } from "@/components/icons/logo-icon";
import { Package, Building, ArrowRightLeft, FolderTree, TrendingUp } from "lucide-react";

export default function SpendWiseCentralPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
        <div className="container mx-auto flex h-16 items-center space-x-4 px-4 sm:px-6 lg:px-8">
          <LogoIcon className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-headline font-semibold text-foreground">
            SpendWise Central
          </h1>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
        <Tabs defaultValue="update-parts" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 mb-6">
            <TabsTrigger value="update-parts" className="flex items-center gap-2">
              <Package className="h-4 w-4" /> Parts
            </TabsTrigger>
            <TabsTrigger value="update-suppliers" className="flex items-center gap-2">
              <Building className="h-4 w-4" /> Suppliers
            </TabsTrigger>
            <TabsTrigger value="part-supplier-mapping" className="flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4" /> Source & Mix
            </TabsTrigger>
            <TabsTrigger value="upload-part-category" className="flex items-center gap-2">
              <FolderTree className="h-4 w-4" /> Part Category
            </TabsTrigger>
            <TabsTrigger value="upload-part-commodity" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Part Commodity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="update-parts">
            <UpdatePartsTab />
          </TabsContent>
          <TabsContent value="update-suppliers">
            <UpdateSuppliersTab />
          </TabsContent>
          <TabsContent value="part-supplier-mapping">
            <PartSupplierMappingTab />
          </TabsContent>
          <TabsContent value="upload-part-category">
            <UploadPartCategoryTab />
          </TabsContent>
          <TabsContent value="upload-part-commodity">
            <UploadPartCommodityTab />
          </TabsContent>
        </Tabs>
      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground border-t">
        © {new Date().getFullYear()} SpendWise Central. All rights reserved.
      </footer>
    </div>
  );
}
