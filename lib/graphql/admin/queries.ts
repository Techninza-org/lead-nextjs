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
};
