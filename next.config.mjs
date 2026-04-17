/** @type {import('next').NextConfig} */
const nextConfig = {
    // These packages are ESM-only and must be transpiled both for the
    // Next.js build and for Jest (next/jest reads this list to build
    // its transformIgnorePatterns exception automatically).
    transpilePackages: [
        // remark / unified core
        "remark",
        "remark-html",
        "remark-parse",
        "remark-stringify",
        "unified",
        "trough",
        "is-plain-obj",
        "devlop",
        // vfile
        "vfile",
        "vfile-message",
        // mdast
        "mdast-util-from-markdown",
        "mdast-util-to-hast",
        "mdast-util-to-markdown",
        "mdast-util-to-string",
        "mdast-util-phrasing",
        // unist
        "unist-util-is",
        "unist-util-position",
        "unist-util-stringify-position",
        "unist-util-visit",
        "unist-util-visit-parents",
        // micromark
        "micromark",
        "micromark-core-commonmark",
        "micromark-factory-destination",
        "micromark-factory-label",
        "micromark-factory-space",
        "micromark-factory-title",
        "micromark-factory-whitespace",
        "micromark-util-character",
        "micromark-util-chunked",
        "micromark-util-classify-character",
        "micromark-util-combine-extensions",
        "micromark-util-decode-numeric-character-reference",
        "micromark-util-decode-string",
        "micromark-util-encode",
        "micromark-util-html-tag-name",
        "micromark-util-normalize-identifier",
        "micromark-util-resolve-all",
        "micromark-util-sanitize-uri",
        "micromark-util-subtokenize",
        "micromark-util-symbol",
        "micromark-util-types",
        // hast
        "hast-util-sanitize",
        "hast-util-to-html",
        "hast-util-whitespace",
        // character / entity utilities (transitive deps of micromark/hast)
        "ccount",
        "character-entities",
        "character-entities-html4",
        "character-entities-legacy",
        "comma-separated-tokens",
        "decode-named-character-reference",
        "entities",
        "html-void-elements",
        "longest-streak",
        "property-information",
        "space-separated-tokens",
        "stringify-entities",
        "trim-lines",
        "zwitch",
    ],
};

export default nextConfig;
