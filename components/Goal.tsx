export function Goal({ children }: { children: React.ReactNode }) {
  return (
    <p className="not-prose my-3">
      <span className="font-bold text-teal-700">Your Goal:</span> {children}
    </p>
  );
}
