import { gql } from '@apollo/client';

export const LOGIN_MUTATION = gql`
  mutation Login($input: LoginDto!) {
    login(input: $input) {
      access_token
      refresh_token
      expires_in
      user {
        id
        email
        username
        full_name
        avatar_url
        reputation_score
        is_active
        email_verified
        created_at
        updated_at
        two_factor_enabled
      }
    }
  }
`;

export const REGISTER_MUTATION = gql`
  mutation Register($input: CreateUserDto!) {
    register(input: $input) {
      access_token
      refresh_token
      expires_in
      user {
        id
        email
        username
        full_name
        avatar_url
        reputation_score
        is_active
        email_verified
        created_at
        updated_at
        two_factor_enabled
      }
    }
  }
`;

export const ME_QUERY = gql`
  query Me {
    me {
      id
      email
      username
      full_name
      bio
      avatar_url
      reputation_score
      is_active
      email_verified
      created_at
      updated_at
      two_factor_enabled
    }
  }
`;

export const REFRESH_TOKEN_MUTATION = gql`
  mutation RefreshToken($input: RefreshTokenDto!) {
    refreshToken(input: $input) {
      access_token
      refresh_token
      expires_in
      user {
        id
        email
        username
        full_name
        avatar_url
        reputation_score
        is_active
        email_verified
        created_at
        updated_at
        two_factor_enabled
      }
    }
  }
`;

export const ENABLE_2FA_MUTATION = gql`
  mutation Enable2FA {
    enable2FA {
      secret
      qr_code_url
      backup_codes
    }
  }
`;

export const VERIFY_2FA_MUTATION = gql`
  mutation Verify2FA($input: Verify2FADto!) {
    verify2FA(input: $input) {
      message
      success
    }
  }
`;

export const DISABLE_2FA_MUTATION = gql`
  mutation Disable2FA($input: Disable2FADto!) {
    disable2FA(input: $input) {
      message
      success
    }
  }
`;

// Note: 2FA is handled within the main login mutation using the totp_code field
// export const LOGIN_WITH_2FA_MUTATION = gql`
//   mutation LoginWith2FA($input: LoginDto!) {
//     login(input: $input) {
//       access_token
//       refresh_token
//       expires_in
//       user {
//         id
//         email
//         username
//         full_name
//         avatar_url
//         reputation_score
//         is_active
//         email_verified
//         created_at
//         updated_at
//         two_factor_enabled
//       }
//     }
//   }
// `;

export const GOOGLE_LOGIN_MUTATION = gql`
  mutation GoogleLogin($input: GoogleLoginDto!) {
    googleLogin(input: $input) {
      access_token
      refresh_token
      expires_in
      user {
        id
        email
        username
        full_name
        avatar_url
        reputation_score
        is_active
        email_verified
        created_at
        updated_at
        two_factor_enabled
      }
    }
  }
`;

export const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout {
      message
      success
    }
  }
`;