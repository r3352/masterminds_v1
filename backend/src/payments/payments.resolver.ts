import { Resolver, Query, Mutation, Args, ResolveField, Parent } from '@nestjs/graphql';
import { UseGuards, ValidationPipe } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles, Role } from '../auth/decorators/roles.decorator';
import { EscrowTransaction } from './entities/escrow-transaction.entity';
import { User } from '../users/entities/user.entity';
import {
  CreatePaymentIntentDto,
  CreateEscrowDto,
  ReleaseEscrowDto,
  RefundEscrowDto,
  DisputeEscrowDto,
  ConfirmEscrowPaymentDto,
  PaymentIntentResponse,
  StripeConnectResponse,
  StripeConnectStatusResponse,
  EscrowStatsResponse,
  EscrowListResponse,
  EscrowStatus,
} from './dto/payments.dto';
import { MessageResponse } from '../auth/dto/auth.dto';

@Resolver(() => EscrowTransaction)
export class PaymentsResolver {
  constructor(private paymentsService: PaymentsService) {}

  // Payment Intent Mutations
  @UseGuards(JwtAuthGuard)
  @Mutation(() => PaymentIntentResponse)
  async createPaymentIntent(
    @CurrentUser() user: User,
    @Args('input', ValidationPipe) createPaymentDto: CreatePaymentIntentDto,
  ): Promise<PaymentIntentResponse> {
    const result = await this.paymentsService.createPaymentIntent(createPaymentDto, user.id);
    
    return {
      client_secret: result.clientSecret,
      payment_intent_id: result.paymentIntentId,
      amount: createPaymentDto.amount,
      currency: createPaymentDto.currency,
    };
  }

