import Link from "next/link";

export default function ModuleFooter() {
  return (
    <div className="mt-12 pt-8 border-t border-gray-200">
      <Link href="/" className="inline-block text-blue-600 hover:text-blue-800">
        ← Back to Home
      </Link>

      <Link
        href="/modules"
        className="inline-block ml-4 text-blue-600 hover:text-blue-800"
      >
        ↑ Back to modules
      </Link>
    </div>
  );
}
