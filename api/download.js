const releaseApiUrl = 'https://api.github.com/repos/epieyu1/Syncro-Distribucion/releases/latest';

const platformMatchers = {
    windows: /^Syncro\.Motos\.Setup\.\d+\.\d+\.\d+\.exe$/,
    'mac-arm64': /^Syncro\.Motos-\d+\.\d+\.\d+-arm64\.dmg$/,
    'mac-intel': /^Syncro\.Motos-\d+\.\d+\.\d+-x64\.dmg$/,
};

const fallbackUrls = {
    windows: 'https://github.com/epieyu1/Syncro-Distribucion/releases/download/v2.0.62/Syncro.Motos.Setup.2.0.62.exe',
    'mac-arm64': 'https://github.com/epieyu1/Syncro-Distribucion/releases/download/v2.0.62/Syncro.Motos-2.0.62-arm64.dmg',
};

function normalizePlatform(value) {
    return String(value || '').trim().toLowerCase();
}

function findAsset(assets, matcher) {
    return assets.find((asset) => (
        asset
        && typeof asset.name === 'string'
        && typeof asset.browser_download_url === 'string'
        && matcher.test(asset.name)
        && !asset.name.endsWith('.blockmap')
    ));
}

function redirect(res, status, url) {
    res.writeHead(status, {
        Location: url,
        'Cache-Control': 's-maxage=300, stale-while-revalidate=3600',
    });
    res.end();
}

module.exports = async function handler(req, res) {
    const platform = normalizePlatform(req.query && req.query.platform);
    const matcher = platformMatchers[platform];

    if (!matcher) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end('Unsupported download platform.');
        return;
    }

    try {
        const releaseResponse = await fetch(releaseApiUrl, {
            headers: {
                Accept: 'application/vnd.github+json',
                'User-Agent': 'syncro-landing-download',
            },
        });

        if (!releaseResponse.ok) {
            const fallbackUrl = fallbackUrls[platform];
            if (fallbackUrl) {
                redirect(res, 302, fallbackUrl);
                return;
            }
            res.statusCode = 502;
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.end('Release metadata unavailable.');
            return;
        }

        const release = await releaseResponse.json();
        const assets = Array.isArray(release.assets) ? release.assets : [];
        const asset = findAsset(assets, matcher);

        if (!asset) {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.end('Installer not published for this platform.');
            return;
        }

        const assetResponse = await fetch(asset.browser_download_url, {
            method: 'HEAD',
            redirect: 'manual',
            headers: {
                'User-Agent': 'syncro-landing-download',
            },
        });
        const signedAssetUrl = assetResponse.headers.get('location');

        redirect(res, 302, signedAssetUrl || asset.browser_download_url);
    } catch (_) {
        const fallbackUrl = fallbackUrls[platform];
        if (fallbackUrl) {
            redirect(res, 302, fallbackUrl);
            return;
        }

        res.statusCode = 500;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end('Download temporarily unavailable.');
    }
};
