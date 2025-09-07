import { gql } from '@apollo/client';

export const CREATE_PAYMENT_INTENT = gql`
  mutation CreatePaymentIntent($createPaymentIntentDto: CreatePaymentIntentDto!) {
    createPaymentIntent(createPaymentIntentDto: $createPaymentIntentDto) {
      clientSecret
      paymentIntentId
      amount
      currency
    }
  }
`;

export const CREATE_ESCROW = gql`
  mutation CreateEscrow($createEscrowDto: CreateEscrowDto!) {
    createEscrow(createEscrowDto: $createEscrowDto) {
      id
      amount
      status
      clientSecret
      question {
        id
        title
      }
      payer {
        id
        name
      }
    }
  }
`;

export const RELEASE_ESCROW = gql`
  mutation ReleaseEscrow($releaseEscrowDto: ReleaseEscrowDto!) {
    releaseEscrow(releaseEscrowDto: $releaseEscrowDto) {
      id
      status
      releasedAt
      payee {
        id
        name
      }
    }
  }
`;

export const REFUND_ESCROW = gql`
  mutation RefundEscrow($refundEscrowDto: RefundEscrowDto!) {
    refundEscrow(refundEscrowDto: $refundEscrowDto) {
      id
      status
      refundedAt
      refundReason
    }
  }
`;

export const GET_ESCROW_TRANSACTIONS = gql`
  query GetEscrowTransactions($skip: Int, $take: Int, $status: EscrowStatus) {
    escrowTransactions(skip: $skip, take: $take, status: $status) {
      id
      amount
      status
      createdAt
      releasedAt
      refundedAt
      platformFee
      question {
        id
        title
        author {
          id
          name
        }
      }
      payer {
        id
        name
      }
      payee {
        id
        name
      }
    }
  }
`;

export const GET_ESCROW_TRANSACTION = gql`
  query GetEscrowTransaction($id: String!) {
    escrowTransaction(id: $id) {
      id
      amount
      status
      createdAt
      releasedAt
      refundedAt
      platformFee
      refundReason
      clientSecret
      paymentIntentId
      question {
        id
        title
        author {
          id
          name
        }
        acceptedAnswerId
        status
      }
      payer {
        id
        name
        email
      }
      payee {
        id
        name
        email
      }
    }
  }
`;

export const GET_STRIPE_CONNECT_STATUS = gql`
  query GetStripeConnectStatus {
    stripeConnectStatus {
      accountId
      isConnected
      hasCompletedOnboarding
      accountLink
      charges_enabled
      payouts_enabled
    }
  }
`;

export const CREATE_STRIPE_CONNECT_ACCOUNT = gql`
  mutation CreateStripeConnectAccount {
    createStripeConnectAccount {
      accountId
      accountLink
    }
  }
`;

export const GET_PAYMENT_METHODS = gql`
  query GetPaymentMethods {
    paymentMethods {
      id
      type
      card {
        brand
        last4
        exp_month
        exp_year
      }
      billing_details {
        name
        email
      }
    }
  }
`;