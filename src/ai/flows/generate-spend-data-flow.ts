
'use server';
/**
 * @fileOverview A Genkit flow to generate sample spend management data.
 *
 * - generateSpendData - A function that calls an LLM to generate parts, suppliers, categories, commodities, and part-supplier associations.
 * - GenerateSpendDataInput - The input type for the generateSpendData function.
 * - GenerateSpendDataOutput - The return type for the generateSpendData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PartSchema = z.object({
  partNumber: z.string()
    .regex(/^\d{3}[A-Z]{3}\d{4}$/, "Part number must be in the format ###AAA#### (e.g., 123ABC4567) with uppercase letters.")
    .describe("The unique part number, strictly in '###AAA####' format (e.g., 123ABC4567). Letters must be uppercase."),
  name: z.string().describe("The descriptive name of the part."),
});

const SupplierSchema = z.object({
  name: z.string().describe("The name of the supplier company. This field is absolutely mandatory."),
  description: z.string().describe("A brief description of the supplier. This field is absolutely mandatory."),
  streetAddress: z.string().describe("A realistic street address for the supplier's main operations. This field is absolutely mandatory."),
  city: z.string().describe("A realistic city for the supplier's location, relevant to the domain and global in nature. This field is absolutely mandatory."),
  stateOrProvince: z.string().describe("A realistic state, province, or region for the supplier's location. This field is absolutely mandatory."),
  postalCode: z.string().describe("A realistic postal or ZIP code for the supplier's location. This field is absolutely mandatory."),
  country: z.string().describe("A realistic country for the supplier's location, relevant to the domain and global in nature. This field is absolutely mandatory."),
});

const PartSupplierAssociationAISchema = z.object({
  partNumber: z.string().describe("The partNumber of the part being associated."),
  supplierName: z.string().describe("The name of the supplier being associated."),
});

const GenerateSpendDataInputSchema = z.object({
  domain: z.string().describe("The industry or domain for which to generate data (e.g., Automotive, Consumer Electronics)."),
  numParts: z.number().int().min(1).describe("The number of unique parts to generate."),
  numSuppliers: z.number().int().min(1).describe("The number of unique suppliers to generate."),
  numCategories: z.number().int().min(1).describe("The number of unique part categories to generate."),
  numCommodities: z.number().int().min(1).describe("The number of unique commodities to generate."),
});
export type GenerateSpendDataInput = z.infer<typeof GenerateSpendDataInputSchema>;

const GenerateSpendDataOutputSchema = z.object({
  parts: z.array(PartSchema).describe("An array of generated parts."),
  suppliers: z.array(SupplierSchema).describe("An array of generated suppliers, each with a realistic global street address, city, state/province, postal code, and country. ALL fields for each supplier are mandatory."),
  categories: z.array(z.string()).describe("An array of generated category names."),
  commodities: z.array(z.string()).describe("An array of generated commodity names."),
  partSupplierAssociations: z.array(PartSupplierAssociationAISchema).describe("An array of associations between parts (by partNumber) and suppliers (by supplierName). Ensure each part is associated with at least one supplier, and aim for a diverse set of mappings."),
});
export type GenerateSpendDataOutput = z.infer<typeof GenerateSpendDataOutputSchema>;

export async function generateSpendData(input: GenerateSpendDataInput): Promise<GenerateSpendDataOutput> {
  return spendDataGenerationFlow(input);
}

const spendDataPrompt = ai.definePrompt({
  name: 'spendDataGenerationPrompt',
  input: {schema: GenerateSpendDataInputSchema},
  output: {schema: GenerateSpendDataOutputSchema},
  prompt: `You are an expert data generator for supply chain and manufacturing applications.
Your task is to generate sample data relevant to a specific industrial domain.

Domain: {{{domain}}}

Please generate the following:
1.  Exactly {{{numParts}}} unique parts. Each part MUST have:
    *   A 'partNumber' that strictly adheres to the format '###AAA####' (three digits, three UPPERCASE letters, four digits). Example: 789GHI1230.
    *   A plausible 'name' for the part, relevant to the domain.
2.  Exactly {{{numSuppliers}}} unique suppliers. EACH supplier MUST have ALL of the following fields populated with realistic data:
    *   A 'name' for the supplier company.
    *   A short 'description' of their business, relevant to the domain.
    *   A realistic 'streetAddress' for their main operations.
    *   A realistic 'city' for their main operations.
    *   A realistic 'stateOrProvince' for their location.
    *   A realistic 'postalCode' for their location.
    *   A realistic 'country' for their main operations. Aim for a global distribution of supplier locations.
    Ensure every supplier object is complete and contains all specified fields. Do not return empty supplier objects or suppliers with missing fields.
3.  Exactly {{{numCategories}}} unique part category names relevant to the domain. These should be general classifications for parts.
4.  Exactly {{{numCommodities}}} unique commodity names relevant to the domain. These should be raw materials or basic production items.
5.  A list of 'partSupplierAssociations'. For each association, specify the 'partNumber' of an existing generated part and the 'supplierName' of an existing generated supplier.
    *   Ensure that each of the {{{numParts}}} parts is associated with at least one supplier.
    *   A supplier can be associated with multiple parts.
    *   The total number of associations should be reasonable, for example, between {{{numParts}}} and {{{numParts}}} * 2.

Your output MUST be a valid JSON object that strictly adheres to the provided output schema. Ensure all part numbers are unique and correctly formatted. Ensure all names (parts, suppliers, categories, commodities) are unique within their respective lists. Ensure part numbers and supplier names in associations correctly refer to generated parts and suppliers. CRITICALLY: Ensure ALL supplier objects in the 'suppliers' array are fully populated with all required fields (name, description, streetAddress, city, stateOrProvince, postalCode, country).
`,
});

const spendDataGenerationFlow = ai.defineFlow(
  {
    name: 'spendDataGenerationFlow',
    inputSchema: GenerateSpendDataInputSchema,
    outputSchema: GenerateSpendDataOutputSchema,
  },
  async (input) => {
    const {output} = await spendDataPrompt(input);
    if (!output) {
      throw new Error("AI failed to generate valid data.");
    }
    // Basic check to ensure suppliers array is not empty if numSuppliers > 0
    if (input.numSuppliers > 0 && (!output.suppliers || output.suppliers.length === 0)) {
        throw new Error(`AI failed to generate any suppliers, but ${input.numSuppliers} were requested.`);
    }
    // Basic check for empty supplier objects or missing names
    if (output.suppliers) {
        for (let i = 0; i < output.suppliers.length; i++) {
            const supplier = output.suppliers[i];
            if (Object.keys(supplier).length === 0) {
                 throw new Error(`AI generated an empty supplier object at index ${i}.`);
            }
            if (!supplier.name) {
                throw new Error(`AI generated a supplier without a name at index ${i}. Data: ${JSON.stringify(supplier)}`);
            }
        }
    }
    return output;
  }
);

    
