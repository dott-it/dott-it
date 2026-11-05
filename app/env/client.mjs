import {createEnv} from '@t3-oss/env-nextjs';
import {z} from 'zod';

const booleanEnv=z.string().transform((s)=>s!=="false"&&s!=='0').default('false');

export const env = createEnv({
    shared:{
        NODE_ENV:z.enum(['development','production','test']).default('production'),
        NEXT_PUBLIC_BASE_URL:z.string().optional(),
        NEXT_PUBLIC_INTERCOM_APP_ID:z.string().optional(),
        MOCK_API_URL:z.string().optional(),
        NEXT_PUBLIC_MOCK_API_ENABLED:booleanEnv.default('false'),
        NEXT_PUBLIC_MOCK_API_URL:z.string().optional(),
    },
    client:{
        API_URL:z.string().optional(),
        NEXT_PUBLIC_MOCK_API_ENABLED:booleanEnv.default('false'),
        NEXT_PUBLIC_MOCK_API_URL:z.string().optional(),
        NEXT_PUBLIC_BASE_URL:z.string().optional(),
        NEXT_PUBLIC_INTERCOM_APP_ID:z.string().optional()

    },
    server:{
        API_URL:z.string().optional(),
        DEMO_MODE:booleanEnv.default('false'),
        NEXT_PUBLIC_MOCK_API_ENABLED:booleanEnv.default('false'),
        MOCK_API_PROXY_URL:z.string().optional(),
        MOCK_API_PROXY_API_URL:z.string().optional(),
    },
    runtimeEnv:{
        API_URL:process.env.API_URL,
        NEXT_PUBLIC_MOCK_API_ENABLED:process.env.NEXT_PUBLIC_MOCK_API_ENABLED,
        NEXT_PUBLIC_BASE_URL:process.env.NEXT_PUBLIC_BASE_URL,
        NEXT_PUBLIC_INTERCOM_APP_ID:process.env.NEXT_PUBLIC_INTERCOM_APP_ID,
        NEXT_PUBLIC_MOCK_API_URL:process.env.NEXT_PUBLIC_MOCK_API_URL,
        MOCK_API_URL:process.env.MOCK_API_URL,
        DEMO_MODE:process.env.DEMO_MODE,
        MOCK_API_PROXY_API_URL:process.env.MOCK_API_PROXY_API_URL,
        MOCK_API_PROXY_URL:process.env.MOCK_API_PROXY_URL
    }
})