const GET_ALL_ROLES = `
  query GetAllRoles {
    getAllRoles {
      id
      name
      companyDeptForm{
        id
        name
      }
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

const GET_SUBMITTED_FORM_VALUE = `
    query getFormValuesByFormName($formName: String!) {
      getFormValuesByFormName(formName: $formName)
    }
`

const GET_TABLE_FILTER_OPTIONS = `
    query getTableFilterOptions($searchValue: String!, $colId: String!) {
      getTableFilterOptions(searchValue: $searchValue, colId: $colId)
    }
`

export const companyQueries = {
  XCHANGE_CUSTOMER_LIST,
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
  GET_TABLE_FILTER_OPTIONS
}