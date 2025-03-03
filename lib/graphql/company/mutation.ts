const UPDATE_COMPANY_SUBSCRIPTION = `
mutation updateCompanySubscription(
    $companyId: String!
    $planId: String!
    $allowedDeptsIds: [String!]!
    $startDate: String!
    $endDate: String!
) {
    updateCompanySubscription(
        companyId: $companyId
        planId: $planId
        allowedDeptsIds: $allowedDeptsIds
        startDate: $startDate
        endDate: $endDate
    ) {
        id
        name
    }
}
`;

const DELETE_BROADCAST = `
mutation deleteBroadcast($broadcastId: ID!) {
    deleteBroadcast(broadcastId: $broadcastId) {
        id
    }
}`;

const UPDATE_BROADCAST_FORM = `
  mutation updateBroadcastForm($input: [CreateBroadcastInput!]!) {
    updateBroadcastForm(input: $input) {
      id
      name
      subCategories {
        name
        options {
          name
          type
          values {
            name
            values {
              name
            }
          }
        }
      }
    }
  }
`;

const UPDATE_ROLE_FORM = `
mutation upsertCompanyDeptForm(
    $formIds: [String]!
    $roleId: String!
) {
    upsertCompanyDeptForm(
        formIds: $formIds
        roleId: $roleId
    ) {
        id
        name
    }
}
`;

const OTPCONFIG = `
mutation otpConfig(
    $isSendToEmp: Boolean
) {
    otpConfig(
        isSendToEmp: $isSendToEmp
    )
}
`;

export const companyMutation = {
  OTPCONFIG,
  UPDATE_COMPANY_SUBSCRIPTION,
  UPDATE_ROLE_FORM,
  DELETE_BROADCAST,
  UPDATE_BROADCAST_FORM,
}