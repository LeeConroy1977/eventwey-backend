import { Injectable, BadRequestException } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-05-28.basil',
    });
  }

  async createPaymentIntent(
    amountInCents: number,
    currency: string,
    metadata: any,
  ) {
    console.log('StripeService createPaymentIntent:', {
      amountInCents,
      currency,
      metadata,
    });
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amountInCents, // Already in cents, no further conversion
        currency,
        metadata,
      });
      console.log('Created payment intent:', {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        metadata: paymentIntent.metadata,
      });
      return paymentIntent;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw new BadRequestException('Failed to create payment intent');
    }
  }

  async retrievePaymentIntent(paymentIntentId: string) {
    try {
      const paymentIntent =
        await this.stripe.paymentIntents.retrieve(paymentIntentId);
      console.log('Retrieved payment intent:', {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        metadata: paymentIntent.metadata,
      });
      return paymentIntent;
    } catch (error) {
      console.error('Error retrieving payment intent:', error);
      throw new BadRequestException('Failed to retrieve payment intent');
    }
  }
}
