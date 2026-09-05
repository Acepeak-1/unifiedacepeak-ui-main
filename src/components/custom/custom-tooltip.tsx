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
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side} align={align} className={className} sideOffset={sideOffset}>
        {text}
      </TooltipContent>
    </Tooltip>
  );
};

export default CustomTooltip;
