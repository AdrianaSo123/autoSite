# Sprint 31 — Hidden Admin Access via Chat Command

## Objective
The platform should behave like a chat-driven system console. Remove the visible "Studio" link from the navigation and replace it with a hidden `/admin` or `/studio` chat command that redirects authorized admins to the console.

## Tasks
1. Add Admin Command to Command Router
   - File: `src/lib/commands.ts`
   - Detect `/admin` or `/studio` and return `action: "open_admin_studio"`
2. Ensure Chat API Returns Action
   - File: `src/app/api/chat/route.ts`
   - Return the action field in the API JSON response
3. Handle Redirect in Chat UI
   - File: `src/components/ChatInterface.tsx`
   - On `data.action === "open_admin_studio"`, redirect to `/studio`
4. Remove Studio Link from Navigation
   - File: `src/components/NavBar.tsx`
   - Navigation should only contain Home and Blog

## Verification
- Studio link is gone from NavBar
- Typing `/admin` redirects to `/studio`
- Unauthorized users still cannot bypass `/studio` security
