import BlogChatFAB from "@/components/BlogChatFAB";

export default function BlogLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            {children}
            <BlogChatFAB />
        </>
    );
}
