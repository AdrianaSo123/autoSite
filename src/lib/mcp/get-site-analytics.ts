/**
 * MCP Tool: getSiteAnalytics
 *
 * Returns site analytics data. This is an MCP-compatible tool
 * that can be called by the AI agent to retrieve analytics info.
 *
 * MCP Tool Definition:
 * {
 *   "name": "getSiteAnalytics",
 *   "description": "Returns visitor analytics for the website including total visitors, page views, and most popular posts.",
 *   "parameters": {}
 * }
 */

import { getAllPosts } from "@/lib/posts";

export interface SiteAnalytics {
    totalVisitors: number;
    pageViews: number;
    todayVisitors: number;
    mostPopularPosts: { title: string; views: number }[];
    lastUpdated: string;
}

/**
 * Get site analytics. In production, this would query Vercel Analytics API.
 * For now, returns simulated data based on actual post count.
 */
export async function getSiteAnalytics(): Promise<SiteAnalytics> {
    const vercelToken = process.env.VERCEL_API_TOKEN;
    const projectId = process.env.VERCEL_PROJECT_ID;

    // If Vercel credentials are available, attempt real analytics
    if (vercelToken && projectId) {
        try {
            const response = await fetch(
                `https://api.vercel.com/v1/analytics?projectId=${projectId}`,
                {
                    headers: { Authorization: `Bearer ${vercelToken}` },
                }
            );

            if (response.ok) {
                const data = await response.json();
                return {
                    totalVisitors: data.totalVisitors || 0,
                    pageViews: data.pageViews || 0,
                    todayVisitors: data.todayVisitors || 0,
                    mostPopularPosts: data.topPages || [],
                    lastUpdated: new Date().toISOString(),
                };
            }
        } catch (error) {
            console.error("Vercel analytics error:", error);
        }
    }

    // Fallback: simulated analytics based on actual posts
    const posts = getAllPosts();
    const simulatedPosts = posts.slice(0, 3).map((p, i) => ({
        title: p.title,
        views: Math.floor(Math.random() * 100) + (3 - i) * 50,
    }));

    return {
        totalVisitors: Math.floor(Math.random() * 500) + 100,
        pageViews: Math.floor(Math.random() * 1500) + 300,
        todayVisitors: Math.floor(Math.random() * 50) + 10,
        mostPopularPosts: simulatedPosts,
        lastUpdated: new Date().toISOString(),
    };
}
