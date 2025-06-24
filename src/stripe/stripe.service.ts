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
    metadata: { eventId: string; userId: string; ticketType: string },
  ) {
    console.log('StripeService createPaymentIntent:', {
      amountInCents,
      currency,
      metadata,
    });
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amountInCents,
        currency,
        payment_method_types: ['card'],
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
      console.error('Error creating payment intent:', error.message);
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
      console.error('Error retrieving payment intent:', error.message);
      throw new BadRequestException('Failed to retrieve payment intent');
    }
  }

  async createRefund({
    paymentIntentId,
    amount,
    reason,
    idempotencyKey,
  }: {
    paymentIntentId: string;
    amount?: number;
    reason?: string;
    idempotencyKey?: string;
  }) {
    try {
      const refund = await this.stripe.refunds.create(
        {
          payment_intent: paymentIntentId,
          amount,
          reason: reason as any,
        },
        { idempotencyKey },
      );
      console.log('Created refund:', {
        id: refund.id,
        paymentIntentId: refund.payment_intent,
        amount: refund.amount,
        status: refund.status,
      });
      return refund;
    } catch (error) {
      console.error('Error creating refund:', error.message);
      throw new BadRequestException('Failed to create refund');
    }
  }

  async findPaymentIntentByMetadata(
    eventId: string,
    userId: string,
  ): Promise<Stripe.PaymentIntent | null> {
    try {
      const paymentIntents = await this.stripe.paymentIntents.list({
        limit: 100,
      });
      const paymentIntent = paymentIntents.data.find(
        (pi) =>
          pi.metadata.eventId === eventId &&
          pi.metadata.userId === userId &&
          pi.status === 'succeeded',
      );
      if (paymentIntent) {
        console.log('Found payment intent by metadata:', {
          id: paymentIntent.id,
          metadata: paymentIntent.metadata,
        });
      } else {
        console.log(
          `No payment intent found for event ${eventId}, user ${userId}`,
        );
      }
      return paymentIntent || null;
    } catch (error) {
      console.error('Error finding payment intent by metadata:', error.message);
      return null;
    }
  }

  async confirmPaymentIntent(paymentIntentId: string) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.confirm(
        paymentIntentId,
        {
          payment_method: 'pm_card_visa',
        },
      );
      console.log('Confirmed payment intent:', {
        id: paymentIntent.id,
        status: paymentIntent.status,
      });
      return paymentIntent;
    } catch (error) {
      console.error('Error confirming payment intent:', error.message);
      throw new BadRequestException('Failed to confirm payment intent');
    }
  }
}
