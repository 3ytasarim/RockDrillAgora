import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Mail, MapPin, Send, User, Building2, MessageSquare, Hash } from "lucide-react";
import logoPath from "@assets/AgoraRockDrillLogo_1759477799213.png";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const requestSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  company: z.string().min(2, "Company name is required"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  city: z.string().optional(),
  subject: z.string().min(1, "Please select a subject"),
  product: z.string().min(1, "Product or part number is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type RequestFormData = z.infer<typeof requestSchema>;

interface RequestQuoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function RequestQuoteModal({ open, onOpenChange }: RequestQuoteModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      name: "",
      company: "",
      email: "",
      phone: "",
      city: "",
      subject: "",
      product: "",
      message: "",
    },
  });

  const onSubmit = async (data: RequestFormData) => {
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    console.log("Request submitted:", data);
    
    toast({
      title: "Request Sent Successfully! 🎉",
      description: "We'll contact you within 24 hours.",
    });
    
    form.reset();
    onOpenChange(false);
    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 gap-0 max-h-[95vh] overflow-hidden">
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col max-h-[95vh]"
            >
              {/* Header with Contact Info */}
              <div className="relative bg-gradient-to-br from-primary via-primary/95 to-accent p-6 text-white overflow-hidden flex-shrink-0">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
                
                <DialogHeader className="relative z-10">
                  <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <DialogTitle className="text-3xl md:text-4xl font-black mb-4 text-center flex flex-col items-center justify-center gap-3">
                      <img src={logoPath} alt="Agora Rock Drill" className="h-16 md:h-20 w-auto" />
                      Free Quote Request
                    </DialogTitle>
                  </motion.div>
                  
                  <motion.div 
                    className="grid md:grid-cols-3 gap-3"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-3">
                      <div className="bg-white/20 p-2 rounded-lg">
                        <Phone size={20} />
                      </div>
                      <div className="text-sm">
                        <p className="opacity-80">Phone</p>
                        <p className="font-bold">+90 312 385 60 03</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-3">
                      <div className="bg-white/20 p-2 rounded-lg">
                        <Mail size={20} />
                      </div>
                      <div className="text-sm">
                        <p className="opacity-80">Email</p>
                        <p className="font-bold">agora@agorarockdrill.com</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-3">
                      <div className="bg-white/20 p-2 rounded-lg">
                        <MapPin size={20} />
                      </div>
                      <div className="text-sm">
                        <p className="opacity-80">Location</p>
                        <p className="font-bold">Ankara, Turkey</p>
                      </div>
                    </div>
                  </motion.div>
                </DialogHeader>
              </div>

              {/* Form Content */}
              <div className="p-6 overflow-y-auto flex-1 modal-content-scroll">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    {/* Personal Information */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-foreground">
                        <User size={20} className="text-primary" />
                        Personal Information
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name *</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="John Doe" 
                                  {...field} 
                                  className="h-11"
                                  data-testid="input-name"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="company"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Company Name *</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Company Inc." 
                                  {...field} 
                                  className="h-11"
                                  data-testid="input-company"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email Address *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="email"
                                  placeholder="john@company.com" 
                                  {...field} 
                                  className="h-11"
                                  data-testid="input-email"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number *</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="+90 555 123 45 67" 
                                  {...field} 
                                  className="h-11"
                                  data-testid="input-phone"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City (Optional)</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Istanbul" 
                                  {...field} 
                                  className="h-11"
                                  data-testid="input-city"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </motion.div>

                    {/* Request Details */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-foreground">
                        <MessageSquare size={20} className="text-accent" />
                        Request Details
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="subject"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Subject *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-11" data-testid="select-subject">
                                    <SelectValue placeholder="Select subject" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="price-inquiry">Price Inquiry</SelectItem>
                                  <SelectItem value="product-availability">Product Availability</SelectItem>
                                  <SelectItem value="technical-support">Technical Support</SelectItem>
                                  <SelectItem value="spare-parts">Spare Parts Request</SelectItem>
                                  <SelectItem value="general">General Inquiry</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="product"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Product / Part Number *</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="e.g., COP MD20, 3115600784" 
                                  {...field} 
                                  className="h-11"
                                  data-testid="input-product"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem className="mt-4">
                            <FormLabel>Message / Details *</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Please provide details about your request, quantity, delivery location, etc." 
                                {...field}
                                rows={4}
                                className="resize-none"
                                data-testid="textarea-message"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </motion.div>

                    {/* Submit Button */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="flex justify-end gap-4 pt-3 border-t"
                    >
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="px-8"
                        data-testid="button-cancel"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-bold px-10 shadow-lg hover:shadow-xl transition-all duration-300"
                        data-testid="button-submit"
                      >
                        {isSubmitting ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="mr-2"
                            >
                              <Hash size={20} />
                            </motion.div>
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send size={20} className="mr-2" />
                            Submit Request
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </form>
                </Form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
