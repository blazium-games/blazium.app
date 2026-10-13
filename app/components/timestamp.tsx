export function Timestamp({ timestamp }: { timestamp: string }) {
  return (
    <time dateTime={timestamp} title={new Date(timestamp).toUTCString()}>{
      new Date(timestamp).toLocaleDateString(
        "en-US",
        {
          day: "numeric",
          month: "short",
          year: "numeric",
        },
      )
    }</time>
  );
}