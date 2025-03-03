export const LOGIN_USER = `
  mutation loginUser($orgId: String, $phone: String!, $otp: String!) {
    loginUser(orgId: $orgId, phone: $phone, otp: $otp) {
     user {
        id
        name
        email
        deptId
        companyId
        sessionToken
        token
        role {
            id
            name
          }
        }
    }
  }
`;

export const CREATE_USER = `
mutation CreateUser(
  $name: String!,
  $email: String!,
  $phone: String!,
  $password: String!,
  $roleId: String!,
  $deptId: String!,
  $companyId: String
) {
  createUser(
    name: $name,
    email: $email,
    phone: $phone,
    password: $password,
    roleId: $roleId,
    deptId: $deptId,
    companyId: $companyId
  ) {
    user {
      id
      email
    }
  }
}
`;

export const UPDATE_USER_COMPANY = `
  mutation UpdateUser($updateUserInput: UpdateUserInput!) {
    updateUser(updateUserInput: $updateUserInput) {
      id
      name
      email
      role {
        id
        name
      }
    }
  }
`

export const CREATE_ROOT_USER_MUTATION = `
  mutation CreateUser(
    $name: String!,
    $email: String!,
    $phone: String!,
    $password: String!,
    $companyName: String!,
    $companyAddress: String!,
    $companyEmail: String!,
    $companyPhone: String!
  ) {
    createUser(
      name: $name,
      email: $email,
      phone: $phone,
      password: $password,
      companyName: $companyName,
      companyAddress: $companyAddress,
      companyEmail: $companyEmail,
      companyPhone: $companyPhone
    ) {
      user {
        email
      }
    }
  }
`;

export const CREATE_OR_UPDATE_MANAGER = `
  mutation CreateOrUpdateManager(
    $name: String!,
    $email: String!,
    $phone: String!,
    $password: String!,
    $memberType: String!,
    $deptId: ID!,
    $companyId: ID
  ) {
    createOrUpdateManager(
      name: $name,
      email: $email,
      phone: $phone,
      password: $password,
      memberType: $memberType,
      deptId: $deptId,
      companyId: $companyId
    ) {
      user {
        id
        name
      }
    }
  }
`;

export const GENRATE_OTP = `
  mutation generateOTP($orgId: String, ,$phone: String!) {
    generateOTP(phone: $phone, orgId: $orgId) {
      otpExpiry
    }
  }
`;