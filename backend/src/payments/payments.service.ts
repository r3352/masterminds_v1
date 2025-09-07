import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { EscrowTransaction } from './entities/escrow-transaction.entity';
import { User } from '../users/entities/user.entity';
import { Question } from '../questions/entities/question.entity';
import { Answer } from '../answers/entities/answer.entity';
import { CreatePaymentIntentDto, CreateEscrowDto, ReleaseEscrowDto, RefundEscrowDto, EscrowStatus } from './dto/payments.dto';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(
    @InjectRepository(EscrowTransaction)
    private escrowRepository: Repository<EscrowTransaction>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
    @InjectRepository(Answer)
    private answerRepository: Repository<Answer>,
  ) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });
  }

  async createPaymentIntent(createPaymentDto: CreatePaymentIntentDto, userId: string): Promise<{ clientSecret: string; paymentIntentId: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Ensure user has a Stripe customer ID
    if (!user.stripe_customer_id) {
      const customer = await this.stripe.customers.create({
        email: user.email,
        name: user.full_name,
        metadata: {
          userId: user.id,
        },
      });

      user.stripe_customer_id = customer.id;
      await this.userRepository.save(user);
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(createPaymentDto.amount * 100), // Convert to cents
        currency: createPaymentDto.currency.toLowerCase(),
        customer: user.stripe_customer_id,
        metadata: {
          userId,
          questionId: createPaymentDto.question_id || '',
          type: 'bounty_payment',
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error) {
      throw new InternalServerErrorException(`Payment creation failed: ${error.message}`);
    }
  }

  async createEscrow(createEscrowDto: CreateEscrowDto, userId: string): Promise<EscrowTransaction> {
    const payer = await this.userRepository.findOne({ where: { id: userId } });
    if (!payer) {
      throw new NotFoundException('Payer not found');
    }

    let question = null;
    if (createEscrowDto.question_id) {
      question = await this.questionRepository.findOne({
        where: { id: createEscrowDto.question_id },
        relations: ['author'],
      });
      if (!question) {
        throw new NotFoundException('Question not found');
      }
    }

    let payee = null;
    if (createEscrowDto.payee_id) {
      payee = await this.userRepository.findOne({ where: { id: createEscrowDto.payee_id } });
      if (!payee) {
        throw new NotFoundException('Payee not found');
      }
    }

    // Create payment intent for the escrow
    const paymentIntent = await this.createPaymentIntent({
      amount: createEscrowDto.amount,
      currency: createEscrowDto.currency,
      question_id: createEscrowDto.question_id,
    }, userId);

    const escrow = this.escrowRepository.create({
      payer_id: payer.id,
      payee_id: payee?.id,
      question_id: question.id,
      amount: createEscrowDto.amount,
      currency: createEscrowDto.currency,
      status: EscrowStatus.PENDING,
      stripe_payment_intent_id: paymentIntent.paymentIntentId,
      description: createEscrowDto.description,
      auto_release_at: createEscrowDto.auto_release_days ? 
        new Date(Date.now() + createEscrowDto.auto_release_days * 24 * 60 * 60 * 1000) : null,
    });

    const savedEscrow = await this.escrowRepository.save(escrow);

    return { ...savedEscrow, client_secret: paymentIntent.clientSecret } as any;
  }

  async confirmEscrowPayment(escrowId: string, paymentIntentId: string): Promise<EscrowTransaction> {
    const escrow = await this.escrowRepository.findOne({
      where: { id: escrowId },
      relations: ['payer', 'payee', 'question'],
    });

    if (!escrow) {
      throw new NotFoundException('Escrow transaction not found');
    }

    if (escrow.stripe_payment_intent_id !== paymentIntentId) {
      throw new BadRequestException('Payment intent mismatch');
    }

    try {
      // Verify payment with Stripe
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status !== 'succeeded') {
        throw new BadRequestException('Payment not successful');
      }

      escrow.status = EscrowStatus.HELD;
      escrow.held_at = new Date();
      
      return this.escrowRepository.save(escrow);
    } catch (error) {
      throw new InternalServerErrorException(`Payment confirmation failed: ${error.message}`);
    }
  }

  async releaseEscrow(releaseDto: ReleaseEscrowDto, userId: string): Promise<EscrowTransaction> {
    const escrow = await this.escrowRepository.findOne({
      where: { id: releaseDto.escrow_id },
      relations: ['payer', 'payee', 'question', 'question.author'],
    });

    if (!escrow) {
      throw new NotFoundException('Escrow transaction not found');
    }

    // Check authorization - only payer or question author can release
    const canRelease = escrow.payer.id === userId || 
                      (escrow.question && escrow.question.author.id === userId);
    
    if (!canRelease) {
      throw new BadRequestException('Unauthorized to release this escrow');
    }

    if (escrow.status !== EscrowStatus.HELD) {
      throw new BadRequestException('Escrow is not in held status');
    }

    if (!escrow.payee) {
      throw new BadRequestException('No payee specified for this escrow');
    }

    try {
      // Ensure payee has Stripe Connect account
      if (!escrow.payee.stripe_connect_account_id) {
        throw new BadRequestException('Payee must have a connected Stripe account to receive payments');
      }

      // Calculate fees (platform takes 5%)
      const platformFeeAmount = Math.round(escrow.amount * 0.05 * 100); // 5% in cents
      const payeeAmount = Math.round(escrow.amount * 100) - platformFeeAmount;

      // Create transfer to payee's Connect account
      const transfer = await this.stripe.transfers.create({
        amount: payeeAmount,
        currency: escrow.currency.toLowerCase(),
        destination: escrow.payee.stripe_connect_account_id,
        metadata: {
          escrowId: escrow.id,
          payeeId: escrow.payee.id,
          questionId: escrow.question?.id || '',
        },
      });

      escrow.status = EscrowStatus.RELEASED;
      escrow.released_at = new Date();
      escrow.stripe_transfer_id = transfer.id;
      escrow.platform_fee = platformFeeAmount / 100; // Convert back to dollars
      escrow.release_reason = releaseDto.reason;

      return this.escrowRepository.save(escrow);
    } catch (error) {
      throw new InternalServerErrorException(`Escrow release failed: ${error.message}`);
    }
  }

  async refundEscrow(refundDto: RefundEscrowDto, userId: string): Promise<EscrowTransaction> {
    const escrow = await this.escrowRepository.findOne({
      where: { id: refundDto.escrow_id },
      relations: ['payer', 'payee', 'question'],
    });

    if (!escrow) {
      throw new NotFoundException('Escrow transaction not found');
    }

    // Check authorization - only payer can request refund, or admin
    if (escrow.payer.id !== userId) {
      throw new BadRequestException('Unauthorized to refund this escrow');
    }

    if (escrow.status !== EscrowStatus.HELD) {
      throw new BadRequestException('Escrow is not in held status');
    }

    try {
      // Create refund in Stripe
      const refund = await this.stripe.refunds.create({
        payment_intent: escrow.stripe_payment_intent_id,
        reason: 'requested_by_customer',
        metadata: {
          escrowId: escrow.id,
          refundReason: refundDto.reason,
        },
      });

      escrow.status = EscrowStatus.REFUNDED;
      escrow.refunded_at = new Date();
      escrow.stripe_refund_id = refund.id;
      escrow.refund_reason = refundDto.reason;

      return this.escrowRepository.save(escrow);
    } catch (error) {
      throw new InternalServerErrorException(`Escrow refund failed: ${error.message}`);
    }
  }

  async disputeEscrow(escrowId: string, reason: string, userId: string): Promise<EscrowTransaction> {
    const escrow = await this.escrowRepository.findOne({
      where: { id: escrowId },
      relations: ['payer', 'payee', 'question'],
    });

    if (!escrow) {
      throw new NotFoundException('Escrow transaction not found');
    }

    // Either party can create a dispute
    const canDispute = escrow.payer.id === userId || escrow.payee?.id === userId;
    if (!canDispute) {
      throw new BadRequestException('Unauthorized to dispute this escrow');
    }

    if (escrow.status !== EscrowStatus.HELD) {
      throw new BadRequestException('Can only dispute escrows that are held');
    }

    escrow.status = EscrowStatus.DISPUTED;
    escrow.disputed_at = new Date();
    escrow.dispute_reason = reason;

    return this.escrowRepository.save(escrow);
  }

  async getEscrowById(id: string): Promise<EscrowTransaction> {
    const escrow = await this.escrowRepository.findOne({
      where: { id },
      relations: ['payer', 'payee', 'question', 'question.author'],
    });

    if (!escrow) {
      throw new NotFoundException('Escrow transaction not found');
    }

    return escrow;
  }

  async getEscrowsByUser(userId: string, status?: EscrowStatus): Promise<EscrowTransaction[]> {
    const queryBuilder = this.escrowRepository
      .createQueryBuilder('escrow')
      .leftJoinAndSelect('escrow.payer', 'payer')
      .leftJoinAndSelect('escrow.payee', 'payee')
      .leftJoinAndSelect('escrow.question', 'question')
      .where('escrow.payer.id = :userId OR escrow.payee.id = :userId', { userId })
      .orderBy('escrow.created_at', 'DESC');

    if (status) {
      queryBuilder.andWhere('escrow.status = :status', { status });
    }

    return queryBuilder.getMany();
  }

  async getEscrowsByQuestion(questionId: string): Promise<EscrowTransaction[]> {
    return this.escrowRepository.find({
      where: { question: { id: questionId } },
      relations: ['payer', 'payee', 'question'],
      order: { created_at: 'DESC' },
    });
  }

  async processExpiredEscrows(): Promise<void> {
    const expiredEscrows = await this.escrowRepository
      .createQueryBuilder('escrow')
      .where('escrow.status = :status', { status: EscrowStatus.HELD })
      .andWhere('escrow.auto_release_at < :now', { now: new Date() })
      .getMany();

    for (const escrow of expiredEscrows) {
      try {
        if (escrow.payee) {
          // Auto-release to payee
          await this.releaseEscrow({ 
            escrow_id: escrow.id, 
            reason: 'Auto-release due to expiration' 
          }, escrow.payer.id);
        } else {
          // Auto-refund to payer
          await this.refundEscrow({ 
            escrow_id: escrow.id, 
            reason: 'Auto-refund due to expiration' 
          }, escrow.payer.id);
        }
      } catch (error) {
        console.error(`Failed to process expired escrow ${escrow.id}:`, error);
      }
    }
  }

  async createStripeConnectAccount(userId: string): Promise<{ accountId: string; onboardingUrl: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.stripe_connect_account_id) {
      // Check if account is already fully onboarded
      const account = await this.stripe.accounts.retrieve(user.stripe_connect_account_id);
      if (account.details_submitted && account.charges_enabled) {
        throw new BadRequestException('User already has a fully configured Stripe Connect account');
      }
    }

    try {
      let accountId = user.stripe_connect_account_id;

      if (!accountId) {
        // Create new Connect account
        const account = await this.stripe.accounts.create({
          type: 'express',
          email: user.email,
          metadata: {
            userId: user.id,
          },
        });

        accountId = account.id;
        user.stripe_connect_account_id = accountId;
        await this.userRepository.save(user);
      }

      // Create onboarding link
      const accountLink = await this.stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${process.env.FRONTEND_URL}/payments/connect/refresh`,
        return_url: `${process.env.FRONTEND_URL}/payments/connect/success`,
        type: 'account_onboarding',
      });

      return {
        accountId,
        onboardingUrl: accountLink.url,
      };
    } catch (error) {
      throw new InternalServerErrorException(`Stripe Connect account creation failed: ${error.message}`);
    }
  }

  async getStripeConnectAccountStatus(userId: string): Promise<{
    accountId?: string;
    isOnboarded: boolean;
    chargesEnabled: boolean;
    detailsSubmitted: boolean;
  }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.stripe_connect_account_id) {
      return {
        isOnboarded: false,
        chargesEnabled: false,
        detailsSubmitted: false,
      };
    }

    try {
      const account = await this.stripe.accounts.retrieve(user.stripe_connect_account_id);
      
      return {
        accountId: account.id,
        isOnboarded: account.details_submitted && account.charges_enabled,
        chargesEnabled: account.charges_enabled,
        detailsSubmitted: account.details_submitted,
      };
    } catch (error) {
      console.error('Failed to retrieve Stripe Connect account:', error);
      return {
        accountId: user.stripe_connect_account_id,
        isOnboarded: false,
        chargesEnabled: false,
        detailsSubmitted: false,
      };
    }
  }

  async handleStripeWebhook(event: Stripe.Event): Promise<void> {
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;
        
        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
          break;
        
        case 'account.updated':
          await this.handleAccountUpdated(event.data.object as Stripe.Account);
          break;
        
        default:
          console.log(`Unhandled webhook event type: ${event.type}`);
      }
    } catch (error) {
      console.error(`Error handling webhook ${event.type}:`, error);
      throw error;
    }
  }

  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const escrow = await this.escrowRepository.findOne({
      where: { stripe_payment_intent_id: paymentIntent.id },
    });

    if (escrow && escrow.status === EscrowStatus.PENDING) {
      escrow.status = EscrowStatus.HELD;
      escrow.held_at = new Date();
      await this.escrowRepository.save(escrow);
    }
  }

  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const escrow = await this.escrowRepository.findOne({
      where: { stripe_payment_intent_id: paymentIntent.id },
    });

    if (escrow && escrow.status === EscrowStatus.PENDING) {
      escrow.status = EscrowStatus.REFUNDED;
      escrow.refunded_at = new Date();
      escrow.refund_reason = 'Payment failed';
      await this.escrowRepository.save(escrow);
    }
  }

  private async handleAccountUpdated(account: Stripe.Account): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { stripe_connect_account_id: account.id },
    });

    if (user) {
      // You might want to update user status or send notifications
      console.log(`Stripe Connect account updated for user ${user.id}: charges_enabled=${account.charges_enabled}, details_submitted=${account.details_submitted}`);
    }
  }
}