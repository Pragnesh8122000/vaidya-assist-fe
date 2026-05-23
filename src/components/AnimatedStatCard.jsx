import { useRef, useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export default function AnimatedStatCard({ title, value, icon, color, subtitle }) {
  const cardRef = useRef(null);
  const [transform, setTransform] = useState({ rotateX: 0, rotateY: 0, scale: 1 });

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / 10;
    const rotateY = (centerX - x) / 10;
    setTransform({ rotateX, rotateY, scale: 1.02 });
  };

  const handleMouseLeave = () => {
    setTransform({ rotateX: 0, rotateY: 0, scale: 1 });
  };

  return (
    <Card
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      sx={{
        height: '100%',
        position: 'relative',
        overflow: 'visible',
        transition: 'transform 0.15s ease-out, box-shadow 0.3s ease',
        transform: `perspective(600px) rotateX(${transform.rotateX}deg) rotateY(${transform.rotateY}deg) scale(${transform.scale})`,
        boxShadow: transform.scale > 1
          ? '0 20px 40px rgba(21,101,192,0.3)'
          : '0 4px 20px rgba(0,0,0,0.1)',
        '&:hover': {
          boxShadow: '0 25px 50px rgba(21,101,192,0.4)',
        },
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: -10,
          right: -10,
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: `${color}15`,
          transition: 'transform 0.3s ease',
          transform: transform.scale > 1 ? 'scale(1.2)' : 'scale(1)',
        }}
      />
      <CardContent sx={{ position: 'relative' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h3" fontWeight={700} sx={{ color }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '12px',
              background: `${color}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.3s ease',
              transform: transform.scale > 1 ? 'scale(1.1) rotate(5deg)' : 'scale(1) rotate(0deg)',
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
