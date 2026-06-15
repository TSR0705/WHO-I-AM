"use client";

import { ArrowRight } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Marquee } from "@/components/ui/marquee";

const teamAvatars = [
  {
    initials: "JD",
    src: "https://res.cloudinary.com/doonkheo8/image/upload/v1770279333/a1.jpg",
  },
  {
    initials: "HJ",
    src: "https://res.cloudinary.com/doonkheo8/image/upload/v1770279333/a2.jpg",
  },
  {
    initials: "PI",
    src: "https://res.cloudinary.com/doonkheo8/image/upload/v1770279333/a3.jpg",
  },
  {
    initials: "KD",
    src: "https://res.cloudinary.com/doonkheo8/image/upload/v1770279333/a4.jpg",
  },
  {
    initials: "LD",
    src: "https://res.cloudinary.com/doonkheo8/image/upload/v1770279333/a5.jpg",
  },
];

const stats = [
  { emoji: "🔍", label: "PUBLIC SOURCES CHECKED", value: "500+" },
  { emoji: "🛡️", label: "EXPOSURE CATEGORIES ANALYZED", value: "12+" },
  { emoji: "⚡", label: "AVERAGE SCAN TIME", value: "< 2s" },
  { emoji: "📊", label: "DIGITAL FOOTPRINT INSIGHTS", value: "1,000+" },
];

function AvatarStack() {
  return (
    <div className="flex -space-x-3">
      {teamAvatars.map((member, i) => (
        <Avatar
          className="size-13 border-2 border-primary bg-neutral-800"
          key={member.initials}
          style={{ zIndex: teamAvatars.length - i }}
        >
          <AvatarImage alt={`Team member ${i + 1}`} src={member.src} />
          <AvatarFallback className="bg-neutral-700 text-white text-xs">
            {member.initials}
          </AvatarFallback>
        </Avatar>
      ))}
    </div>
  );
}

function StatsMarquee() {
  return (
    <Marquee
      className="border-white/10 border-y bg-black/30 py-2 backdrop-blur-sm [--duration:30s] [--gap:2rem]"
      pauseOnHover
      repeat={4}
    >
      {stats.map((stat) => (
        <div
          className="flex items-center gap-3 whitespace-nowrap"
          key={stat.label}
        >
          <span className="font-bold font-mono text-primary text-sm tracking-wide">
            {stat.value}
          </span>
          <span className="font-medium font-mono text-sm text-white/70 uppercase tracking-[0.15em]">
            {stat.label}
          </span>
          <span className="text-base">{stat.emoji}</span>
        </div>
      ))}
    </Marquee>
  );
}

export default function Hero() {
  return (
    <section className="relative flex h-screen w-full flex-col items-start justify-end">
      {/* Header / Navigation */}
      <header className="absolute top-0 left-0 w-full z-20 flex items-center justify-between px-4 py-6 sm:px-8 lg:px-16 bg-gradient-to-b from-black/80 to-transparent">
        <div className="text-xl font-black tracking-widest text-white font-mono flex items-center gap-1">
          EXP◉SUR
        </div>
        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold font-mono text-zinc-300 uppercase tracking-wider">
          <a href="#features" className="hover:text-primary transition">Features</a>
          <a href="#how-it-works" className="hover:text-primary transition">How It Works</a>
          <a href="#privacy-report" className="hover:text-primary transition">Privacy Report</a>
          <a href="#faqs" className="hover:text-primary transition">FAQs</a>
        </nav>
        <div>
          <a href="/dashboard">
            <Button className="rounded-none py-2 px-5 font-bold text-black text-xs uppercase tracking-wider cursor-pointer">
              Analyze Me
            </Button>
          </a>
        </div>
      </header>

      <div
        className="absolute inset-0 bg-center bg-cover"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1541746972996-4e0b0f43e02a)",
        }}
      >
        <div className="absolute inset-0 bg-black/40" />
      </div>

      <div className="relative z-10 w-full max-w-4xl px-4 text-white sm:px-8 lg:px-16">
        <div className="space-y-4">
          <AvatarStack />
          <StatsMarquee />
        </div>
      </div>
      <div className="relative z-10 w-full px-4 pb-16 sm:px-8 sm:pb-24 lg:px-16 lg:pb-32">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
          <div className="w-full space-y-4 sm:w-1/2">
            <h1 className="font-medium text-4xl text-white leading-[1.05] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Discover What <br />
              You're <span className="text-primary">Exposing</span> Online.
            </h1>
            <div className="flex flex-wrap gap-4 items-center">
              <a href="/dashboard">
                <Button className="rounded-none py-3 px-6 font-bold text-black text-lg cursor-pointer flex items-center gap-2">
                  Check My Exposur
                  <ArrowRight className="w-5 h-5 inline-block" />
                </Button>
              </a>
              <a href="#how-it-works">
                <button className="rounded-none border border-white/20 hover:border-primary hover:text-primary transition py-3 px-6 font-bold text-white text-lg bg-transparent cursor-pointer">
                  Learn How It Works
                </button>
              </a>
            </div>
          </div>
          <div className="w-full sm:w-1/2">
            <p className="text-base text-primary italic sm:text-right md:text-2xl">
              Analyze your public digital footprint and uncover exposed emails, usernames, social profiles, metadata trails, and privacy risks before someone else does.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
