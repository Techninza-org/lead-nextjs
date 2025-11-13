const GET_ALL_ROLES = `
  query GetAllRoles {
    getAllRoles {
      id
      name
    }
  }
`;

const GET_COMPANY_DEPT_FIELDS = `
  query GetCompanyDeptFields($deptId: String) {
    getCompanyDeptFields(deptId: $deptId) {
      id
      name
      fields { 
        name
        fieldType
        ddOptionId
        options 
        isDisabled
        isRequired
        isUnique
        imgLimit
        order
      }
      category { 
        name
      }
    }
  }
`;

const Global_Search = `
  mutation GlobalSearchResolver($searchTerm: String) {
    globalSearchResolver(searchTerm: $searchTerm) 
  }
`;

const GET_COMPANY_SUBSCRIPTION = `
  query GetCompanySubscription($companyId: String!) {
    getCompanySubscription(companyId: $companyId) {
      id
      name
      Subscriptions {
        planId
        allowedDeptsIds
        plan{
          id
          name
        }
      } 
    }
  }
`;

const GET_BROADCASTS = `
  query GetBroadcasts {
    getBroadcasts {
      id
      message
      companyId
      isOffer
      isTemplate
      isMessage
      imgURL
      createdAt
    }
  }
`;

const GET_BROADCAST_BY_ID = `
  query GetBroadcastById($broadcastId: ID!){
    getBroadcastById(broadcastId: $broadcastId) {
      id
      message
      companyId
      isOffer
      isTemplate
      isMessage
      imgURL
      createdAt
    }
  }
`;

const GET_BROADCAST_FORM = `
  query GetBroadcastForm {
    broadcastForm {
       id
       name
       order
       subCategories{
        name
        options{
            name
            order
            type
            values{
                id
                name
                values{
                    id
                    name
                }
            }
        }
       }
    }
}
`;

const GET_COMPANY_XCHANGER_BIDS_QUERY = `
  query GetCompanyXchangerBids {
    getCompanyXchangerBids {
      id
      bidAmount
      isApproved
      description
      Member {
        name
      }
      lead {
        name
      }
      createdAt
      updatedAt
    }
  }
`

const GET_FOLLOWUP = `
  query GetFollowUps {
    getFollowUps {
      id
      nextFollowUpDate
      remark
      customerResponse
      rating
      leadId
      followUpBy
      createdAt
      updatedAt
    }
  }
`

const XCHANGE_CUSTOMER_LIST = `
    query XChangerCustomerList {
      xChangerCustomerList {
        data
      }
    }
`
const GET_XCHANGE_LEAD_IMGS = `
    query GetExchangeLeadImgs {
      getExchangeLeadImgs {
        data
      }
    }
`
const GET_LEADS_PHOTOS = `
    query GetLeadPhotos {
      getLeadPhotos {
        data
      }
    }
`

export const GET_SUBMITTED_FORM_VALUE = `
  query getFormValuesByFormName(
    $formName: String!
    $filters: JSON
    $page: Int
    $limit: Int
    $sort: String!
  ) {
    getFormValuesByFormName(
      formName: $formName
      filters: $filters
      page: $page
      limit: $limit
      sort: $sort
    )
  }
`

const GET_TABLE_FILTER_OPTIONS = `
    query getTableFilterOptions($searchValue: String!, $colId: String!) {
      getTableFilterOptions(searchValue: $searchValue, colId: $colId)
    }
`

const GET_TABLE_CHILD_DATA = `
    query fetchRowChildData($tableName: String!, $rowId: String!) {
      fetchRowChildData(tableName: $tableName, rowId: $rowId)
    }
`

const GET_CHILD_DATA = `
    query getChildFromParent($parentId: String!, $childTableNames: [String!]!) {
      getChildFromParent(parentId: $parentId, childTableNames: $childTableNames) 
    }
`

const SEARCH_FORM_VALUE = `
  query searchFormValue(
    $formName: String!
    $columnName: String!
    $searchValue: String!
  ) {
    searchFormValue(
      formName: $formName
      columnName: $columnName
      searchValue: $searchValue
    ) {
      data
      listView
      changeView
      pagination {
        total
        page
        limit
        totalPages
      }
    }
  }
`

export const companyQueries = {
  XCHANGE_CUSTOMER_LIST,
  GET_TABLE_CHILD_DATA,
  GET_ALL_ROLES,
  GET_FOLLOWUP,
  GET_COMPANY_DEPT_FIELDS,
  Global_Search,
  GET_COMPANY_SUBSCRIPTION,
  GET_BROADCASTS,
  GET_BROADCAST_BY_ID,
  GET_BROADCAST_FORM,
  GET_COMPANY_XCHANGER_BIDS_QUERY,
  GET_XCHANGE_LEAD_IMGS,
  GET_LEADS_PHOTOS,
  GET_SUBMITTED_FORM_VALUE,
  GET_TABLE_FILTER_OPTIONS,
  GET_CHILD_DATA,
  SEARCH_FORM_VALUE
}