# Sprint 30 — MCP Tool Integration

## Objective
Enable the AI assistant to call MCP tools with public/admin separation.

## Tools
- **Public**: searchBlogPosts — search blog posts by keyword
- **Admin**: getSiteAnalytics — query platform analytics

## Tasks
- [x] searchBlogPosts tool operational for public users
- [x] getSiteAnalytics tool restricted to admin
- [x] Tool permissions enforced in chat API

## Verification
- [x] public chat can call searchBlogPosts
- [x] admin chat can call getSiteAnalytics
- [x] public users cannot access analytics
