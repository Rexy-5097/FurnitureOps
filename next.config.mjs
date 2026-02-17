/** @type {import('next').NextConfig} */
import withPWAInit from '@ducanh2912/next-pwa';

const withPWA = withPWAInit({
    dest: 'public',
    cacheOnFrontEndNav: true,
    aggressiveFrontEndNavCaching: true,
    reloadOnOnline: true,
    disable: process.env.NODE_ENV === 'development',
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
let supabaseHostname = 'placeholder.supabase.co';
try {
    supabaseHostname = new URL(supabaseUrl).hostname;
} catch (e) {
    console.warn('Invalid NEXT_PUBLIC_SUPABASE_URL, falling back to placeholder');
}

const nextConfig = {
    images: {
        remotePatterns: [{
                protocol: 'https',
                hostname: supabaseHostname,
                port: '',
                pathname: '/storage/v1/object/**',
            },
            {
                protocol: 'https',
                hostname: 'example.com',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'via.placeholder.com',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'placehold.co',
                port: '',
                pathname: '/**',
            },
        ],
    },
};

export default withPWA(nextConfig);