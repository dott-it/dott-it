'use client'

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { AnonymousViewProvider } from "@/components/anonymous-view-provider"
import { IntercomMessenger } from "@/components/intercom-messenger"
import { Toaster } from "@/components/ui/sonner"
import { JSX, ReactNode } from "react"
import { SessionWrapper } from "./lib/components/auth/session-wrapper/session-wrapper"

function makeQueryClient():QueryClient{
    
return new QueryClient({
    defaultOptions:{
        queries:{
            staleTime:60 * 1000,
            refetchOnWindowFocus:false,
            refetchOnMount:false,
            refetchOnReconnect:false,
            retry:1
        }
    }
})
}

let browserQueryClient:QueryClient|undefined

function getQueryClient():QueryClient{
    if(globalThis.window ===undefined){
        return makeQueryClient()
    }
    if(!browserQueryClient){
        browserQueryClient=makeQueryClient()
    }
    return browserQueryClient
}

export function Providers({children}: {children:ReactNode}):JSX.Element{
    return(
        <SessionWrapper>
            <IntercomMessenger />
            <QueryClientProvider client={getQueryClient()}>
                <AnonymousViewProvider>
                    {children}
                    <Toaster />
                </AnonymousViewProvider>
            </QueryClientProvider>
        </SessionWrapper>
    )

}