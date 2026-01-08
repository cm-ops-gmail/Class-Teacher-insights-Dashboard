import React, { useState, useRef, useEffect } from 'react';
import { Award, Users, Clock, Star, Package, BarChart, TrendingUp, Download, Play, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type StatDetail = {
  fb: number;
  app: number;
  total: number;
};

type TeacherStats = {
  name: string;
  classCount: StatDetail;
  totalDuration: StatDetail;
  totalAverageAttendance: StatDetail;
  avgAttendance: StatDetail;
  highestPeakAttendance: StatDetail;
  uniqueCourses: string[];
  uniqueProductTypes: string[];
  averageRating: number;
  ratedClassesCount: number;
  imageUrl?: string;
  ratedClasses: any[];
};

type PlatformTotals = {
  classCount: number;
  totalDuration: number;
  totalAverageAttendance: number;
};

interface TeacherRecapSlideshowProps {
  stats: TeacherStats;
  platformTotals: PlatformTotals;
  isOpen: boolean;
  onClose: () => void;
}

const TeacherRecapSlideshow: React.FC<TeacherRecapSlideshowProps> = ({ stats, platformTotals, isOpen, onClose }) => {
  const [stage, setStage] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const teacherImageRef = useRef<HTMLImageElement | null>(null);


  useEffect(() => {
    if (stats.imageUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = stats.imageUrl;
      img.onload = () => {
        teacherImageRef.current = img;
      };
      img.onerror = () => {
        console.error("Failed to load teacher image.");
        teacherImageRef.current = null;
      };
    } else {
        teacherImageRef.current = null;
    }
  }, [stats.imageUrl]);


  if (!stats || !platformTotals) {
    return null;
  }

  const contributions = [
    {
      title: "Contributed to platform's total classes",
      value: platformTotals.classCount > 0 ? ((stats.classCount.total / platformTotals.classCount) * 100).toFixed(2) : "0.00",
      color: "#60a5fa",
      gradient: ["#60a5fa", "#93c5fd"]
    },
    {
      title: "Contributed to platform's total avg attendance",
      value: platformTotals.totalAverageAttendance > 0 ? ((stats.totalAverageAttendance.total / platformTotals.totalAverageAttendance) * 100).toFixed(2) : "0.00",
      color: "#34d399",
      gradient: ["#34d399", "#6ee7b7"]
    },
    {
      title: "Contributed to platform's total duration",
      value: platformTotals.totalDuration > 0 ? ((stats.totalDuration.total / platformTotals.totalDuration) * 100).toFixed(2) : "0.00",
      color: "#a78bfa",
      gradient: ["#a78bfa", "#c4b5fd"]
    }
  ];

  const cards = [
    {
      title: "Total Classes Taught",
      value: (stats.classCount?.total || 0).toLocaleString(),
      fb: stats.classCount?.fb || 0,
      app: stats.classCount?.app || 0,
      color: "#60a5fa",
      gradient: ["#60a5fa", "#3b82f6", "#93c5fd"],
      detail: "Classes conducted across both platforms",
      motivationBefore: "🎓 Your Teaching Journey",
      motivationSub: "Every class is a step towards excellence",
      motivationAfter: "Amazing dedication! Your commitment to education shines bright! 🌟",
      animationType: 'slideRight' as const,
      icon: '📚',
      showPlatformSplit: true
    },
    {
      title: "Combined Avg. Attendance",
      value: (stats.avgAttendance?.total || 0).toLocaleString(),
      fb: stats.avgAttendance?.fb || 0,
      app: stats.avgAttendance?.app || 0,
      color: "#34d399",
      gradient: ["#34d399", "#10b981", "#6ee7b7"],
      detail: "Average students per class",
      motivationBefore: "👥 Student Impact",
      motivationSub: "Each number represents a life touched",
      motivationAfter: "Incredible reach! Your influence extends far and wide! 💚",
      animationType: 'slideLeft' as const,
      icon: '👨‍🎓',
      showPlatformSplit: true
    },
    {
      title: "Unique Courses Taught",
      value: (stats.uniqueCourses?.length || 0).toString(),
      color: "#c084fc",
      gradient: ["#c084fc", "#a855f7", "#e9d5ff"],
      detail: "Different course subjects mastered",
      motivationBefore: "📚 Teaching Versatility",
      motivationSub: "Mastery across multiple domains",
      motivationAfter: "Remarkable versatility! You're a true educational expert! 🎯",
      animationType: 'zoomRotate' as const,
      icon: '🎯',
      showPlatformSplit: false
    },
    {
      title: "Highest Peak Attendance",
      value: (stats.highestPeakAttendance?.total || 0).toLocaleString(),
      color: "#f87171",
      gradient: ["#f87171", "#ef4444", "#fca5a5"],
      detail: "Maximum students in a single class",
      motivationBefore: "🌟 Your Peak Moment",
      motivationSub: "When you captivated the most minds",
      motivationAfter: "Outstanding achievement! Your record attendance is phenomenal! 🏆",
      animationType: 'bounceIn' as const,
      icon: '🏆',
      showPlatformSplit: false
    },
    {
      title: "Total Duration (min)",
      value: (stats.totalDuration?.total || 0).toLocaleString(),
      fb: stats.totalDuration?.fb || 0,
      app: stats.totalDuration?.app || 0,
      color: "#818cf8",
      gradient: ["#818cf8", "#6366f1", "#a5b4fc"],
      detail: "Cumulative teaching time invested",
      motivationBefore: "⏰ Time Investment",
      motivationSub: "Hours dedicated to shaping futures",
      motivationAfter: "Every minute invested builds tomorrow's leaders! ⏱️",
      animationType: 'flipIn' as const,
      icon: '⏱️',
      showPlatformSplit: true
    },
    {
      title: "Average Rating",
      value: (stats.averageRating || 0).toFixed(2),
      color: "#fbbf24",
      gradient: ["#fbbf24", "#f59e0b", "#fcd34d"],
      detail: `Based on ${stats.ratedClassesCount || 0} rated classes`,
      motivationBefore: "⭐ Quality Recognition",
      motivationSub: "Excellence acknowledged by students",
      motivationAfter: "Outstanding feedback! Students truly value your teaching! ✨",
      animationType: 'spiralIn' as const,
      icon: '⭐',
      showPlatformSplit: false
    },
    {
      title: "Unique Product Types",
      value: (stats.uniqueProductTypes?.length || 0).toString(),
      color: "#22d3ee",
      gradient: ["#22d3ee", "#06b6d4", "#67e8f9"],
      detail: "Different course products delivered",
      motivationBefore: "📦 Product Diversity",
      motivationSub: "Breadth of educational offerings",
      motivationAfter: "Impressive range! Your product expertise is remarkable! 📦",
      animationType: 'slideRight' as const,
      icon: '📦',
      showPlatformSplit: false
    }
  ];

  const createParticles = (count: number, time: number, colorScheme: string[]) => {
    const particles = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 200 + Math.sin(time * 2 + i * 0.5) * 150;
      const speed = 0.5 + Math.sin(i) * 0.3;
      particles.push({
        x: Math.cos(angle + time * speed) * radius,
        y: Math.sin(angle + time * speed) * radius,
        size: 2 + Math.sin(time * 3 + i) * 2,
        opacity: 0.3 + Math.sin(time * 2 + i * 0.3) * 0.2,
        color: colorScheme[i % colorScheme.length]
      });
    }
    return particles;
  };

  const drawCrispText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, fontSize: number, color: string, align: CanvasTextAlign = 'center', weight = '700') => {
    ctx.save();
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.font = `${weight} ${fontSize}px "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, Roboto, "Helvetica Neue", Arial, sans-serif`;
    ctx.fillText(text, Math.round(x), Math.round(y));
    ctx.restore();
  };

  const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);
  const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  const getCardAnimation = (animationType: string, progress: number) => {
    const easeProgress = easeOutQuart(progress);
    const smoothProgress = easeInOutCubic(progress);

    switch (animationType) {
      case 'slideRight':
        return { translateX: (1 - easeProgress) * -1400, translateY: 0, scale: 0.9 + easeProgress * 0.1, opacity: smoothProgress, rotate: 0 };
      case 'slideLeft':
        return { translateX: (1 - easeProgress) * 1400, translateY: 0, scale: 0.9 + easeProgress * 0.1, opacity: smoothProgress, rotate: 0 };
      case 'zoomRotate':
        return { translateX: 0, translateY: 0, scale: 0.6 + easeProgress * 0.4, opacity: smoothProgress, rotate: (1 - easeProgress) * 180 };
      case 'bounceIn':
        const bounceHeight = (1 - easeProgress) * 600;
        return { translateX: 0, translateY: -bounceHeight, scale: 0.75 + easeProgress * 0.25, opacity: smoothProgress, rotate: 0 };
      case 'flipIn':
        return { translateX: 0, translateY: 0, scale: 0.8 + easeProgress * 0.2, opacity: smoothProgress, rotate: (1 - easeProgress) * 90 };
      case 'spiralIn':
        const spiralAngle = (1 - easeProgress) * Math.PI * 2.5;
        const spiralRadius = (1 - easeProgress) * 400;
        return { translateX: Math.cos(spiralAngle) * spiralRadius, translateY: Math.sin(spiralAngle) * spiralRadius, scale: 0.7 + easeProgress * 0.3, opacity: smoothProgress, rotate: (1 - easeProgress) * 360 };
      default:
        return { translateX: 0, translateY: 0, scale: 1, opacity: 1, rotate: 0 };
    }
  };

  const drawFrame = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, currentStage: number) => {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    const bgGradient = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width / 2);
    bgGradient.addColorStop(0, '#1e293b');
    bgGradient.addColorStop(0.5, '#0f172a');
    bgGradient.addColorStop(1, '#020617');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // INTRO (0-5s)
    if (currentStage < 5) {
      const introProgress = currentStage / 5;
      const introOpacity = introProgress < 0.25 ? introProgress * 4 : (introProgress > 0.8 ? (1 - introProgress) * 5 : 1);
      
      const particles = createParticles(50, currentStage, ['#60a5fa', '#93c5fd', '#dbeafe']);
      particles.forEach(p => {
        ctx.globalAlpha = p.opacity * introOpacity;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(canvas.width / 2 + p.x, canvas.height / 2 + p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      
      ctx.globalAlpha = introOpacity;
      drawCrispText(ctx, 'Performance Recap', canvas.width / 2, canvas.height / 2 - 50, 110, '#60a5fa', 'center', '900');
      drawCrispText(ctx, '2025 Teaching Overview', canvas.width / 2, canvas.height / 2 + 60, 48, '#94a3b8', 'center', '700');
      
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + currentStage * 2;
        const radius = 350;
        const x = canvas.width / 2 + Math.cos(angle) * radius;
        const y = canvas.height / 2 + Math.sin(angle) * radius;
        ctx.font = '40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('⭐', x, y);
      }
      
      ctx.globalAlpha = 1;
      return;
    }

    // TEACHER NAME (5-11s) - CHANGED FROM 10 TO 11
    if (currentStage >= 5 && currentStage < 11) {
      const nameProgress = (currentStage - 5) / 6; // CHANGED FROM / 5 TO / 6
      const nameOpacity = nameProgress < 0.25 ? nameProgress * 4 : (nameProgress > 0.8 ? (1 - nameProgress) * 5 : 1);
      
      const particles = createParticles(40, currentStage, ['#60a5fa', '#34d399', '#a78bfa']);
      particles.forEach(p => {
        ctx.globalAlpha = p.opacity * nameOpacity * 0.4;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(canvas.width / 2 + p.x, canvas.height / 2 + p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      
      ctx.globalAlpha = nameOpacity;
      
      const hasImage = !!teacherImageRef.current;
      const textX = hasImage ? canvas.width / 2 - 200 : canvas.width / 2;

      if (hasImage) {
        const img = teacherImageRef.current!;
        const imgSize = 300;
        const imgX = canvas.width / 2 - imgSize / 2 - 580;
        const imgY = canvas.height / 2 - imgSize / 2;
        
        ctx.save();
        ctx.globalAlpha = nameOpacity * easeOutQuart(Math.min(nameProgress * 2, 1));
        ctx.beginPath();
        ctx.arc(imgX + imgSize / 2, imgY + imgSize / 2, imgSize / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, imgX, imgY, imgSize, imgSize);
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 8;
        ctx.stroke();
        ctx.restore();
      }
      
      // Handle long names with text wrapping
      const nameScale = 1 + Math.sin(nameProgress * Math.PI * 2) * 0.05;
      const teacherName = stats.name || 'Teacher';
      const maxWidth = hasImage ? 1050 : 1400;
      const fontSize = 85;
      const lineHeight = 95;
      
      ctx.save();
      ctx.font = `900 ${fontSize}px "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, Roboto, "Helvetica Neue", Arial, sans-serif`;
      
      // Check if text needs wrapping
      const textWidth = ctx.measureText(teacherName).width;
      
      if (textWidth > maxWidth) {
        // Split into words and wrap
        const words = teacherName.split(' ');
        const lines: string[] = [];
        let currentLine = words[0];
        
        for (let i = 1; i < words.length; i++) {
          const testLine = currentLine + ' ' + words[i];
          const testWidth = ctx.measureText(testLine).width;
          
          if (testWidth > maxWidth) {
            lines.push(currentLine);
            currentLine = words[i];
          } else {
            currentLine = testLine;
          }
        }
        lines.push(currentLine);
        
        // Draw wrapped lines - centered vertically around original position
        const totalHeight = (lines.length - 1) * lineHeight;
        const startY = canvas.height / 2 - 200 - (totalHeight / 2);
        
        lines.forEach((line, index) => {
          ctx.save();
          ctx.translate(textX, startY + index * lineHeight);
          ctx.scale(nameScale, nameScale);
          drawCrispText(ctx, line, 0, 0, fontSize, '#ffffff', hasImage ? 'left' : 'center', '900');
          ctx.restore();
        });
        
        // Adjust subtitle position to be below the last line
        const subtitleY = startY + totalHeight + 50;
        drawCrispText(ctx, 'Aggregated Performance Overview', textX, subtitleY, 40, '#94a3b8', hasImage ? 'left' : 'center', '700');
        
        // Adjust contributions to start below subtitle
        const contribStart = (currentStage - 7) / 4; // CHANGED FROM 6.5 TO 7 AND 3.5 TO 4
        if (contribStart > 0) {
          const contribStartY = subtitleY + 80;
          
          contributions.forEach((contrib, i) => {
            const itemProgress = Math.max(0, Math.min(1, (contribStart - i * 0.25) * 3));
            const easeProgress = easeOutQuart(itemProgress);
            
            ctx.globalAlpha = itemProgress * nameOpacity;
            
            const y = contribStartY + i * 90;
            const slideIn = (1 - easeProgress) * 100;
            
            const textStartX = hasImage ? textX : (canvas.width - 900) / 2;
            const percentageStartX = hasImage ? textX + 900 : (canvas.width + 900) / 2;
            
            const bulletX = textStartX + slideIn;
            const textRenderX = bulletX + 20;

            ctx.fillStyle = contrib.color;
            ctx.beginPath();
            ctx.arc(bulletX, y, 6, 0, Math.PI*2);
            ctx.fill();

            drawCrispText(ctx, contrib.title, textRenderX, y, 30, '#cbd5e1', 'left', '600');
            drawCrispText(ctx, `${contrib.value}%`, percentageStartX, y, 52, contrib.color, 'right', '800');
          });
        }
      } else {
        // Single line - original behavior
        ctx.save();
        ctx.translate(textX, canvas.height / 2 - 200);
        ctx.scale(nameScale, nameScale);
        drawCrispText(ctx, teacherName, 0, 0, fontSize, '#ffffff', hasImage ? 'left' : 'center', '900');
        ctx.restore();
        
        drawCrispText(ctx, 'Aggregated Performance Overview', textX, canvas.height / 2 - 100, 40, '#94a3b8', hasImage ? 'left' : 'center', '700');
        
        const contribStart = (currentStage - 7) / 4; // CHANGED FROM 6.5 TO 7 AND 3.5 TO 4
        if (contribStart > 0) {
          contributions.forEach((contrib, i) => {
            const itemProgress = Math.max(0, Math.min(1, (contribStart - i * 0.25) * 3));
            const easeProgress = easeOutQuart(itemProgress);
            
            ctx.globalAlpha = itemProgress * nameOpacity;
            
            const y = canvas.height / 2 + 60 + i * 90;
            const slideIn = (1 - easeProgress) * 100;
            
            const textStartX = hasImage ? textX : (canvas.width - 900) / 2;
            const percentageStartX = hasImage ? textX + 900 : (canvas.width + 900) / 2;
            
            const bulletX = textStartX + slideIn;
            const textRenderX = bulletX + 20;

            ctx.fillStyle = contrib.color;
            ctx.beginPath();
            ctx.arc(bulletX, y, 6, 0, Math.PI*2);
            ctx.fill();

            drawCrispText(ctx, contrib.title, textRenderX, y, 30, '#cbd5e1', 'left', '600');
            drawCrispText(ctx, `${contrib.value}%`, percentageStartX, y, 52, contrib.color, 'right', '800');
          });
        }
      }
      
      ctx.restore();
      ctx.globalAlpha = 1;
      return;
    }

    // CARDS (11-95s) - CHANGED FROM 10 TO 11
    const cardSequenceStart = 11; // CHANGED FROM 10 TO 11
    const timePerCard = 12;
    
    if (currentStage >= cardSequenceStart && currentStage < cardSequenceStart + (timePerCard * cards.length)) {
      const relativeTime = currentStage - cardSequenceStart;
      const cardIndex = Math.floor(relativeTime / timePerCard);
      const cardPhase = relativeTime % timePerCard;
      
      if (cardIndex < cards.length) {
        const card = cards[cardIndex];
        
        // MOTIVATION BEFORE (0-4s)
        if (cardPhase < 4) {
          const motivProgress = cardPhase / 4;
          const motivOpacity = motivProgress < 0.2 ? motivProgress / 0.2 : (motivProgress > 0.8 ? (1 - motivProgress) / 0.2 : 1);
          
          const particles = createParticles(60, cardPhase, card.gradient);
          particles.forEach(p => {
            ctx.globalAlpha = p.opacity * motivOpacity * 0.5;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(canvas.width / 2 + p.x, canvas.height / 2 + p.y, p.size * 1.5, 0, Math.PI * 2);
            ctx.fill();
          });
          
          ctx.globalAlpha = motivOpacity;
          
          const iconBounce = Math.sin(cardPhase * Math.PI * 2) * 20;
          ctx.font = '140px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(card.icon, canvas.width / 2, canvas.height / 2 - 180 + iconBounce);
          
          const lines = card.motivationBefore.split(' ');
          const text = lines.slice(1).join(' ');
          
          drawCrispText(ctx, text, canvas.width / 2, canvas.height / 2, 76, card.color, 'center', '900');
          drawCrispText(ctx, card.motivationSub, canvas.width / 2, canvas.height / 2 + 95, 42, '#cbd5e1', 'center', '700');
          
          ctx.globalAlpha = 1;
          return;
        }
        
        // CARD DISPLAY + MOTIVATION AFTER (4-12s)
        if (cardPhase >= 4) {
          const cardDisplayPhase = cardPhase - 4;
          
          // Show card for first 4 seconds (4-8s)
          if (cardDisplayPhase < 4) {
            const cardProgress = Math.min(cardDisplayPhase / 4, 1);
            
            const particles = createParticles(30, currentStage, card.gradient);
            particles.forEach(p => {
              ctx.globalAlpha = p.opacity * 0.3;
              ctx.fillStyle = p.color;
              ctx.beginPath();
              ctx.arc(canvas.width / 2 + p.x * 1.5, canvas.height / 2 + p.y * 1.5, p.size, 0, Math.PI * 2);
              ctx.fill();
            });
            
            const entranceProgress = Math.min(cardProgress * 2, 1);
            const anim = getCardAnimation(card.animationType, entranceProgress);
            
            ctx.save();
            ctx.globalAlpha = anim.opacity || 1;
            
            const cardW = 1100;
            const cardH = 650;
            
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.translate(anim.translateX || 0, anim.translateY || 0);
            ctx.scale(anim.scale || 1, anim.scale || 1);
            if (anim.rotate) ctx.rotate((anim.rotate * Math.PI) / 180);
            
            // Create path once for both fill and stroke
            const cardPath = new Path2D();
            cardPath.roundRect(-cardW/2, -cardH/2, cardW, cardH, 25);
            
            // Fill background
            const bgGradient = ctx.createLinearGradient(-cardW/2, -cardH/2, -cardW/2, cardH/2);
            bgGradient.addColorStop(0, '#1e293b');
            bgGradient.addColorStop(1, '#0f172a');
            ctx.fillStyle = bgGradient;
            ctx.fill(cardPath);
            
            // Single clean border
            ctx.strokeStyle = card.color;
            ctx.lineWidth = 3;
            ctx.stroke(cardPath);
            
            // Accent gradient bar at top
            const accentGradient = ctx.createLinearGradient(-cardW/2, 0, cardW/2, 0);
            card.gradient.forEach((c, i) => accentGradient.addColorStop(i / (card.gradient.length - 1), c));
            ctx.fillStyle = accentGradient;
            
            // Draw accent bar with rounded top corners only
            ctx.beginPath();
            ctx.moveTo(-cardW/2 + 25, -cardH/2);
            ctx.lineTo(cardW/2 - 25, -cardH/2);
            ctx.arcTo(cardW/2, -cardH/2, cardW/2, -cardH/2 + 25, 25);
            ctx.lineTo(cardW/2, -cardH/2 + 12);
            ctx.lineTo(-cardW/2, -cardH/2 + 12);
            ctx.lineTo(-cardW/2, -cardH/2 + 25);
            ctx.arcTo(-cardW/2, -cardH/2, -cardW/2 + 25, -cardH/2, 25);
            ctx.closePath();
            ctx.fill();
            
            drawCrispText(ctx, card.title, 0, -cardH/2 + 80, 44, '#ffffff', 'center', '800');
            
            if (cardProgress > 0.1) {
              drawCrispText(ctx, card.value, 0, -10, 180, card.color, 'center', '900');
            }
            
            if (cardProgress > 0.3 && card.showPlatformSplit && card.fb !== undefined && card.app !== undefined) {
              const platformProgress = Math.min((cardProgress - 0.3) / 0.2, 1);
              ctx.globalAlpha = (anim.opacity || 1) * platformProgress;
              
              drawCrispText(ctx, 'Facebook', -220, 145, 38, '#cbd5e1', 'center', '700');
              drawCrispText(ctx, card.fb.toLocaleString(), -220, 200, 58, '#60a5fa', 'center', '900');
              
              ctx.strokeStyle = '#64748b';
              ctx.lineWidth = 3;
              ctx.beginPath();
              ctx.moveTo(0, 135);
              ctx.lineTo(0, 215);
              ctx.stroke();
              
              drawCrispText(ctx, 'App', 220, 145, 38, '#cbd5e1', 'center', '700');
              drawCrispText(ctx, card.app.toLocaleString(), 220, 200, 58, '#34d399', 'center', '900');
            }
            
            if (cardProgress > 0.5) {
              const detailProgress = Math.min((cardProgress - 0.5) / 0.15, 1);
              ctx.globalAlpha = (anim.opacity || 1) * detailProgress;
              drawCrispText(ctx, card.detail, 0, card.showPlatformSplit ? 250 : 160, 30, '#94a3b8', 'center', '600');
            }
            
            ctx.restore();
            return;
          }
          
          // MOTIVATION AFTER (8-12s) - 4 SECONDS
          const afterPhase = cardDisplayPhase - 4;
          const afterProgress = afterPhase / 4;
          const afterOpacity = afterProgress < 0.2 ? afterProgress / 0.2 : (afterProgress > 0.8 ? (1 - afterProgress) / 0.2 : 1);
          
          const particles = createParticles(50, cardPhase, card.gradient);
          particles.forEach(p => {
            ctx.globalAlpha = p.opacity * afterOpacity * 0.4;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(canvas.width / 2 + p.x, canvas.height / 2 + p.y, p.size * 1.2, 0, Math.PI * 2);
            ctx.fill();
          });
          
          ctx.globalAlpha = afterOpacity;
          
          drawCrispText(ctx, card.motivationAfter, canvas.width / 2, canvas.height / 2, 52, card.color, 'center', '800');
          
          for (let i = 0; i < 15; i++) {
            const angle = (i / 15) * Math.PI * 2 + afterProgress * Math.PI * 3;
            const radius = 350 + Math.sin(afterProgress * Math.PI * 2) * 50;
            const x = canvas.width / 2 + Math.cos(angle) * radius;
            const y = canvas.height / 2 + Math.sin(angle) * radius;
            const size = 4 + Math.sin(afterProgress * Math.PI * 5 + i) * 2;
            
            ctx.fillStyle = card.color;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
          }
          
          ctx.globalAlpha = 1;
          return;
        }
      }
      return;
    }

    // FINAL OVERVIEW (95-100s)
    const overviewStart = cardSequenceStart + (timePerCard * cards.length);
    if (currentStage >= overviewStart && currentStage < overviewStart + 5) {
      const overviewProgress = (currentStage - overviewStart) / 5;
      
      const particles = createParticles(50, currentStage, ['#60a5fa', '#34d399', '#c084fc', '#f87171']);
      particles.forEach(p => {
        ctx.globalAlpha = p.opacity * 0.4;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(canvas.width / 2 + p.x * 2, canvas.height / 2 + p.y * 2, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      
      ctx.globalAlpha = Math.min(overviewProgress * 2, 1);
      drawCrispText(ctx, stats.name || 'Teacher', canvas.width / 2, 100, 70, '#ffffff', 'center', '900');
      drawCrispText(ctx, 'Complete Performance Summary', canvas.width / 2, 160, 36, '#94a3b8', 'center', '700');
      
      const displayCards = cards;
      const cardW = 350;
      const cardH = 240;
      const gapX = 35;
      const gapY = 30;
      
      const row1Cards = displayCards.slice(0, 3);
      const row2Cards = displayCards.slice(3, 7);
      
      const row1Width = (cardW * 3 + gapX * 2);
      const row2Width = (cardW * 4 + gapX * 3);
      const startX1 = (canvas.width - row1Width) / 2;
      const startX2 = (canvas.width - row2Width) / 2;
      const startY = 220;
      
      // Row 1
      row1Cards.forEach((card, i) => {
        const itemDelay = i * 0.08;
        const itemProgress = Math.max(0, Math.min(1, (overviewProgress - itemDelay) * 5));
        
        if (itemProgress > 0) {
          const x = startX1 + i * (cardW + gapX);
          const y = startY;
          
          ctx.save();
          ctx.globalAlpha = itemProgress;
          
          const scale = 0.65 + itemProgress * 0.35;
          ctx.translate(x + cardW / 2, y + cardH / 2);
          ctx.scale(scale, scale);
          
          // Use Path2D for clean border
          const smallCardPath = new Path2D();
          smallCardPath.roundRect(-cardW/2, -cardH/2, cardW, cardH, 18);
          
          const gradient = ctx.createLinearGradient(-cardW/2, -cardH/2, -cardW/2, cardH/2);
          gradient.addColorStop(0, '#1e293b');
          gradient.addColorStop(1, '#0f172a');
          ctx.fillStyle = gradient;
          ctx.fill(smallCardPath);
          
          // CLEAN SINGLE EDGE
          ctx.strokeStyle = card.color;
          ctx.lineWidth = 3;
          ctx.stroke(smallCardPath);
          
          const accentGradient = ctx.createLinearGradient(-cardW/2, 0, cardW/2, 0);
          card.gradient.forEach((c, i) => accentGradient.addColorStop(i / (card.gradient.length - 1), c));
          ctx.fillStyle = accentGradient;
          ctx.fillRect(-cardW/2, -cardH/2, cardW, 8);
          
          // ICON ON THE SIDE
          ctx.font = '32px Arial';
          ctx.textAlign = 'right';
          ctx.fillText(card.icon, cardW/2 - 20, -cardH/2 + 50);
          
          drawCrispText(ctx, card.title, -cardW/2 + 20, -cardH/2 + 50, 20, '#ffffff', 'left', '700');
          drawCrispText(ctx, card.value, 0, -cardH/2 + 120, 64, card.color, 'center', '900');
          
          ctx.restore();
        }
      });
      
      // Row 2
      row2Cards.forEach((card, i) => {
        const itemDelay = (3 + i) * 0.08;
        const itemProgress = Math.max(0, Math.min(1, (overviewProgress - itemDelay) * 5));
        
        if (itemProgress > 0) {
          const x = startX2 + i * (cardW + gapX);
          const y = startY + cardH + gapY;
          
          ctx.save();
          ctx.globalAlpha = itemProgress;
          
          const scale = 0.65 + itemProgress * 0.35;
          ctx.translate(x + cardW / 2, y + cardH / 2);
          ctx.scale(scale, scale);
          
          // Use Path2D for clean border
          const smallCardPath = new Path2D();
          smallCardPath.roundRect(-cardW/2, -cardH/2, cardW, cardH, 18);
          
          const gradient = ctx.createLinearGradient(-cardW/2, -cardH/2, -cardW/2, cardH/2);
          gradient.addColorStop(0, '#1e293b');
          gradient.addColorStop(1, '#0f172a');
          ctx.fillStyle = gradient;
          ctx.fill(smallCardPath);
          
          // CLEAN SINGLE EDGE
          ctx.strokeStyle = card.color;
          ctx.lineWidth = 3;
          ctx.stroke(smallCardPath);
          
          const accentGradient = ctx.createLinearGradient(-cardW/2, 0, cardW/2, 0);
          card.gradient.forEach((c, i) => accentGradient.addColorStop(i / (card.gradient.length - 1), c));
          ctx.fillStyle = accentGradient;
          ctx.fillRect(-cardW/2, -cardH/2, cardW, 8);
          
          // ICON ON THE SIDE
          ctx.font = '32px Arial';
          ctx.textAlign = 'right';
          ctx.fillText(card.icon, cardW/2 - 20, -cardH/2 + 50);
          
          drawCrispText(ctx, card.title, -cardW/2 + 20, -cardH/2 + 50, 20, '#ffffff', 'left', '700');
          drawCrispText(ctx, card.value, 0, -cardH/2 + 120, 64, card.color, 'center', '900');
          
          ctx.restore();
        }
      });
      
      ctx.globalAlpha = 1;
      return;
    }

    // OUTRO (100-107s)
    const outroStart = overviewStart + 5;
    if (currentStage >= outroStart) {
      const outroProgress = (currentStage - outroStart) / 7;
      const outroOpacity = outroProgress < 0.25 ? outroProgress * 4 : (outroProgress > 0.8 ? (1 - outroProgress) / 0.2 : 1);
      
      for (let i = 0; i < 50; i++) {
        const angle = (i / 50) * Math.PI * 2 + outroProgress * Math.PI * 3;
        const distance = outroProgress * 600;
        const x = canvas.width / 2 + Math.cos(angle) * distance;
        const y = canvas.height / 2 + Math.sin(angle) * distance;
        const size = 10 - outroProgress * 7;
        
        const hue = (i / 50) * 360 + outroProgress * 180;
        ctx.fillStyle = `hsla(${hue}, 80%, 65%, ${outroOpacity * (1 - outroProgress * 0.3)})`;
        ctx.beginPath();
        ctx.arc(x, y, Math.max(size, 2), 0, Math.PI * 2);
        ctx.fill();
      }
      
      for (let i = 0; i < 40; i++) {
        const x = (canvas.width / 40) * i;
        const y = outroProgress * 400 + Math.sin(outroProgress * 10 + i) * 150;
        const rotation = outroProgress * 360 * (i % 2 === 0 ? 1 : -1);
        
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.fillStyle = `hsla(${i * 9}, 75%, 65%, ${outroOpacity})`;
        ctx.fillRect(-6, -12, 12, 24);
        ctx.restore();
      }
      
      ctx.globalAlpha = outroOpacity;
      
      drawCrispText(ctx, 'Outstanding Performance!', canvas.width / 2, canvas.height / 2 - 100, 95, '#60a5fa', 'center', '900');
      drawCrispText(ctx, 'Keep up the amazing work!', canvas.width / 2, canvas.height / 2, 54, '#34d399', 'center', '800');
      drawCrispText(ctx, 'You are making a real difference! ✨', canvas.width / 2, canvas.height / 2 + 85, 46, '#c084fc', 'center', '800');
      
      const trophyScale = 1 + Math.sin(outroProgress * Math.PI * 8) * 0.25;
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2 + 190);
      ctx.scale(trophyScale, trophyScale);
      ctx.font = '95px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('🏆', 0, 0);
      ctx.restore();
      
      ctx.globalAlpha = 1;
    }
  };

  const startAnimation = async () => {
    setStage(0);
    setRecordedBlob(null);
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { 
      alpha: false, 
      desynchronized: true, 
      willReadFrequently: false,
      antialias: true
    });
    if (!ctx) return;
    
    canvas.width = 1920;
    canvas.height = 1080;

    streamRef.current = canvas.captureStream(60);
    mediaRecorderRef.current = new MediaRecorder(streamRef.current, {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 16000000
    });

    chunksRef.current = [];
    mediaRecorderRef.current.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      setRecordedBlob(blob);
      setIsRecording(false);
    };

    mediaRecorderRef.current.start();
    setIsRecording(true);

    const duration = 107000; // CHANGED FROM 106000 TO 107000
    const startTime = performance.now();
    let lastFrameTime = startTime;

    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastFrameTime;
      
      // Skip frame if delta is too small (smoother at 60fps)
      if (deltaTime < 16) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }
      
      lastFrameTime = currentTime;
      
      const elapsed = currentTime - startTime;
      const progress = Math.min(Math.max(elapsed / duration, 0), 1);
      const currentStage = progress * 107; // CHANGED FROM 106 TO 107

      setStage(currentStage);
      drawFrame(ctx, canvas, currentStage);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setTimeout(() => {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
          }
        }, 500);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  };

  const downloadVideo = () => {
    if (recordedBlob) {
      const url = URL.createObjectURL(recordedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(stats.name || 'teacher').replace(/\s+/g, '-').toLowerCase()}-performance-recap-2025.webm`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const totalDuration = 107; // CHANGED FROM 106 TO 107
  const currentTime = Math.max(0, Math.floor(stage));
  const progress = Math.max(0, Math.min((currentTime / totalDuration) * 100, 100));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="text-2xl">🎬 Performance Recap 2025 - {stats.name || 'Teacher'}</span>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-3 justify-center flex-wrap">
            <Button onClick={startAnimation} disabled={isRecording} className="gap-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600" size="lg">
              <Play className="h-5 w-5" />
              {isRecording ? `Recording... (${currentTime}s / ${totalDuration}s)` : '🎬 Start Recording'}
            </Button>
            
            {recordedBlob && (
              <Button onClick={downloadVideo} className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600" size="lg">
                <Download className="h-5 w-5" />
                Download Video ({totalDuration}s - {(recordedBlob.size / 1024 / 1024).toFixed(1)}MB)
              </Button>
            )}
          </div>

          {isRecording && (
            <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-blue-500/20 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Recording Progress</span>
                <span className="text-sm font-mono">{currentTime}s / {totalDuration}s ({progress.toFixed(1)}%)</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 h-3 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          )}

          <div className="relative w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl overflow-hidden border-2 border-slate-700 shadow-2xl">
            <canvas ref={canvasRef} className="w-full h-auto" style={{ display: 'block' }} />
            {isRecording && (
              <div className="absolute bottom-6 right-6 bg-gradient-to-r from-red-600 to-pink-600 text-white px-6 py-3 rounded-full font-semibold flex items-center gap-3 shadow-lg">
                <div className="relative">
                  <div className="w-4 h-4 bg-white rounded-full animate-pulse" />
                  <div className="absolute inset-0 w-4 h-4 bg-white rounded-full animate-ping" />
                </div>
                <span>REC {currentTime}s / {totalDuration}s</span>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const RecapButton: React.FC<{ stats: TeacherStats; platformTotals: PlatformTotals }> = ({ stats, platformTotals }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!stats || !platformTotals) {
    return null;
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)} className="gap-2 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600" size="lg">
        <BarChart className="h-5 w-5" />
        🎬 Generate Performance Recap
      </Button>
      
      <TeacherRecapSlideshow stats={stats} platformTotals={platformTotals} isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export default TeacherRecapSlideshow;
