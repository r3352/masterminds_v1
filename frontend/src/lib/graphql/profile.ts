import { gql } from '@apollo/client';

export const GET_MY_QUESTIONS = gql`
  query GetMyQuestions($page: Int, $limit: Int) {
    myQuestions(page: $page, limit: $limit) {
      id
      title
      content
      status
      bountyAmount
      viewCount
      answerCount
      createdAt
      updatedAt
      tags
      author {
        id
        username
        full_name
        avatar_url
      }
    }
  }
`;

export const GET_MY_ANSWERS = gql`
  query GetMyAnswers($page: Int, $limit: Int) {
    myAnswers(page: $page, limit: $limit) {
      id
      content
      isAccepted
      createdAt
      updatedAt
      score
      question {
        id
        title
      }
    }
  }
`;

export const GET_PROFILE = gql`
  query GetProfile {
    profile {
      id
      username
      email
      full_name
      bio
      avatar_url
      reputation_score
      created_at
      updated_at
      is_active
      email_verified
    }
  }
`;

export const UPDATE_PROFILE_MUTATION = gql`
  mutation UpdateProfile($input: UpdateUserProfileDto!) {
    updateProfile(input: $input) {
      id
      full_name
      bio
      avatar_url
      username
      email
      reputation_score
    }
  }
`;