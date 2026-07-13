// Instant-Feedback beim Tab-Wechsel in der Kellner-App.
export default function WaiterLoading() {
  return (
    <div className="flex flex-1 animate-pulse flex-col space-y-4">
      <div className="h-36 rounded-card bg-espresso/10" />
      <div className="h-24 rounded-card bg-espresso/5" />
      <div className="h-24 rounded-card bg-espresso/5" />
    </div>
  );
}
