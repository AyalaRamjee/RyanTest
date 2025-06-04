
'use server';
/**
 * @fileOverview A Genkit flow to answer questions about spend data.
 *
 * - querySpendData - A function that calls an LLM to answer questions based on provided spend data context.
 * - QuerySpendDataInput - The input type for the querySpendData function.
 * - QuerySpendDataOutput - The return type for the querySpendData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const QuerySpendDataInputSchema = z.object({
  question: z.string().describe("The user's question about the spend data."),
  partsData: z.string().describe("A JSON string representation of the array of parts."),
  suppliersData: z.string().describe("A JSON string representation of the array of suppliers."),
  partCategoryMappingsData: z.string().describe("A JSON string representation of the array of part-category mappings."),
  partCommodityMappingsData: z.string().describe("A JSON string representation of the array of part-commodity mappings."),
  partSupplierAssociationsData: z.string().describe("A JSON string representation of the array of part-supplier associations (linking part IDs to supplier IDs)."),
  tariffPercent: z.number().describe("Current global tariff percentage applied to imported parts."),
  logisticsPercent: z.number().describe("Current global logistics cost multiplier applied to freight/OHD costs."),
  homeCountry: z.string().describe("The designated home country for tariff calculations. Parts from suppliers not in this country are considered imported."),
  totalAnnualSpend: z.number().describe("The calculated total annual spend based on current data and global settings."),
  totalParts: z.number().describe("Total number of parts."),
  totalSuppliers: z.number().describe("Total number of suppliers."),
  totalCategories: z.number().describe("Total number of unique categories."),
  totalCommodities: z.number().describe("Total number of unique commodities."),
});
export type QuerySpendDataInput = z.infer<typeof QuerySpendDataInputSchema>;

const QuerySpendDataOutputSchema = z.object({
  answer: z.string().describe("The AI's answer to the user's question."),
});
export type QuerySpendDataOutput = z.infer<typeof QuerySpendDataOutputSchema>;

export async function querySpendData(input: QuerySpendDataInput): Promise<QuerySpendDataOutput> {
  return querySpendDataFlow(input);
}

const spendDataQueryPrompt = ai.definePrompt({
  name: 'spendDataQueryPrompt',
  input: {schema: QuerySpendDataInputSchema},
  output: {schema: QuerySpendDataOutputSchema},
  prompt: `You are a helpful AI assistant for the SpendWise Central application.
Your knowledge is strictly limited to the data provided below.
Answer the user's question based *only* on this data. If the question cannot be answered with the given data, politely state that.
Be concise and clear in your answers.

Current Application Data Context:
- Home Country (for tariff purposes): {{{homeCountry}}}
- Current Tariff Charge on Imported Parts: {{{tariffPercent}}}%
- Current Global Logistics Cost Multiplier: {{{logisticsPercent}}}% (applied to individual part freight/OHD rates)
- Calculated Total Annual Spend: \${{{totalAnnualSpend}}}
- Total Number of Parts: {{{totalParts}}}
- Total Number of Suppliers: {{{totalSuppliers}}}
- Total Number of Unique Part Categories: {{{totalCategories}}}
- Total Number of Unique Part Commodities: {{{totalCommodities}}}

Detailed Data (in JSON format):
Parts:
{{{partsData}}}

Suppliers:
{{{suppliersData}}}

Part-Category Mappings (maps part.id to categoryName):
{{{partCategoryMappingsData}}}

Part-Commodity Mappings (maps part.id to commodityName):
{{{partCommodityMappingsData}}}

Part-Supplier Associations (maps part.id to supplier.id):
{{{partSupplierAssociationsData}}}

User's Question: {{{question}}}

Your Answer:
`,
});

const querySpendDataFlow = ai.defineFlow(
  {
    name: 'querySpendDataFlow',
    inputSchema: QuerySpendDataInputSchema,
    outputSchema: QuerySpendDataOutputSchema,
  },
  async (input) => {
    const {output} = await spendDataQueryPrompt(input);
    if (!output) {
      throw new Error("AI failed to generate an answer.");
    }
    return output;
  }
);

