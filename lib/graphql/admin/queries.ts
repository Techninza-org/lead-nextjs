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
  getCompanyFunctionById(functionId: $id) {
    id
    orgId
    functionName
    functionType
    desc
    viewName
    tags
    isUserIntervation
    isValid
    returnType
    individualButton
  }
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

export const adminQueries = {
  GET_DEPT_FIELDS,
  ASSIGNFORMTOROOT,
  getCompnayFunctions,
  getCompanyFunctionsDefault,
  getCompanyFunctionById,
  getCompanyForms,
};
