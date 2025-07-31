const CREATE_LEAD = `
mutation createLead(
  $companyId: String!, 
  $name: String!, 
  $email: String!, 
  $alternatePhone: String, 
  $phone: String!, 
  $remark: String!, 
  $department: String,
  $dynamicFieldValues: JSON!
) {
  createLead(
    input: {
      companyId: $companyId,
      name: $name,
      email: $email,
      alternatePhone: $alternatePhone,
      phone: $phone,
      remark: $remark,
      department: $department,
      dynamicFieldValues: $dynamicFieldValues
    }
  ) 
}
`;

const CREATE_PROSPECT = `
mutation createProspect(
  $companyId: String!, 
  $name: String!, 
  $email: String!, 
  $alternatePhone: String, 
  $phone: String!, 
  $remark: String!, 
  $department: String!
) {
  createProspect(
    input: {
      companyId: $companyId,
      name: $name,
      email: $email,
      alternatePhone: $alternatePhone,
      phone: $phone,
      remark: $remark,
      department: $department
    }
  ) {
    lead {
      id
      name
    }
  }
}
`;

const LEAD_ASSIGN_TO = `
  mutation leadAssignTo(
    $leadIds: [String!]
    $userIds: [String!]!
    $deptId: String
    $companyId: String!
    $description: String
    $type: String
  ) {
    leadAssignTo(
      leadIds: $leadIds
      userIds: $userIds
      deptId: $deptId
      companyId: $companyId
      description: $description
      type: $type
    ) 
  }
`;
const PROSPECT_ASSIGN_TO = `
  mutation prospectAssignTo(
    $leadIds: [String!]!
    $userIds: [String!]!
    $deptId: String
    $companyId: String!
    $description: String
  ) {
    prospectAssignTo(
      leadIds: $leadIds
      userIds: $userIds
      deptId: $deptId
      companyId: $companyId
      description: $description
    ) {
      name
      leadMember { 
          member { 
              name
          }
      }
    }
  }
`;

const SUBMIT_LEAD = `
  mutation SubmitFeedback(
    $nextFollowUpDate: String,
    $leadId: String!,
    $callStatus: String!,
    $paymentStatus: String!,
    $feedback: [FeedbackInput!]!
    $childFormValue: [FeedbackInput!]
    $urls: [String]
    $submitType: String
    $formName: String
    $dependentOnFormName: String
  ) {
    submitFeedback(
      nextFollowUpDate: $nextFollowUpDate,
      leadId: $leadId,
      callStatus: $callStatus,
      paymentStatus: $paymentStatus,
      feedback: $feedback
      childFormValue: $childFormValue
      urls: $urls
      submitType: $submitType
      formName: $formName
      dependentOnFormName: $dependentOnFormName
    ) {
      message
    }
  }
`;

const SUBMIT_BID_MUTATION = `
  mutation SubmitBid(
    $deptId: String!,
    $leadId: String!,
    $companyId: String!,
    $bidAmount: String!,
    $description: String!
  ) {
    submitBid(
      deptId: $deptId,
      leadId: $leadId,
      companyId: $companyId,
      bidAmount: $bidAmount,
      description: $description
    ) {
      id
      bidAmount
    } 
  }`

const UPDATE_LEAD_FINANCE_STATUS = `
  mutation UpdateLeadFinanceStatus(
    $leadId: String!,
    $financeStatus: Boolean!
  ) {
    updateLeadFinanceStatus(
      leadId: $leadId,
      financeStatus: $financeStatus
    ) {
      id
      name
    }
  }
`;

const APPROVED_LEAD_MUTATION = `
  mutation appvedLead($leadId: ID!, $status: Boolean!) {
    appvedLead(
      leadId: $leadId
      status: $status
    ) {
      id
      name
    }
  }
`;

const TRANSFER_LEAD  = `
mutation TransferLead(
  $leadId: ID!,
  $transferToId: ID!
) {
  leadTransferTo(
      leadId: $leadId,
      transferToId: $transferToId,
  ) {
      id
      email
      name
  }
}
`

const UPDATE_FOLLOWUP = `
  mutation updateLeadFollowUpDate(
    $leadId: String!,
    $nextFollowUpDate: String!,
    $rating: String,
    $customerResponse: String!,
    $remark: String!
    $feedback: [FeedbackInput!]
  ) {
    updateLeadFollowUpDate(
      leadId: $leadId,
      nextFollowUpDate: $nextFollowUpDate,
      rating: $rating,
      customerResponse: $customerResponse,
      remark: $remark,
      feedback: $feedback
    ) 
  }
`
const UPDATE_FOLLOWUP_PROSPECT = `
  mutation updateProspectFollowUpDate(
    $leadId: String!,
    $nextFollowUpDate: String!,
    $rating: String,
    $customerResponse: String!,
    $remark: String!
    $feedback: [FeedbackInput!]
  ) {
    updateProspectFollowUpDate(
      leadId: $leadId,
      nextFollowUpDate: $nextFollowUpDate,
      rating: $rating,
      customerResponse: $customerResponse,
      remark: $remark,
      feedback: $feedback
    ) 
  }
`

const EDIT_LEAD_FORM_VALUE = `
  mutation editLeadFormValue( 
    $submittedFormId: String!,
    $formValue: [CreateDeptFieldInput]!
  ) {
    editLeadFormValue(
      submittedFormId: $submittedFormId,
      formValue: $formValue
    ) {
      id
    }
  }
`;

const EDIT_FIELD_VALUE = `
  mutation editFieldValue(
    $formName: String!,
    $fieldName: String!,
    $docId: String!,
    $fieldValue: String!
  ){
  editFieldValue(
    formName: $formName,
    fieldName: $fieldName,
    docId: $docId,
    fieldValue: $fieldValue
  )
  }
`

export const leadMutation = {
  EDIT_FIELD_VALUE,
  EDIT_LEAD_FORM_VALUE,
  CREATE_LEAD,
  CREATE_PROSPECT,
  LEAD_ASSIGN_TO,
  PROSPECT_ASSIGN_TO,
  SUBMIT_LEAD,
  SUBMIT_BID_MUTATION,
  UPDATE_LEAD_FINANCE_STATUS,
  APPROVED_LEAD_MUTATION,
  TRANSFER_LEAD,
  UPDATE_FOLLOWUP,
  UPDATE_FOLLOWUP_PROSPECT
} 