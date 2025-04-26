const GET_COMPANY_DEPT_MEMBERS = `
  query GetCompanyDeptMembers($deptId: String, $companyId: String) {
    getCompanyDeptMembers(deptId: $deptId, companyId: $companyId) {
      id
      name
      email
      phone
      role { 
          name
      }
    }
  }
`;

const GET_MEMBERS = `
  query GetMembersByRole($role: String!) {
    getMembersByRole(role: $role) {
      id
      name
      companyId
    }
  }
`

const GET_COMPANIES = `
  query getRootUsers($filters: JSON, $page: String) {
    getRootUsers(filters: $filters, page: $page) 
  }
`;

const GET_MEMBER_LOCATION = `
  query GetMemberLocation($memberId: String!, $date: String!) {
    getMemberLocation(memberId: $memberId, date: $date) {
      day
      leadAssingeeMemberId
      locations { 
        latitude
        longitude
        idleTime
        movingTime
        timestamp
        batteryPercentage
        networkStrength
      }
    }
  }
`;

const GET_PLANS = `
  query GetPlans {
    getPlans{
        id
        name
        duration
        defaultAllowedDeptsIds
        price
        description
        isActive
        createdAt
        updatedAt
    }
  }
`;

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

const GET_DEPT_OPT_FIELDS = `
  query GetCompanyDeptOptFields {
      getCompanyDeptOptFields{
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
`;

const GET_ROLES = `
  query GetRoles($companyId: String!) {
    getRoles(companyId: $companyId) {
      id
      name
      companyId
      department
      activeFrom
      activeTo
      isActive
      type
      permissions
    }
  }
`;

const GET_PERMISSIONS = `
  query GetPermissions {
    getPermissions {
      id
      name
      resource
      actions
      filters
    }
  }
`;

const CREATE_ROLE = `
  mutation CreateRole($input: CreateRoleInput!) {
    createRole(input: $input) {
      id
      name
      companyId
      department
      activeFrom
      activeTo
      isActive
      type
    }
  }
`;

const UPDATE_ROLE = `
  mutation UpdateRole($id: String!, $input: UpdateRoleInput!) {
    updateRole(id: $id, input: $input) {
      id
      name
      companyId
      department
      activeFrom
      activeTo
      isActive
      type
    }
  }
`;

const DELETE_ROLE = `
  mutation DeleteRole($id: String!) {
    deleteRole(id: $id)
  }
`;

const CREATE_PERMISSION = `
  mutation CreatePermission($input: CreatePermissionInput!) {
    createPermission(input: $input) {
      id
      name
      resource
      actions
    }
  }
`;

const UPDATE_PERMISSION = `
  mutation UpdatePermission($id: String!, $input: UpdatePermissionInput!) {
    updatePermission(id: $id, input: $input) {
      id
      name
      resource
      actions
    }
  }
`;

const DELETE_PERMISSION = `
  mutation DeletePermission($id: String!) {
    deletePermission(id: $id)
  }
`;

const COMPANY_RESOURCES = `
  query PermissioResources {
    permissioResources 
  }
`;

const UPDATE_PERMISSION_FILTER = `
  mutation UpdatePermissionFilter($resourceName: String!, $data: JSON) {
    updatePermissionFilter(resourceName: $resourceName, data: $data)
  }
`

const GET_COMPANIES_CATEGORIES = `
  mutation GetCompanyByCategory($resourceName: String!, $data: JSON) {
    getCompanyByCategory(resourceName: $resourceName, data: $data)
  }
`

const  GET_DISCTINT_CATEGORY = `
  query GetDistinctCategories {
    getDistinctCategories
  }
`

const  GET_COMPANY_FUNCTION = `
  query getCompanyFunctions {
    getCompanyFunctions {
      functionName
      desc
      returnType
      order
      viewName
      isActive
    }
  }
`
export const userQueries = {
  GET_COMPANY_FUNCTION,
  GET_COMPANIES_CATEGORIES,
  GET_COMPANY_DEPT_MEMBERS,
  GET_COMPANIES,
  GET_MEMBERS,
  GET_DISCTINT_CATEGORY,
  GET_MEMBER_LOCATION,
  GET_PLANS,
  GET_DEPT_FIELDS,
  GET_DEPT_OPT_FIELDS,
  GET_ROLES,
  GET_PERMISSIONS,
  CREATE_ROLE,
  UPDATE_ROLE,
  DELETE_ROLE,
  CREATE_PERMISSION,
  UPDATE_PERMISSION,
  DELETE_PERMISSION,
  COMPANY_RESOURCES,
  UPDATE_PERMISSION_FILTER,
};
