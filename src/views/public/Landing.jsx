import { Link as RouterLink, Navigate } from 'react-router-dom';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  Stack,
  Typography
} from '@mui/material';
import TimelineIcon from '@mui/icons-material/Timeline';
import YardIcon from '@mui/icons-material/Yard';
import MapIcon from '@mui/icons-material/Map';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import PsychologyRoundedIcon from '@mui/icons-material/PsychologyRounded';
import AgricultureRoundedIcon from '@mui/icons-material/AgricultureRounded';
import { useAuth } from 'contexts/AuthContext';
import onboardingStep1 from 'assets/images/onboarding/onbaording_1.jpg';
import onboardingStep2 from 'assets/images/onboarding/onboarding_2.jpg';
import onboardingStep3 from 'assets/images/onboarding/onboarding_3.jpg';

const FEATURES = [
  {
    title: 'AI Crop Forecast',
    description: 'Forecast crop performance by province and season using the latest validated model snapshot.',
    icon: TimelineIcon
  },
  {
    title: 'Farm-Based Recommendations',
    description: 'Get farm-specific crop recommendations based on your setup and environmental profile.',
    icon: YardIcon
  },
  {
    title: 'Province-Informed Insights',
    description: 'Use trend, risk, and outlook views to compare provinces and support better planning.',
    icon: MapIcon
  }
];

const HOW_IT_WORKS = [
  { title: 'Add your farm', image: onboardingStep1 },
  { title: 'Enter soil information', image: onboardingStep2 },
  { title: 'Get crop recommendations', image: onboardingStep3 }
];

const HERO_STATS = [
  { label: 'Forecast Coverage', value: '53 provinces', icon: MapIcon },
  { label: 'Recommendation Basis', value: 'Farm + soil profile', icon: AgricultureRoundedIcon },
  { label: 'Analytics Views', value: 'Trend, risk, outlook', icon: InsightsRoundedIcon }
];

const ANDROID_APP_URL = import.meta.env.VITE_ANDROID_APP_URL || '#';

