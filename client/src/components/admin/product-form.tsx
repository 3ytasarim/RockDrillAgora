import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save, Eye, RotateCcw, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { Category } from "@shared/schema";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";

const productFormSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  delkomCode: z.string().min(1, "Delkom code is required"),
  referenceCode: z.string().min(1, "Reference code is required"),
  originalPrice: z.string().min(1, "Original price is required"),
  discountPercentage: z.number().min(0).max(100).optional(),
  categoryId: z.string().optional(),
  brandCompatibility: z.string().optional(),
  stockStatus: z.enum(["in_stock", "out_of_stock", "pre_order"]),
  isFeatured: z.boolean().optional(),
});

type ProductFormData = z.infer<typeof productFormSchema>;

interface ProductFormProps {
  categories: Category[];
}

export default function ProductForm({ categories }: ProductFormProps) {
  const { toast } = useToast();
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("");
  const [publicImagePath, setPublicImagePath] = useState<string>("");

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      delkomCode: "",
      referenceCode: "",
      originalPrice: "",
      discountPercentage: 0,
      categoryId: "",
      brandCompatibility: "",
      stockStatus: "in_stock",
      isFeatured: false,
    },
  });

  const updateProductImageMutation = useMutation({
    mutationFn: async ({ productId, imageURL }: { productId: string; imageURL: string }) => {
      const response = await fetch(`/api/products/${productId}/image`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageURL }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update product image");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Success",
        description: "Product created with image successfully!",
      });
      form.reset();
      setImagePreview("");
      setUploadedImageUrl("");
      setPublicImagePath("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to update product image: " + error.message,
        variant: "destructive",
      });
      form.reset();
      setImagePreview("");
      setUploadedImageUrl("");
      setPublicImagePath("");
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create product");
      }
      
      return response.json();
    },
    onSuccess: async (product) => {
      if (uploadedImageUrl) {
        updateProductImageMutation.mutate({
          productId: product.id,
          imageURL: uploadedImageUrl,
        });
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/products"] });
        toast({
          title: "Success",
          description: "Product created successfully!",
        });
        form.reset();
        setImagePreview("");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProductFormData) => {
    createProductMutation.mutate(data);
  };

  const handleGetUploadParameters = useCallback(async () => {
    const response = await fetch("/api/products/image-upload", {
      method: "POST",
    });
    const { uploadURL, publicPath } = await response.json();
    setPublicImagePath(publicPath);
    setImagePreview(publicPath);
    return {
      method: "PUT" as const,
      url: uploadURL,
    };
  }, []);

  const handleUploadComplete = useCallback((result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const uploadURL = result.successful[0].uploadURL as string;
      setUploadedImageUrl(uploadURL);
      
      toast({
        title: "Image uploaded",
        description: "Image uploaded successfully. Click Save to complete product creation.",
      });
    }
  }, [toast]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Name *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., COP MD20 Piston" {...field} data-testid="product-name-input" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="category-select">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
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
            name="delkomCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Delkom Code *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., 120102772" {...field} data-testid="delkom-code-input" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="referenceCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reference Code *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., 3115600784" {...field} data-testid="reference-code-input" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="originalPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Original Price (€) *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                    data-testid="original-price-input"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="discountPercentage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Discount (%)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    data-testid="discount-input"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="brandCompatibility"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Brand Compatibility</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="brand-select">
                      <SelectValue placeholder="Select Brand" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Atlas Copco">Atlas Copco</SelectItem>
                    <SelectItem value="Epiroc">Epiroc</SelectItem>
                    <SelectItem value="Furukawa">Furukawa</SelectItem>
                    <SelectItem value="Montabert">Montabert</SelectItem>
                    <SelectItem value="CAT">CAT</SelectItem>
                    <SelectItem value="Junjin">Junjin</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="stockStatus"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stock Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="stock-status-select">
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="in_stock">In Stock</SelectItem>
                    <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                    <SelectItem value="pre_order">Pre-order</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Description</FormLabel>
              <FormControl>
                <Textarea
                  rows={4}
                  placeholder="Enter detailed product description..."
                  {...field}
                  data-testid="description-input"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">Product Image</label>
          <div className="border-2 border-dashed border-border rounded-md p-8 text-center">
            {imagePreview ? (
              <div className="space-y-4">
                <img src={imagePreview} alt="Preview" className="max-w-xs mx-auto rounded" />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setImagePreview("");
                    setUploadedImageUrl("");
                    setPublicImagePath("");
                  }}
                >
                  Remove Image
                </Button>
              </div>
            ) : (
              <>
                <i className="fas fa-cloud-upload-alt text-5xl text-muted-foreground mb-3"></i>
                <p className="text-muted-foreground mb-2">Upload product image</p>
                <ObjectUploader
                  maxNumberOfFiles={1}
                  maxFileSize={5242880}
                  onGetUploadParameters={handleGetUploadParameters}
                  onComplete={handleUploadComplete}
                  buttonClassName="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                >
                  <Upload size={16} className="mr-2" />
                  Browse Files
                </ObjectUploader>
                <p className="text-sm text-muted-foreground mt-2">
                  Supported formats: JPG, PNG, WebP (Max 5MB)
                </p>
              </>
            )}
          </div>
        </div>

        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={createProductMutation.isPending}
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
            data-testid="save-product-btn"
          >
            <Save size={16} className="mr-2" />
            {createProductMutation.isPending ? "Saving..." : "Save Product"}
          </Button>
          
          <Button
            type="button"
            variant="secondary"
            className="font-semibold"
            data-testid="preview-product-btn"
          >
            <Eye size={16} className="mr-2" />
            Preview
          </Button>
          
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              form.reset();
              setImagePreview("");
            }}
            className="font-semibold"
            data-testid="reset-form-btn"
          >
            <RotateCcw size={16} className="mr-2" />
            Reset
          </Button>
        </div>
      </form>
    </Form>
  );
}
