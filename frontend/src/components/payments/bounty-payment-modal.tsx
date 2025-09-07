"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { StripeProvider } from '@/components/providers/stripe-provider';
import { PaymentForm } from './payment-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, DollarSign } from 'lucide-react';

interface BountyPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: {
    id: string;
    title: string;
    author: {
      name: string;
    };
  };
  onPaymentSuccess: () => void;
}

export function BountyPaymentModal({
  isOpen,
  onClose,
  question,
  onPaymentSuccess,
}: BountyPaymentModalProps) {
  const [step, setStep] = useState<'amount' | 'payment' | 'success'>('amount');
  const [selectedAmount, setSelectedAmount] = useState<number>(0);

  const suggestedAmounts = [10, 25, 50, 100, 250];

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setStep('payment');
  };

  const handlePaymentSuccess = (escrowId: string) => {
    setStep('success');
    setTimeout(() => {
      onPaymentSuccess();
      onClose();
      setStep('amount');
      setSelectedAmount(0);
    }, 2000);
  };

  const handleCancel = () => {
    setStep('amount');
    setSelectedAmount(0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Set Bounty Amount</DialogTitle>
          <DialogDescription>
            Add a bounty to incentivize high-quality answers for "{question.title}"
          </DialogDescription>
        </DialogHeader>

        {step === 'amount' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Choose Bounty Amount</CardTitle>
                <CardDescription>
                  Higher bounties attract more experts and faster responses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {suggestedAmounts.map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      onClick={() => handleAmountSelect(amount)}
                      className="h-16 flex flex-col"
                    >
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1" />
                        <span className="text-lg font-bold">{amount}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {amount < 50 ? 'Basic' : amount < 100 ? 'Premium' : 'Priority'}
                      </span>
                    </Button>
                  ))}
                </div>
                
                <div className="mt-4">
                  <label className="text-sm font-medium">Custom Amount</label>
                  <div className="flex mt-2">
                    <div className="relative flex-1">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="number"
                        min="1"
                        max="1000"
                        placeholder="Enter amount"
                        className="w-full pl-10 pr-4 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (value >= 1 && value <= 1000) {
                            setSelectedAmount(value);
                          }
                        }}
                      />
                    </div>
                    <Button
                      onClick={() => selectedAmount > 0 && handleAmountSelect(selectedAmount)}
                      disabled={selectedAmount <= 0}
                      className="ml-2"
                    >
                      Set Bounty
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2 text-sm text-muted-foreground">
              <h4 className="font-medium text-foreground">How it works:</h4>
              <ul className="space-y-1">
                <li>• Your payment is held securely in escrow</li>
                <li>• Released only when you accept an answer</li>
                <li>• Full refund if no satisfactory answer is provided</li>
                <li>• 5% platform fee applies to released payments</li>
              </ul>
            </div>
          </div>
        )}

        {step === 'payment' && (
          <StripeProvider>
            <PaymentForm
              questionId={question.id}
              amount={selectedAmount}
              onSuccess={handlePaymentSuccess}
              onCancel={handleCancel}
            />
          </StripeProvider>
        )}

        {step === 'success' && (
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-medium mb-2">Bounty Added Successfully!</h3>
            <p className="text-muted-foreground mb-4">
              Your ${selectedAmount} bounty has been set for this question.
            </p>
            <Badge variant="secondary" className="mb-4">
              Payment held in escrow
            </Badge>
            <p className="text-sm text-muted-foreground">
              Experts will now see your bounty and provide high-quality answers.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}