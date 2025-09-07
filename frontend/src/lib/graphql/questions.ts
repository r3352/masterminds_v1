import { gql } from '@apollo/client';

export const GET_QUESTIONS = gql`
  query GetQuestions($skip: Int, $take: Int, $status: String, $groupId: String) {
    questions(skip: $skip, take: $take, status: $status, groupId: $groupId) {
      id
      title
      content
      bountyAmount
      status
      viewCount
      createdAt
      updatedAt
      author {
        id
        name
        reputation
        avatar
      }
      group {
        id
        name
        description
      }
      tags
      votes {
        id
        voteType
        user {
          id
        }
      }
      answers {
        id
      }
      _count {
        votes
        answers
      }
    }
  }
`;

export const GET_QUESTION = gql`
  query GetQuestion($id: String!) {
    question(id: $id) {
      id
      title
      content
      bountyAmount
      status
      viewCount
      createdAt
      updatedAt
      acceptedAnswerId
      author {
        id
        name
        reputation
        avatar
        role
      }
      group {
        id
        name
        description
      }
      tags
      votes {
        id
        voteType
        user {
          id
        }
      }
      answers {
        id
        content
        isAccepted
        qualityScore
        createdAt
        updatedAt
        author {
          id
          name
          reputation
          avatar
          role
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
      _count {
        votes
        answers
      }
    }
  }
`;

export const CREATE_QUESTION = gql`
  mutation CreateQuestion($input: CreateQuestionDto!) {
    createQuestion(input: $input) {
      id
      title
      content
      bountyAmount
      status
      author {
        id
        name
      }
      group {
        id
        name
      }
      tags
    }
  }
`;

export const UPDATE_QUESTION = gql`
  mutation UpdateQuestion($id: String!, $input: UpdateQuestionDto!) {
    updateQuestion(id: $id, input: $input) {
      id
      title
      content
      bountyAmount
      status
      tags
    }
  }
`;

export const VOTE_QUESTION = gql`
  mutation VoteQuestion($questionId: String!, $voteType: VoteType!) {
    voteQuestion(questionId: $questionId, voteType: $voteType) {
      id
      voteType
      createdAt
    }
  }
`;

export const SEARCH_QUESTIONS = gql`
  query SearchQuestions($query: String!, $skip: Int, $take: Int) {
    searchQuestions(query: $query, skip: $skip, take: $take) {
      id
      title
      content
      bountyAmount
      status
      viewCount
      createdAt
      author {
        id
        name
        reputation
        avatar
      }
      group {
        id
        name
      }
      tags
      _count {
        votes
        answers
      }
    }
  }
`;

export const GET_MY_QUESTIONS = gql`
  query GetMyQuestions($skip: Int, $take: Int) {
    myQuestions(skip: $skip, take: $take) {
      id
      title
      content
      bountyAmount
      status
      viewCount
      createdAt
      updatedAt
      group {
        id
        name
      }
      tags
      _count {
        votes
        answers
      }
    }
  }
`;