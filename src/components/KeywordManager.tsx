import { useState } from "react";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Hash, Loader2 } from "lucide-react";
import * as yup from "yup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const keywordSchema = yup.object({
  keyword: yup
    .string()
    .trim()
    .required("Keyword is required")
    .min(2, "Keyword must be at least 2 characters")
    .max(50, "Keyword must be less than 50 characters")
    .matches(/^[a-zA-Z0-9\s-]+$/, "Only letters, numbers, spaces and hyphens allowed"),
});

type KeywordFormData = yup.InferType<typeof keywordSchema>;

interface KeywordManagerProps {
  className?: string;
  compact?: boolean;
}

const initialKeywords = [
  { id: "1", text: "brand", isActive: true },
  { id: "2", text: "innovation", isActive: true },
  { id: "3", text: "technology", isActive: true },
  { id: "4", text: "market trends", isActive: true },
];

const suggestions = ["AI", "machine learning", "startup", "product launch", "competitor", "industry news"];

export function KeywordManager({ className, compact = false }: KeywordManagerProps) {
  const [keywords, setKeywords] = useState(initialKeywords);
  const [isAdding, setIsAdding] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<KeywordFormData>();

  const keywordValue = watch("keyword", "");

  const filteredSuggestions = suggestions.filter(
    (s) =>
      s.toLowerCase().includes(keywordValue.toLowerCase()) &&
      !keywords.some((k) => k.text.toLowerCase() === s.toLowerCase())
  );

  const onSubmit = async (data: KeywordFormData) => {
    // Validate with yup
    try {
      await keywordSchema.validate(data);
    } catch (err) {
      if (err instanceof yup.ValidationError) {
        toast.error(err.message);
        return;
      }
    }

    // Check for duplicates
    if (keywords.some((k) => k.text.toLowerCase() === data.keyword.toLowerCase())) {
      toast.error("This keyword already exists");
      return;
    }

    setIsAdding(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 500));

    setKeywords((prev) => [
      ...prev,
      { id: Date.now().toString(), text: data.keyword.trim(), isActive: true },
    ]);
    toast.success(`Keyword "${data.keyword}" added successfully`);
    reset();
    setIsAdding(false);
    setShowSuggestions(false);
  };

  const removeKeyword = (id: string) => {
    const keyword = keywords.find((k) => k.id === id);
    setKeywords((prev) => prev.filter((k) => k.id !== id));
    toast.success(`Keyword "${keyword?.text}" removed`);
  };

  const addSuggestion = (suggestion: string) => {
    setValue("keyword", suggestion);
    setShowSuggestions(false);
    handleSubmit(onSubmit)();
  };

  return (
    <Card className={cn("border border-border", className)}>
      <CardHeader className={compact ? "pb-2 p-4" : "pb-4"}>
        <CardTitle className={cn("flex items-center gap-2", compact ? "text-base" : "text-lg")}>
          <Hash className={cn("text-primary", compact ? "w-4 h-4" : "w-5 h-5")} />
          Tracked Keywords
        </CardTitle>
      </CardHeader>
      <CardContent className={cn(compact ? "p-4 pt-0 space-y-3" : "space-y-4")}>
        {/* Add Keyword Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="relative">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                data-testid="keyword-input"
                {...register("keyword")}
                placeholder="Enter keyword to track..."
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className={cn(errors.keyword && "border-negative focus:ring-negative")}
                aria-label="Keyword input"
                aria-describedby={errors.keyword ? "keyword-error" : undefined}
              />
              {/* Suggestions Dropdown */}
              <AnimatePresence>
                {showSuggestions && filteredSuggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-10 overflow-hidden"
                  >
                    <div className="p-2 text-xs text-muted-foreground border-b border-border">
                      Suggestions
                    </div>
                    {filteredSuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => addSuggestion(suggestion)}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors text-foreground"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <Button
              data-testid="keyword-submit"
              type="submit"
              disabled={isSubmitting || isAdding}
              className="gradient-primary text-white shrink-0"
              aria-label="Add keyword"
            >
              {isAdding ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </>
              )}
            </Button>
          </div>
          {errors.keyword && (
            <p id="keyword-error" className="text-sm text-negative mt-1" role="alert">
              {errors.keyword.message}
            </p>
          )}
        </form>

        {/* Keywords List */}
        <div className="flex flex-wrap gap-2">
          <AnimatePresence mode="popLayout">
            {keywords.map((keyword, index) => (
              <motion.div
                key={keyword.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: index * 0.05 }}
                className="group flex items-center gap-1.5 px-3 py-1.5 bg-accent rounded-full text-sm font-medium text-accent-foreground hover:bg-primary/10 transition-colors"
              >
                <span>{keyword.text}</span>
                <button
                  onClick={() => removeKeyword(keyword.id)}
                  className="p-0.5 rounded-full hover:bg-negative/20 hover:text-negative transition-colors opacity-60 group-hover:opacity-100"
                  aria-label={`Remove keyword ${keyword.text}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {keywords.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No keywords tracked yet. Add one above to get started.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
