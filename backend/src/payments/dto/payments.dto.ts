import { InputType, Field, ObjectType, Int, Float, registerEnumType } from '@nestjs/graphql';
import { IsString, IsNumber, IsOptional, Min, Max, IsEnum, MinLength, MaxLength } from 'class-validator';

export enum EscrowStatus {
  PENDING = 'pending',
  HELD = 'held',
  RELEASED = 'released',
  REFUNDED = 'refunded',
  DISPUTED = 'disputed',
  EXPIRED = 'expired',
}

registerEnumType(EscrowStatus, {
  name: 'EscrowStatus',
  description: 'The status of an escrow transaction',
});

@InputType()
export class CreatePaymentIntentDto {
  @Field(() => Float)
  @IsNumber()
  @Min(1)
  @Max(10000)
  amount: number;

  @Field({ defaultValue: 'USD' })
  @IsString()
  currency: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  question_id?: string;
}

@InputType()
export class CreateEscrowDto {
  @Field(() => Float)
  @IsNumber()
  @Min(1)
  @Max(10000)
  amount: number;

  @Field({ defaultValue: 'USD' })
  @IsString()
  currency: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  payee_id?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  question_id?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(90)
  auto_release_days?: number;
}

@InputType()
export class ReleaseEscrowDto {
  @Field()
  @IsString()
  escrow_id: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

@InputType()
export class RefundEscrowDto {
  @Field()
  @IsString()
  escrow_id: string;

  @Field()
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  reason: string;
}

@InputType()
export class DisputeEscrowDto {
  @Field()
  @IsString()
  escrow_id: string;

  @Field()
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  reason: string;
}

@InputType()
export class ConfirmEscrowPaymentDto {
  @Field()
  @IsString()
  escrow_id: string;

  @Field()
  @IsString()
  payment_intent_id: string;
}

// Response DTOs
@ObjectType()
export class PaymentIntentResponse {
  @Field()
  client_secret: string;

  @Field()
  payment_intent_id: string;

  @Field(() => Float)
  amount: number;

  @Field()
  currency: string;
}

@ObjectType()
export class StripeConnectResponse {
  @Field()
  account_id: string;

  @Field()
  onboarding_url: string;
}

@ObjectType()
export class StripeConnectStatusResponse {
  @Field({ nullable: true })
  account_id?: string;

  @Field()
  is_onboarded: boolean;

  @Field()
  charges_enabled: boolean;

  @Field()
  details_submitted: boolean;
}

@ObjectType()
export class EscrowStatsResponse {
  @Field(() => Int)
  total_escrows: number;

  @Field(() => Int)
  held_escrows: number;

  @Field(() => Int)
  released_escrows: number;

  @Field(() => Int)
  disputed_escrows: number;

  @Field(() => Float)
  total_amount_held: number;

  @Field(() => Float)
  total_amount_released: number;

  @Field(() => Float)
  total_platform_fees: number;
}

@ObjectType()
export class EscrowListResponse {
  @Field(() => [EscrowTransaction])
  escrows: EscrowTransaction[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;
}

// Import the entity for type reference
import { EscrowTransaction } from '../entities/escrow-transaction.entity';