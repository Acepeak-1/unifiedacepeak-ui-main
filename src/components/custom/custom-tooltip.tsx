import { useEffect, useRef, useState } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

const CustomTooltip = ({
  text,
  children,
  side = 'right',
  className = '',
  sideOffset,
  align,
}: {
  text: string | React.ReactNode;
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
  /** Gap between trigger and tooltip; defaults to the base 4px. */
  sideOffset?: number;
  /** Edge alignment along `side`; Radix defaults to 'center'. */
  align?: 'start' | 'center' | 'end';
}) => {
  const [open, setOpen] = useState(openOnMount);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!openOnMount) return;
    timerRef.current = setTimeout(() => setOpen(false), openOnMountDuration);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Tooltip {...(openOnMount ? { open, onOpenChange: setOpen } : {})}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side} align={align} className={className} sideOffset={sideOffset}>
        {text}
      </TooltipContent>
    </Tooltip>
  );
};

export default CustomTooltip;
