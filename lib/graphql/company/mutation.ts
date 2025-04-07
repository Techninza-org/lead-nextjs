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


const UPDATE_DEPT_FORM_NAMES = `
  mutation UpdateDeptFormNames($categoryName: String!, $formName: String!, $companyDeptFormId: String!) {
    updateCompanyDeptFormNames(categoryName: $categoryName, formName: $formName, companyDeptFormId: $companyDeptFormId ) 
}
`

const UPDATE_COMPANY_CATEGORIES = `
  mutation UpdateCompanyCategories($companyId: String!, $category: String!, $subCategory: String!, $subCategory2: String!, $subCategory3: String!, $tags: [String!]!) {
    updateCompanyCategories(companyId: $companyId, category: $category, subCategory: $subCategory, subCategory2: $subCategory2, subCategory3: $subCategory3, tags: $tags ) 
}
`

const UPDATE_COMPANY_TABLE_CONFIG = `
  mutation TableConfig($pre: String, $suf: String, $pad: String, $separator: String, $tablename: String) {
    tableConfig(pre: $pre, suf: $suf, pad: $pad, separator: $separator, tablename: $tablename ) 
}
`
export const companyMutation = {
  UPDATE_COMPANY_TABLE_CONFIG,
  OTPCONFIG,
  UPDATE_COMPANY_CATEGORIES,
  UPDATE_DEPT_FORM_NAMES,
  UPDATE_COMPANY_SUBSCRIPTION,
  UPDATE_ROLE_FORM,
  DELETE_BROADCAST,
  UPDATE_BROADCAST_FORM,
}