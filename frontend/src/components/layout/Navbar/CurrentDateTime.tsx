import { useEffect, useState } from "react";

// Philippine time. The full date only fits from the medium breakpoint up; on
// phones a short date keeps the navbar on one line.
const CurrentDateTime = () => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const options = { timeZone: "Asia/Manila" } as const;

  return (
    <div className='flex min-w-0 items-baseline gap-2 text-sm'>
      <time className='font-medium tabular-nums'>
        {now.toLocaleTimeString("en-PH", {
          ...options,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })}
      </time>

      <span className='hidden truncate text-muted-foreground md:inline'>
        {now.toLocaleDateString("en-PH", {
          ...options,
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </span>
      <span className='hidden text-muted-foreground sm:inline md:hidden'>
        {now.toLocaleDateString("en-PH", {
          ...options,
          month: "short",
          day: "numeric",
        })}
      </span>
    </div>
  );
};

export default CurrentDateTime;
