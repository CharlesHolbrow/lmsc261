import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  // Use trailing slashes so relative links in MDX resolve correctly
  trailingSlash: true,
  // Configure pageExtensions to include md and mdx
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  // Allow GitHub avatars for profile images
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },
};

const withMDX = createMDX({
  extension: /\.(md|mdx)$/,
  options: {
    // Use string names for Turbopack compatibility
    remarkPlugins: [
      "remark-gfm",
      "remark-frontmatter",
      ["remark-mdx-frontmatter", { name: "metadata" }],
    ],
  },
});

// Merge MDX config with Next.js config
export default withMDX(nextConfig);
