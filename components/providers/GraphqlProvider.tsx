"use client"

import { useContext } from "react";
import { GraphQLClient, ClientContext } from 'graphql-hooks'

export const graphqlUrl = process.env.NEXT_PUBLIC_BACKEND_GRAPHQL_API || 'http://localhost:8080';

function GraphqlProvider({ children }: { children: React.ReactNode }) {

    const client = new GraphQLClient({
        url: `${graphqlUrl}/graphql`,
        fetchOptions: { 
            method: 'POST',
        },
        useGETForQueries: false,
    })


    return (
        <ClientContext.Provider value={client}>
            {children}
        </ClientContext.Provider>
    );
}

export default GraphqlProvider;

export const useGraphql = () => {
    const context = useContext(ClientContext);
    if (!context) {
        throw new Error('useGraphql must be used within an GraphqlProvider');
    }
    return context;
}