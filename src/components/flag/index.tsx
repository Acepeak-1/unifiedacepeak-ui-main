import { parsePhoneNumber } from 'libphonenumber-js/max';
import { memo, useMemo } from 'react';
import ReactCountryFlag from 'react-country-flag';
const Flag = ({
  phoneNumber = '',
  className = '',
  svg = false,
}: {
  phoneNumber: string | undefined;
  className?: string;
  width?: number | undefined;
  height?: number | undefined;
  /* Emoji flags depend on the OS having a glyph for that regional
     indicator pair — Windows' emoji font is missing many of them (e.g.
     Guernsey), so an unsupported country silently falls back to some
     other glyph instead of a flag. Rendering the actual flag SVG sidesteps
     that entirely. Off by default so existing emoji-flag call sites don't
     change size/shape unexpectedly. */
  svg?: boolean;
}) => {
  const countryCode = useMemo(() => {
    try {
      if (phoneNumber && phoneNumber.startsWith('+')) {
        return parsePhoneNumber(phoneNumber)?.country || '';
      }
    } catch {
      return '';
    }

    return '';
  }, [phoneNumber]);

  if (!countryCode) return null;

  return (
    <span className={className}>
      <ReactCountryFlag
        countryCode={countryCode}
        svg={svg}
        style={
          svg
            ? { width: '1.1em', height: '1.1em', borderRadius: '2px' }
            : { fontSize: '1rem', lineHeight: '1rem' }
        }
      />
    </span>
  );
};

export default memo(Flag);
