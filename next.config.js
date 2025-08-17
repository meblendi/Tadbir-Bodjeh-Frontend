const nextConfig = {
    // output: 'export',

    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    experimental: {
        missingSuspenseWithCSRBailout: false,
    },
    /* ...Your other config rules */
}
module.exports = nextConfig