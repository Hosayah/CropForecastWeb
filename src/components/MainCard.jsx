import PropTypes from 'prop-types';

// material-ui
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';

export default function MainCard({
  border = true,
  boxShadow,
  children,
  subheader,
  content = true,
  contentSX = {},
  darkTitle,
  divider = true,
  elevation,
  secondary,
  shadow,
  sx = {},
  title,
  codeHighlight = false,
  codeString,
  modal = false,
  ref,
  ...others
}) {
  return (
    <Card
      elevation={elevation || 0}
      sx={(theme) => ({
        position: 'relative',
        overflow: 'hidden',
        ...(border && { border: `1px solid ${theme.vars.palette.grey[200]}` }),
        borderRadius: 4,
        background: `linear-gradient(180deg, ${theme.vars.palette.common.white} 0%, ${theme.vars.palette.grey[0]} 100%)`,
        boxShadow: boxShadow && !border ? shadow || theme.vars.customShadows.z1 : theme.vars.customShadows.z1,
        transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            'linear-gradient(135deg, rgba(82, 196, 26, 0.08) 0%, rgba(82, 196, 26, 0.02) 22%, rgba(255,255,255,0) 55%)'
        },
        ':hover': {
          boxShadow: boxShadow ? shadow || theme.vars.customShadows.z1 : theme.vars.customShadows.z1,
          borderColor: theme.vars.palette.grey[300],
          transform: 'translateY(-1px)'
        },
        ...(codeHighlight && {
          '& pre': { margin: 0, padding: '12px !important', fontFamily: theme.typography.fontFamily, fontSize: '0.75rem' }
        }),
        ...(modal && {
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: `calc(100% - 50px)`, sm: 'auto' },
          maxWidth: 768
        }),
        ...(typeof sx === 'function' ? sx(theme) : sx || {})
      })}
      ref={ref}
      {...others}
    >
      {/* card header and action */}
      {!darkTitle && title && (
        <CardHeader
          sx={{ p: 3, pb: subheader ? 2.25 : 2.5 }}
          slotProps={{
            title: { variant: darkTitle ? 'h4' : 'subtitle1' },
            action: { sx: { m: '0px auto', alignSelf: 'center' } }
          }}
          title={title}
          action={secondary}
          subheader={subheader}
        />
      )}

      {/* content & header divider */}
      {title && divider && <Divider />}

      {/* card content */}
      {content && (
        <CardContent
          sx={contentSX}
        >
          {children}
        </CardContent>
      )}
      {!content && children}
    </Card>
  );
}

MainCard.propTypes = {
  border: PropTypes.bool,
  boxShadow: PropTypes.bool,
  children: PropTypes.node,
  subheader: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  content: PropTypes.bool,
  contentSX: PropTypes.object,
  darkTitle: PropTypes.bool,
  divider: PropTypes.bool,
  elevation: PropTypes.number,
  secondary: PropTypes.any,
  shadow: PropTypes.string,
  sx: PropTypes.object,
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  codeHighlight: PropTypes.bool,
  codeString: PropTypes.string,
  modal: PropTypes.bool,
  ref: PropTypes.object,
  others: PropTypes.any
};
