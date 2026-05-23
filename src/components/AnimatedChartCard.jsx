import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export default function AnimatedChartCard({ title, children, delay = 0 }) {
  const cardRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    const card = cardRef.current;
    const content = contentRef.current;
    if (!card || !content) return;

    // Card entry animation
    gsap.fromTo(
      card,
      { opacity: 0, y: 30, scale: 0.95 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.6,
        delay,
        ease: 'power3.out',
      }
    );

    // Chart content animation
    gsap.fromTo(
      content,
      { opacity: 0 },
      {
        opacity: 1,
        duration: 0.8,
        delay: delay + 0.3,
        ease: 'power2.out',
      }
    );
  }, [delay]);

  return (
    <Card
      ref={cardRef}
      sx={{
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {title && (
          <Typography variant="h6" sx={{ mb: 2 }}>
            {title}
          </Typography>
        )}
        <Box ref={contentRef}>{children}</Box>
      </CardContent>
    </Card>
  );
}
