import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES } from "@/lib/categories";
import type { Transaction, Category } from "@/hooks/use-store";

const formSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  type: z.enum(["income", "expense"]),
  category: z.string().min(1, "Please select a category"),
  date: z.date({
    required_error: "A date is required.",
  }),
  description: z.string().min(1, "Description is required"),
});

type FormValues = z.infer<typeof formSchema>;

interface TransactionFormProps {
  defaultValues?: Partial<Transaction>;
  onSubmit: (data: Omit<Transaction, "id" | "createdAt">) => void;
  onCancel?: () => void;
  submitLabel?: string;
}

export function TransactionForm({ defaultValues, onSubmit, onCancel, submitLabel = "Save" }: TransactionFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: defaultValues?.amount || 0,
      type: defaultValues?.type || "expense",
      category: defaultValues?.category || "",
      date: defaultValues?.date ? new Date(defaultValues.date) : new Date(),
      description: defaultValues?.description || "",
    },
  });

  const type = form.watch("type");
  
  // Filter categories by selected type
  const availableCategories = Object.values(CATEGORIES).filter(
    (c) => c.type === "both" || c.type === type
  );

  const handleSubmit = (values: FormValues) => {
    onSubmit({
      ...values,
      category: values.category as Category,
      date: values.date.toISOString(),
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Transaction Type</FormLabel>
              <FormControl>
                <div className="flex p-1 bg-muted rounded-lg" data-testid="input-type-toggle">
                  <button
                    type="button"
                    onClick={() => {
                      field.onChange("expense");
                      form.setValue("category", "");
                    }}
                    className={cn(
                      "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all",
                      field.value === "expense" 
                        ? "bg-background shadow-sm text-foreground" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      field.onChange("income");
                      form.setValue("category", "");
                    }}
                    className={cn(
                      "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all",
                      field.value === "income" 
                        ? "bg-background shadow-sm text-foreground" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Income
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                    <Input type="number" step="0.01" className="pl-7" placeholder="0.00" {...field} data-testid="input-amount" />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col justify-end">
                <FormLabel className="mb-2">Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal bg-background",
                          !field.value && "text-muted-foreground"
                        )}
                        data-testid="input-date"
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-background" data-testid="select-category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <cat.icon className={cn("w-4 h-4", cat.color)} />
                        {cat.id}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input placeholder="What was this for?" className="bg-background" {...field} data-testid="input-description" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancel">
              Cancel
            </Button>
          )}
          <Button type="submit" data-testid="button-submit">
            {submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
