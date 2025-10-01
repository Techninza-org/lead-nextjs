export const historyQueries = {
  GET_EDIT_HISTORY: `
    query GetEditHistory($documentId: String!, $tableName: String!, $formName: String!) {
      getEditHistory(documentId: $documentId, tableName: $tableName, formName: $formName)
    }
  `
};
