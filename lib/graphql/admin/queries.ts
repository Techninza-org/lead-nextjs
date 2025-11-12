const GET_DEPT_FIELDS = `
  query GetDeptWFields {
      getDeptWFields{
         id
         name
         adminDeptForm {
          id
          name
          fields {
            id
            name
            fieldType
            ddOptionId
            options {
              label
              value
            }
            isDisabled
            isRequired
            imgLimit
            order
          }
         }
      }
  }
`;

const GET_COMPANIES_DATA = ` 
  query getCompaniesData($selectedRootIds: [String!]){
    getCompaniesData(selectedRootIds: $selectedRootIds)
  }
`

const getCompanyForms = `
  query GetCompanyForms($companyId: String!) {
    getCompanyForms(companyId: $companyId)
  }
`

const getCompnayFunctions = `
query GetCompnayFunctionsAdmin($orgId: String!){
 getCompnayFunctionsAdmin(orgId: $orgId)
}
`

const getCompanyFunctionsDefault = `
query GetCompanyFunctionsDefault($orgId: String!){
 getCompanyFunctionsDefault(orgId: $orgId)
}
`

const getCompanyFunctionById = `
query GetCompanyFunctionById($id: String!) {
  getCompanyFunctionById(functionId: $id) 
}
`

const ASSIGNFORMTOROOT = `
  mutation assignFormC2C(
      $sourceValue: String
      $destinationRootId: String
  ) {
      assignFormC2C(
          sourceValue: $sourceValue
          destinationRootId: $destinationRootId
      )
  }
`
const BACKBONETOROOT = `
  mutation backboneC2C(
      $sourceValue: String
      $destinationRootId: String
  ) {
      backboneC2C(
          sourceValue: $sourceValue
          destinationRootId: $destinationRootId
      )
  }
`

// Logs Queries
const GET_LOGS_STATS = `
  query GetLogAnalytics($startDate: String!, $endDate: String!) {
    getLogAnalytics(startDate: $startDate, endDate: $endDate) {
      overallStats {
        totalErrors
        totalRequests
        totalBandwidth
      }
      orgSummary {
        orgName
        totalErrors
        totalRequests
        totalBandwidth
      }
      userDetails {
        orgName
        users {
          userId
          totalErrors
          totalRequests
          totalBandwidth
        }
      }
    }
  }
`;

const GET_LOGS_FOR_ORG = `
  query GetLogsByOrg($orgId: String!, $startDate: String!, $endDate: String!) {
    getLogsByOrg(orgId: $orgId, startDate: $startDate, endDate: $endDate) {
      timestamp
      method
      url
      httpCode
      description
      elapsedTimeMs
      ip
      orgId
      userId
      rate
      bandwidthKB
      userAgent
      payload
      isError
    }
  }
`;

const GET_DETAILED_LOGS = `
  query GetDetailedLogs($startDate: String!, $endDate: String!, $orgId: String, $userId: String, $page: Int, $limit: Int, $search: String, $errorsOnly: Boolean) {
    getDetailedLogs(startDate: $startDate, endDate: $endDate, orgId: $orgId, userId: $userId, page: $page, limit: $limit, search: $search, errorsOnly: $errorsOnly) {
      logs {
        timestamp
        method
        url
        httpCode
        description
        elapsedTimeMs
        ip
        orgId
        userId
        rate
        bandwidthKB
        userAgent
        payload
        isError
      }
      pagination {
        total
        page
        limit
        totalPages
      }
    }
  }
`;

export const adminQueries = {
  GET_DEPT_FIELDS,
  ASSIGNFORMTOROOT,
  getCompnayFunctions,
  getCompanyFunctionsDefault,
  getCompanyFunctionById,
  getCompanyForms,
  GET_COMPANIES_DATA,
  BACKBONETOROOT,
  GET_LOGS_STATS,
  GET_LOGS_FOR_ORG,
  GET_DETAILED_LOGS
};
