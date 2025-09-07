"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Zap, Crown, Users } from "lucide-react";

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);

  const plans = [
    {
      name: "Basic",
      description: "Perfect for getting started with expert Q&A",
      price: { monthly: 0, annual: 0 },
      icon: <Users className="h-6 w-6" />,
      popular: false,
      features: [
        "Ask up to 5 questions per month",
        "Basic search and filtering",
        "Community access", 
        "Email notifications",
        "Standard support response time"
      ],
      limits: [
        "No bounty questions",
        "Limited to public groups"
      ]
    },
    {
      name: "Pro", 
      description: "For professionals who need reliable expert answers",
      price: { monthly: 29, annual: 25 },
      icon: <Star className="h-6 w-6" />,
      popular: true,
      features: [
        "Unlimited questions",
        "Set bounties up to $100",
        "Priority expert matching",
        "Advanced search and filters",
        "Private group access",
        "Direct expert messaging",
        "Priority support",
        "Analytics dashboard"
      ],
      limits: []
    },
    {
      name: "Expert",
      description: "For power users and expert consultants",
      price: { monthly: 99, annual: 79 },
      icon: <Crown className="h-6 w-6" />,
      popular: false,
      features: [
        "Everything in Pro",
        "Unlimited bounties (any amount)",
        "Expert verification badge",
        "Revenue sharing from answers",
        "Custom expert profile",
        "API access",
        "White-label options",
        "Dedicated account manager"
      ],
      limits: []
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Get the expert answers you need with transparent, flexible pricing
        </p>
        
        <div className="flex items-center justify-center space-x-4 mb-8">
          <Button
            variant={!isAnnual ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsAnnual(false)}
          >
            Monthly
          </Button>
          <Button
            variant={isAnnual ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsAnnual(true)}
          >
            Annual
            {isAnnual && (
              <Badge variant="secondary" className="ml-2">
                Save 20%
              </Badge>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        {plans.map((plan) => (
          <Card key={plan.name} className={`relative ${plan.popular ? 'border-primary shadow-lg scale-105' : ''}`}>
            {plan.popular && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                Most Popular
              </Badge>
            )}
            
            <CardHeader className="text-center pb-2">
              <div className="flex justify-center mb-4">
                {plan.icon}
              </div>
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="text-center py-4">
                <div className="text-4xl font-bold">
                  ${isAnnual ? plan.price.annual : plan.price.monthly}
                  <span className="text-lg font-normal text-muted-foreground">
                    {plan.price.monthly > 0 ? '/month' : ''}
                  </span>
                </div>
                {isAnnual && plan.price.monthly > 0 && (
                  <div className="text-sm text-muted-foreground">
                    Billed annually (${plan.price.annual * 12}/year)
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent>
              <Button 
                className={`w-full mb-6 ${plan.popular ? '' : 'variant-outline'}`}
                variant={plan.popular ? 'default' : 'outline'}
              >
                {plan.name === 'Basic' ? 'Get Started Free' : 'Start Free Trial'}
              </Button>

              <div className="space-y-3">
                <h4 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">
                  Included Features
                </h4>
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
                
                {plan.limits.length > 0 && (
                  <>
                    <h4 className="font-medium text-sm uppercase tracking-wide text-muted-foreground mt-4">
                      Limitations
                    </h4>
                    {plan.limits.map((limit, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <span className="text-muted-foreground text-sm">•</span>
                        <span className="text-sm text-muted-foreground">{limit}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center mb-12">
        <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
        <div className="max-w-3xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-left">How do bounties work?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-left text-muted-foreground">
                Bounties are optional rewards you can set on your questions to incentivize high-quality answers. 
                The bounty amount is held in escrow and awarded to the best answer as determined by you.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-left">Can I change plans anytime?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-left text-muted-foreground">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, 
                and we'll prorate any billing adjustments.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-left">What happens to unused questions?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-left text-muted-foreground">
                Unused questions from Basic plans don't roll over to the next month. Pro and Expert plans 
                have unlimited questions, so this isn't a concern.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}