import { gql } from '@apollo/client';

export const GET_GROUPS = gql`
  query GetGroups($skip: Int, $take: Int) {
    groups(skip: $skip, take: $take) {
      id
      name
      description
      isPublic
      expertiseLevel
      memberCount
      questionCount
      createdAt
      creator {
        id
        name
      }
    }
  }
`;

export const GET_GROUP = gql`
  query GetGroup($id: String!) {
    group(id: $id) {
      id
      name
      description
      isPublic
      expertiseLevel
      memberCount
      questionCount
      createdAt
      creator {
        id
        name
        reputation
        avatar
      }
      members {
        id
        user {
          id
          name
          reputation
          avatar
        }
        role
        expertiseLevel
        joinedAt
      }
    }
  }
`;

export const JOIN_GROUP = gql`
  mutation JoinGroup($groupId: String!, $input: JoinGroupDto!) {
    joinGroup(groupId: $groupId, input: $input) {
      id
      role
      expertiseLevel
      joinedAt
    }
  }
`;

export const LEAVE_GROUP = gql`
  mutation LeaveGroup($groupId: String!) {
    leaveGroup(groupId: $groupId)
  }
`;