function PhoneMockup({ src, alt }) {
  return (
    <Box
      sx={{
        width: { xs: 210, sm: 235, md: 220 },
        borderRadius: '30px',
        bgcolor: '#1f2430',
        p: '8px',
        boxShadow: '0 16px 36px rgba(18,25,38,0.26)'
      }}
    >
      <Box sx={{ borderRadius: '22px', overflow: 'hidden', bgcolor: '#111' }}>
        <Box sx={{ height: 22, bgcolor: '#111', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Box sx={{ width: 64, height: 6, borderRadius: 8, bgcolor: '#2a2a2a' }} />
        </Box>
        <Box component="img" src={src} alt={alt} sx={{ width: '100%', display: 'block' }} />
      </Box>
    </Box>
  );
}

export default function LandingPage() {
  const { user } = useAuth();
  if (user) return <Navigate to="/" replace />;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        py: { xs: 5, md: 7 },
        background:
          'radial-gradient(circle at 8% 0%, rgba(111, 191, 74, 0.12), transparent 30%), radial-gradient(circle at 96% 26%, rgba(59, 130, 246, 0.08), transparent 26%), linear-gradient(180deg, #F7FBF7 0%, #F3F5F7 100%)'
      }}
    >
      <Container maxWidth="lg" sx={{ px: { xs: 2, md: 3 } }}>
        <Stack sx={{ gap: { xs: 3, md: 4.5 } }}>
          <Card
            elevation={1}
            sx={{
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'divider',
              background:
                'radial-gradient(circle at 84% 12%, rgba(105, 193, 63, 0.26), rgba(105, 193, 63, 0) 38%), linear-gradient(135deg, #FFFFFF 0%, #F7FCF7 60%, #F5FAF8 100%)',
              boxShadow: '0 18px 50px rgba(16, 24, 40, 0.08)'
            }}
          >
            <CardContent sx={{ p: { xs: 3, md: 5.5 } }}>
              <Grid container spacing={{ xs: 3, md: 4 }} alignItems="center">
                <Grid size={{ xs: 12, md: 8 }}>
                  <Stack sx={{ gap: { xs: 1.5, md: 2.2 } }}>
                    <Chip label="Agricultural Decision Support" color="success" variant="outlined" sx={{ width: 'fit-content' }} />
                    <Typography variant="h2" sx={{ lineHeight: 1.08, letterSpacing: '-0.02em' }}>
                      AgriSense
                    </Typography>
                    <Typography variant="h5" color="text.secondary" sx={{ maxWidth: 700, lineHeight: 1.35 }}>
                      AI-powered crop forecasting and farm-based crop recommendations
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1, pt: { xs: 0.4, md: 0.8 } }}>
                      <Chip size="small" label="Forecast snapshots" />
                      <Chip size="small" label="Farm-aware insights" />
                      <Chip size="small" label="Province analytics" />
                    </Stack>
                  </Stack>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Stack sx={{ gap: 1.4 }}>
                    <Button
                      component={RouterLink}
                      to="/login"
                      variant="contained"
                      size="large"
                      endIcon={<ArrowForwardRoundedIcon />}
                      sx={{
                        py: 1.2,
                        fontWeight: 700,
                        transition: 'transform .18s ease, box-shadow .18s ease',
                        '&:hover': { transform: 'translateY(-1px)', boxShadow: '0 10px 22px rgba(27,120,55,0.28)' }
                      }}
                    >
                      Login
                    </Button>
                    <Button
                      component={RouterLink}
                      to="/register"
                      variant="outlined"
                      size="large"
                      sx={{
                        py: 1.2,
                        fontWeight: 700,
                        transition: 'transform .18s ease, border-color .18s ease',
                        '&:hover': { transform: 'translateY(-1px)', borderColor: 'success.main' }
                      }}
                    >
                      Create Account
                    </Button>
                    <Button
                      component="a"
                      href={ANDROID_APP_URL}
                      target="_blank"
                      rel="noreferrer"
                      variant="text"
                      size="large"
                      sx={{
                        py: 1,
                        transition: 'transform .18s ease, color .18s ease',
                        '&:hover': { transform: 'translateX(2px)', color: 'success.dark' }
                      }}
                    >
                      Download Android App
                    </Button>
                  </Stack>
                </Grid>
              </Grid>

              <Grid container spacing={1.5} sx={{ mt: { xs: 2.2, md: 3.2 } }}>
                {HERO_STATS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Grid key={item.label} size={{ xs: 12, md: 4 }}>
                      <Card
                        variant="outlined"
                        sx={{
                          borderRadius: 3,
                          bgcolor: 'rgba(255,255,255,0.65)',
                          borderColor: 'rgba(27, 120, 55, 0.18)'
                        }}
                      >
                        <CardContent sx={{ p: { xs: 1.6, md: 1.8 } }}>
                          <Stack direction="row" spacing={1.2} alignItems="center">
                            <Avatar sx={{ bgcolor: 'success.lighter', width: 34, height: 34 }}>
                              <Icon color="success" fontSize="small" />
                            </Avatar>
                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                {item.label}
                              </Typography>
                              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                {item.value}
                              </Typography>
                            </Box>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </CardContent>
          </Card>

          <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', backgroundColor: 'rgba(255,255,255,0.84)' }}>
            <CardContent sx={{ p: { xs: 3, md: 4.5 } }}>
              <Stack sx={{ gap: 2.5 }}>
                <Stack sx={{ gap: 0.8 }}>
                  <Typography variant="overline" color="text.secondary">
                    Platform capabilities
                  </Typography>
                  <Typography variant="h4">Features</Typography>
                </Stack>
                <Grid container spacing={2}>
                  {FEATURES.map((feature) => {
                    const Icon = feature.icon;
                    return (
                      <Grid key={feature.title} size={{ xs: 12, md: 4 }}>
                        <Card
                          variant="outlined"
                          sx={{
                            height: '100%',
                            borderRadius: 3,
                            transition: 'transform .18s ease, box-shadow .18s ease',
                            background: 'linear-gradient(180deg, #ffffff 0%, #f8fbf8 100%)',
                            '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 10px 28px rgba(16,24,40,0.12)' }
                          }}
                        >
                          <CardContent>
                            <Stack sx={{ gap: 1.1 }}>
                              <Box sx={{ width: 42, height: 42, borderRadius: 2, bgcolor: 'success.lighter', display: 'grid', placeItems: 'center' }}>
                                <Icon color="success" />
                              </Box>
                              <Typography variant="h5">{feature.title}</Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.62 }}>
                                {feature.description}
                              </Typography>
                            </Stack>
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              </Stack>
            </CardContent>
          </Card>

          <Card
            elevation={0}
            sx={{
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'divider',
              background: 'linear-gradient(90deg, #0F172A 0%, #1F2937 100%)',
              color: 'common.white',
              transition: 'transform .2s ease, box-shadow .2s ease',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 12px 26px rgba(15,23,42,0.22)' }
            }}
          >
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Grid container spacing={2} alignItems="center">
                <Grid size={{ xs: 12, md: 8 }}>
                  <Stack sx={{ gap: 0.8 }}>
                    <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      Decision confidence
                    </Typography>
                    <Typography variant="h4" sx={{ color: 'common.white' }}>
                      Built for practical farm decisions
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.82)' }}>
                      AgriSense combines province-level analytics and farm-level recommendations in one workflow.
                    </Typography>
                  </Stack>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Stack direction="row" spacing={1} justifyContent={{ xs: 'flex-start', md: 'flex-end' }} flexWrap="wrap">
                    <Chip icon={<PsychologyRoundedIcon />} label="AI-guided" sx={{ bgcolor: 'rgba(255,255,255,0.14)', color: 'white' }} />
                    <Chip icon={<TimelineIcon />} label="Forecast-ready" sx={{ bgcolor: 'rgba(255,255,255,0.14)', color: 'white' }} />
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: { xs: 3, md: 4.5 } }}>
              <Stack sx={{ gap: 2 }}>
                <Stack sx={{ gap: 0.8 }}>
                  <Typography variant="overline" color="text.secondary">
                    Quick start
                  </Typography>
                  <Typography variant="h4">How It Works</Typography>
                </Stack>
                <Grid container spacing={2}>
                  {HOW_IT_WORKS.map((step, index) => (
                    <Grid key={step.title} size={{ xs: 12, md: 4 }}>
                      <Card
                        variant="outlined"
                        sx={{
                          borderRadius: 3,
                          overflow: 'hidden',
                          height: '100%',
                          transition: 'transform .18s ease, box-shadow .18s ease',
                          '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 10px 26px rgba(16,24,40,0.11)' }
                        }}
                      >
                        <Box sx={{ bgcolor: 'grey.50', py: 3, px: 1.5, display: 'flex', justifyContent: 'center' }}>
                          <PhoneMockup src={step.image} alt={`How it works step ${index + 1}`} />
                        </Box>
                        <CardContent sx={{ py: 2.2 }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Step {index + 1}
                          </Typography>
                          <Typography variant="h6">{step.title}</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Stack>
            </CardContent>
          </Card>

          <Card
            elevation={0}
            sx={{
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'divider',
              background:
                'radial-gradient(circle at 0% 40%, rgba(105, 193, 63, 0.17), transparent 30%), linear-gradient(95deg, #F8FFF4 0%, #FFFFFF 100%)'
            }}
          >
            <CardContent sx={{ p: { xs: 3, md: 4.5 } }}>
              <Grid container spacing={2} alignItems="center">
                <Grid size={{ xs: 12, md: 8 }}>
                  <Stack sx={{ gap: 1.1 }}>
                    <Typography variant="overline" color="text.secondary">
                      Mobile app
                    </Typography>
                    <Typography variant="h4">Get AgriSense on Android</Typography>
                    <Typography variant="body1" color="text.secondary">
                      Use AgriSense on-the-go for quick farm monitoring and recommendation access.
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      <Chip size="small" label="Real-time snapshot" color="success" variant="outlined" />
                      <Chip size="small" label="Farm and map views" color="success" variant="outlined" />
                    </Stack>
                  </Stack>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Stack alignItems={{ xs: 'flex-start', md: 'flex-end' }}>
                    <Button
                      component="a"
                      href={ANDROID_APP_URL}
                      target="_blank"
                      rel="noreferrer"
                      variant="contained"
                      startIcon={<DownloadRoundedIcon />}
                      size="large"
                      sx={{
                        fontWeight: 700,
                        transition: 'transform .18s ease, box-shadow .18s ease',
                        '&:hover': { transform: 'translateY(-1px)', boxShadow: '0 10px 24px rgba(27,120,55,0.26)' }
                      }}
                    >
                      Download Android App
                    </Button>
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Stack>
      </Container>
    </Box>
  );
}
