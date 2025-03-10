
import React, { useState } from 'react';
import { Coffee, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface BuyMeCoffeeProps {
  creatorName?: string;
}

const BuyMeCoffee: React.FC<BuyMeCoffeeProps> = ({ creatorName = 'the creator' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState('5');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsProcessing(true);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success(`Thank you for your support of $${amount}! 🎉`);
      setIsOpen(false);
    } catch (error) {
      toast.error('Something went wrong with the payment process.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
        <Button 
          onClick={() => setIsOpen(true)}
          className="rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-amber-500 hover:bg-amber-600 text-white"
          size="lg"
        >
          <Coffee className="mr-2 h-5 w-5" />
          <span className="font-medium">Buy me a coffee</span>
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Coffee className="h-5 w-5 text-amber-500" />
              Support This Project
            </DialogTitle>
            <DialogDescription>
              If you find PDFlexo useful, consider supporting {creatorName} with a small donation.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSupport} className="space-y-4 py-4">
            <div className="flex flex-col space-y-2">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-8"
                  required
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 justify-center">
              {[3, 5, 10, 25].map((value) => (
                <Button 
                  key={value} 
                  type="button"
                  variant="outline"
                  className={`px-3 py-1 h-auto ${amount === value.toString() ? 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300' : ''}`}
                  onClick={() => setAmount(value.toString())}
                >
                  ${value}
                </Button>
              ))}
            </div>
            
            <DialogFooter className="sm:justify-center pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsOpen(false)}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-amber-500 hover:bg-amber-600"
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Support Now'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BuyMeCoffee;
