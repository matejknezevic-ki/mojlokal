// Instant-Feedback beim Tab-Wechsel: Skeleton erscheint sofort, während die
// Seite serverseitig lädt (wird von Next.js vorab geprefetcht).
export default function AdminLoading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 w-48 rounded-lg bg-espresso/10" />
      <div className="h-28 rounded-card bg-espresso/5" />
      <div className="h-28 rounded-card bg-espresso/5" />
      <div className="h-28 rounded-card bg-espresso/5" />
    </div>
  );
}
