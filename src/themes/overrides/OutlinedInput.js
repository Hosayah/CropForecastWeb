// project imports
import getColors from 'utils/getColors';
import getShadow from 'utils/getShadow';
import { withAlpha } from 'utils/colorUtils';

// ==============================|| OVERRIDES - INPUT BORDER & SHADOWS ||============================== //

function getColor({ variant, theme }) {
  const colors = getColors(theme, variant);
  const { light } = colors;

  const shadows = getShadow(theme, `${variant}`);

  return {
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: light },
    '&.Mui-focused': { boxShadow: shadows, '& .MuiOutlinedInput-notchedOutline': { border: '1px solid', borderColor: light } }
  };
}

// ==============================|| OVERRIDES - OUTLINED INPUT ||============================== //

export default function OutlinedInput(theme) {
  return {
    MuiOutlinedInput: {
      styleOverrides: {
        input: { padding: '12px 14px 12px 14px' },
        notchedOutline: { borderColor: theme.vars.palette.grey[300] },
        root: {
          borderRadius: 16,
          backgroundColor: withAlpha(theme.vars.palette.common.white, 0.86),
          backdropFilter: 'blur(10px)',
          transition: 'background-color 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
          ...getColor({ variant: 'primary', theme }),
          '&.Mui-error': { ...getColor({ variant: 'error', theme }) }
        },
        inputSizeSmall: { padding: '7.5px 8px 7.5px 12px' },
        inputMultiline: { padding: 0 },
        colorSecondary: getColor({ variant: 'secondary', theme }),
        colorError: getColor({ variant: 'error', theme }),
        colorWarning: getColor({ variant: 'warning', theme }),
        colorInfo: getColor({ variant: 'info', theme }),
        colorSuccess: getColor({ variant: 'success', theme })
      }
    }
  };
}
