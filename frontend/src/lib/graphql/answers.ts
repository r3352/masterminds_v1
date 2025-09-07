import { gql } from '@apollo/client';

export const CREATE_ANSWER = gql`
  mutation CreateAnswer($input: CreateAnswerDto!) {
    createAnswer(input: $input) {
      id
      content
      qualityScore
      isAccepted
      createdAt
      author {
        id
        name
        reputation
        avatar
        role
      }
      question {
        id
        title
      }
    }
  }
`;

export const UPDATE_ANSWER = gql`
  mutation UpdateAnswer($id: String!, $input: UpdateAnswerDto!) {
    updateAnswer(id: $id, input: $input) {
      id
      content
      qualityScore
      updatedAt
    }
  }
`;

export const ACCEPT_ANSWER = gql`
  mutation AcceptAnswer($answerId: String!) {
    acceptAnswer(answerId: $answerId) {
      id
      isAccepted
      question {
        id
        acceptedAnswerId
        status
      }
    }
  }
`;

export const VOTE_ANSWER = gql`
  mutation VoteAnswer($answerId: String!, $voteType: VoteType!) {
    voteAnswer(answerId: $answerId, voteType: $voteType) {
      id
      voteType
      createdAt
    }
  }
`;

export const GET_ANSWER = gql`
  query GetAnswer($id: String!) {
    answer(id: $id) {
      id
      content
      qualityScore
      isAccepted
      createdAt
      updatedAt
      author {
        id
        name
        reputation
        avatar
        role
      }
      question {
        id
        title
        author {
          id
        }
      }
      votes {
        id
        voteType
        user {
          id
        }
      }
      _count {
        votes
      }
    }
  }
`;

export const GET_MY_ANSWERS = gql`
  query GetMyAnswers($skip: Int, $take: Int) {
    myAnswers(skip: $skip, take: $take) {
      id
      content
      qualityScore
      isAccepted
      createdAt
      updatedAt
      question {
        id
        title
        bountyAmount
        author {
          id
          name
        }
      }
      _count {
        votes
      }
    }
  }
`;