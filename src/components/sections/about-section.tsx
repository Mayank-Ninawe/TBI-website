
"use client";

import AnimatedCounter from '@/components/ui/animated-counter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UsersRound, TrendingUp, Rocket, Lightbulb, Goal } from 'lucide-react';
import { motion } from 'framer-motion';
import { AuroraText } from "@/components/magicui/aurora-text";

const stats = [
  { id: 1, value: 50, label: 'Startups Mentored', Icon: Rocket, suffix: '+' },
  { id: 2, value: 10, label: 'Funding Raised (Millions)', Icon: TrendingUp, prefix: '₹', suffix: 'M+' },
  { id: 3, value: 100, label: 'Mentors & Experts', Icon: UsersRound, suffix: '+' },
];

const missionVision = [
  {
    Icon: Lightbulb,
    title: "Our Vision",
    description: "To be the leading catalyst for groundbreaking innovation, fostering a global community where visionary ideas transform into impactful realities."
  },
  {
    Icon: Goal,
    title: "Our Mission",
    description: "To empower early-stage startups by providing exceptional mentorship, strategic resources, and a supportive ecosystem, enabling them to achieve sustainable growth and success."
  }
];

const sectionVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.2, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

export default function AboutSection() {
  return (
    <motion.section 
      id="about" 
      className="py-16 md:py-24 bg-background text-foreground"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      variants={sectionVariants}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">        <motion.div className="text-center mb-12 md:mb-16" variants={itemVariants}>
          <AuroraText>About RCEOM-TBI</AuroraText>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground sm:text-xl">
            We are dedicated to nurturing the brightest minds and innovative ideas, transforming them into successful ventures that shape the future.
          </p>
        </motion.div><motion.div 
          className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 md:mb-16"
          variants={staggerContainer(0.2)}
        >
          {missionVision.map((item) => (
            <motion.div key={item.title} variants={itemVariants} className="h-full">
              <Card className="h-full bg-card border-0 shadow-2xl hover:shadow-accent/30 transition-all duration-500 rounded-2xl backdrop-blur-sm bg-gradient-to-br from-card/80 to-card/60 hover:scale-105">
                <CardHeader className="flex flex-row items-center space-x-4 pb-4 pt-6 px-6">
                  <item.Icon className="h-10 w-10 text-foreground" /> {/* Icon color to white */}
                  <CardTitle className="font-montserrat text-2xl text-card-foreground">{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <p className="text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>        <motion.div 
          className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto"
           variants={staggerContainer(0.2, 0.4)} 
        >
          {stats.map((stat) => (
            <motion.div key={stat.id} variants={itemVariants}>
              <Card className="text-center bg-card border-0 shadow-2xl hover:shadow-accent/30 transition-all duration-500 p-6 rounded-2xl backdrop-blur-sm bg-gradient-to-br from-card/80 to-card/60 hover:scale-105">
                <CardContent className="flex flex-col items-center justify-center">
                  <stat.Icon className="h-12 w-12 mb-4 text-accent" /> {/* Stat icons use accent (purple) */}
                  <AnimatedCounter
                    targetValue={stat.value}
                    className="font-montserrat text-4xl font-bold text-foreground"
                    suffix={stat.suffix}
                    prefix={stat.prefix}
                  />
                  <p className="mt-2 text-lg text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
}

const staggerContainer = (staggerChildren = 0.1, delayChildren = 0) => ({
  hidden: { opacity: 0 }, 
  visible: {
    opacity: 1,
    transition: {
      staggerChildren,
      delayChildren,
    },
  },
});