  // Escrow Queries
  @UseGuards(JwtAuthGuard)
  @Query(() => EscrowTransaction)
  async escrow(@Args('id') id: string): Promise<EscrowTransaction> {
    return this.paymentsService.getEscrowById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => [EscrowTransaction])
  async myEscrows(
    @CurrentUser() user: User,
    @Args('status', { type: () => EscrowStatus, nullable: true }) status?: EscrowStatus,
  ): Promise<EscrowTransaction[]> {
    return this.paymentsService.getEscrowsByUser(user.id, status);
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => [EscrowTransaction])
  async escrowsByQuestion(@Args('questionId') questionId: string): Promise<EscrowTransaction[]> {
    return this.paymentsService.getEscrowsByQuestion(questionId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Query(() => EscrowStatsResponse)
  async escrowStats(): Promise<EscrowStatsResponse> {
    // This would typically involve complex database queries
    // Simplified implementation for now
    return {
      total_escrows: 0,
      held_escrows: 0,
      released_escrows: 0,
      disputed_escrows: 0,
      total_amount_held: 0,
      total_amount_released: 0,
      total_platform_fees: 0,
    };
  }

  // Escrow Mutations
  @UseGuards(JwtAuthGuard)
  @Mutation(() => EscrowTransaction)
  async createEscrow(
    @CurrentUser() user: User,
    @Args('input', ValidationPipe) createEscrowDto: CreateEscrowDto,
  ): Promise<EscrowTransaction> {
    return this.paymentsService.createEscrow(createEscrowDto, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => EscrowTransaction)
  async confirmEscrowPayment(
    @Args('input', ValidationPipe) confirmDto: ConfirmEscrowPaymentDto,
  ): Promise<EscrowTransaction> {
    return this.paymentsService.confirmEscrowPayment(
      confirmDto.escrow_id,
      confirmDto.payment_intent_id,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => EscrowTransaction)
  async releaseEscrow(
    @CurrentUser() user: User,
    @Args('input', ValidationPipe) releaseDto: ReleaseEscrowDto,
  ): Promise<EscrowTransaction> {
    return this.paymentsService.releaseEscrow(releaseDto, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => EscrowTransaction)
  async refundEscrow(
    @CurrentUser() user: User,
    @Args('input', ValidationPipe) refundDto: RefundEscrowDto,
  ): Promise<EscrowTransaction> {
    return this.paymentsService.refundEscrow(refundDto, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => EscrowTransaction)
  async disputeEscrow(
    @CurrentUser() user: User,
    @Args('input', ValidationPipe) disputeDto: DisputeEscrowDto,
  ): Promise<EscrowTransaction> {
    return this.paymentsService.disputeEscrow(
      disputeDto.escrow_id,
      disputeDto.reason,
      user.id,
    );
  }

  // Stripe Connect Operations
  @UseGuards(JwtAuthGuard)
  @Mutation(() => StripeConnectResponse)
  async createStripeConnectAccount(@CurrentUser() user: User): Promise<StripeConnectResponse> {
    const result = await this.paymentsService.createStripeConnectAccount(user.id);
    
    return {
      account_id: result.accountId,
      onboarding_url: result.onboardingUrl,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => StripeConnectStatusResponse)
  async stripeConnectStatus(@CurrentUser() user: User): Promise<StripeConnectStatusResponse> {
    const status = await this.paymentsService.getStripeConnectAccountStatus(user.id);
    
    return {
      account_id: status.accountId,
      is_onboarded: status.isOnboarded,
      charges_enabled: status.chargesEnabled,
      details_submitted: status.detailsSubmitted,
    };
  }

  // Field Resolvers
  @ResolveField(() => Boolean)
  async canRelease(@Parent() escrow: EscrowTransaction, @CurrentUser() user?: User): Promise<boolean> {
    if (!user || escrow.status !== EscrowStatus.HELD) {
      return false;
    }
    
    // Payer or question author can release
    return escrow.payer.id === user.id || 
           (escrow.question && escrow.question.author?.id === user.id);
  }

  @ResolveField(() => Boolean)
  async canRefund(@Parent() escrow: EscrowTransaction, @CurrentUser() user?: User): Promise<boolean> {
    if (!user || escrow.status !== EscrowStatus.HELD) {
      return false;
    }
    
    // Only payer can request refund
    return escrow.payer.id === user.id;
  }

  @ResolveField(() => Boolean)
  async canDispute(@Parent() escrow: EscrowTransaction, @CurrentUser() user?: User): Promise<boolean> {
    if (!user || escrow.status !== EscrowStatus.HELD) {
      return false;
    }
    
    // Either party can dispute
    return escrow.payer.id === user.id || escrow.payee?.id === user.id;
  }

  @ResolveField(() => Boolean)
  async isExpiringSoon(@Parent() escrow: EscrowTransaction): Promise<boolean> {
    if (!escrow.auto_release_at || escrow.status !== EscrowStatus.HELD) {
      return false;
    }
    
    const oneDayFromNow = new Date();
    oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);
    
    return escrow.auto_release_at <= oneDayFromNow;
  }

  @ResolveField(() => String, { nullable: true })
  async timeUntilAutoRelease(@Parent() escrow: EscrowTransaction): Promise<string | null> {
    if (!escrow.auto_release_at || escrow.status !== EscrowStatus.HELD) {
      return null;
    }
    
    const now = new Date();
    const timeLeft = escrow.auto_release_at.getTime() - now.getTime();
    
    if (timeLeft <= 0) {
      return 'Expired';
    }
    
    const days = Math.floor(timeLeft / (24 * 60 * 60 * 1000));
    const hours = Math.floor((timeLeft % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    
    if (days > 0) {
      return `${days}d ${hours}h`;
    } else {
      return `${hours}h`;
    }
  }

  @ResolveField(() => Number)
  async platformFeeAmount(@Parent() escrow: EscrowTransaction): Promise<number> {
    return escrow.platform_fee || (escrow.amount * 0.05); // 5% platform fee
  }

  @ResolveField(() => Number)
  async payeeAmount(@Parent() escrow: EscrowTransaction): Promise<number> {
    const platformFee = escrow.platform_fee || (escrow.amount * 0.05);
    return escrow.amount - platformFee;
  }
}