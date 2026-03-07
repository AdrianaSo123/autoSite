export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <h1 className="text-4xl font-bold mb-4">Conversational Publishing Platform</h1>
      <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl text-center mb-8">
        Welcome to your AI-powered voice recording and publishing platform. What would you like to explore today?
      </p>

      {/* Placeholder for the chat interface */}
      <div className="w-full max-w-2xl border rounded-lg p-4 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 mb-12 shadow-sm min-h-[200px] flex items-center justify-center text-gray-400">
        Chat Interface Placeholder
      </div>

      {/* Placeholder for recent posts */}
      <div className="w-full max-w-2xl">
        <h2 className="text-2xl font-semibold mb-4">Recent Posts</h2>
        <div className="border border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-12 flex items-center justify-center text-gray-400">
          Recent Blog Posts Placeholder
        </div>
      </div>
    </div>
  );
}
