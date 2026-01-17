import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ArrowUpRight,
  ClipboardList,
  HeartPulse,
  Lightbulb,
  Users,
} from 'lucide-react';

const heroStats = [
  {
    label: 'Understanding Autism',
    value: '1 in 68',
    caption: 'children in India are on the autism spectrum—diverse, capable, and deserving of support',
  },
  {
    label: 'Spectrum Representation',
    value: 'Three Levels',
    caption: 'from minimal support to requiring extensive daily assistance—every journey matters',
  },
  {
    label: 'Positive Outcomes',
    value: '85%+',
    caption: 'show significant improvements with early, personalized intervention and family involvement',
  },
];

const therapyTracks = [
  {
    title: 'Level 1: Support for Social Communication',
    description:
      'Individuals who need minimal support—they can speak, learn, and function independently in most settings. They may struggle with social cues, transitions, and anxiety management.',
    icon: Users,
    focus: ['Social communication coaching', 'Anxiety and transition strategies', 'Self-advocacy and independence building'],
  },
  {
    title: 'Level 2: Moderate Support Needed',
    description:
      'Individuals who require more consistent support in daily routines, communication, and sensory regulation. They may have limited speech or difficulty with unexpected changes.',
    icon: HeartPulse,
    focus: ['Structured daily routines', 'Speech and communication support', 'Sensory regulation techniques'],
  },
  {
    title: 'Level 3: Substantial Support Required',
    description:
      'Individuals who need help with most daily living skills, communication, and self-care. Consistent, patient guidance and safe environments are essential.',
    icon: ClipboardList,
    focus: ['24/7 care coordination', 'Adaptive communication tools', 'Structured life skills training'],
  },
];

const approachPillars = [
  {
    title: 'Celebrate Every Strength',
    description:
      'Autism comes with unique gifts—attention to detail, deep focus, creative thinking, and extraordinary memory. We focus on building on these natural strengths.',
    points: ['Recognition of special interests and talents', 'Sensory preferences and strengths', 'Celebrate wins, big and small'],
  },
  {
    title: 'Support with Compassion',
    description:
      'Every autistic person learns differently. We personalize support to match their communication style, sensory needs, and pace—never forcing change.',
    points: ['Individualized communication approaches', 'Sensory-friendly environments', 'Respect for individual choices and pace'],
  },
  {
    title: 'Build Independence Together',
    description:
      'With family, therapists, and community working as one team, we help autistic individuals gain skills that matter to them—at their own rhythm.',
    points: ['Collaboration between families and therapists', 'Real-world skill building', 'Progress tracking with compassion'],
  },
];

const journeyMilestones = [
  {
    title: 'Understand the Spectrum',
    copy:
      "Autism is not one thing—it's a spectrum with three support levels. From independent learners to those needing 24/7 care, every autistic person deserves to be seen and supported.",
    meta: 'What is Autism Spectrum Disorder?',
  },
  {
    title: 'Create a Supportive Plan',
    copy:
      "ThrivePath helps families and therapists work together to build a personalized plan that respects the individual's pace, communication style, and unique strengths.",
    meta: 'With families & therapists | Personalized pathways',
  },
  {
    title: 'Celebrate Progress & Growth',
    copy:
      'Every milestone matters—from mastering a new skill to managing emotions better. We capture these wins and share them with everyone who cares, building confidence and connection.',
    meta: 'Real-time progress sharing | Evidence-based outcomes',
  },
];

const resourceHighlights = [
  {
    title: 'What is Autism Spectrum Disorder (ASD)?',
    description: 'ASD is a lifelong neurological difference that affects communication, social interaction, and sensory processing. It is not a disease or disorder to cure, but a natural variation of the human brain.',
    action: 'Learn more about autism',
  },
  {
    title: 'The Three Support Levels Explained',
    description: 'Level 1 needs minimal support with social interaction. Level 2 requires moderate support for daily routines. Level 3 needs substantial help with most daily activities. All deserve respect and inclusion.',
    action: 'Explore support levels',
  },
  {
    title: 'How ThrivePath Helps',
    description: 'We connect families, therapists, and schools in one caring space—tracking progress, celebrating strengths, and ensuring every autistic person gets the personalized support they deserve.',
    action: 'See how it works',
  },
];

export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const handleNavigateToLogin = () => {
    navigate('/login');
  };

  const handleNavigateToSignup = () => {
    navigate('/register');
  };

  return (
    <div className="min-h-screen bg-[#f5f6f8] text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href="#" className="text-lg font-semibold tracking-tight text-slate-900">
            ThrivePath
          </a>
          <nav className="hidden gap-8 text-sm font-medium text-slate-600 md:flex">
            <a href="#programs" className="transition hover:text-slate-900">
              Therapy programs
            </a>
            <a href="#approach" className="transition hover:text-slate-900">
              Our approach
            </a>
            <a href="#journey" className="transition hover:text-slate-900">
              Care journey
            </a>
            <a href="#resources" className="transition hover:text-slate-900">
              Resources
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <button
              onClick={handleNavigateToLogin}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
            >
              Log in
            </button>
            <button
              onClick={handleNavigateToSignup}
              className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Book a walkthrough
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-6 pb-20 pt-16 lg:pt-24">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-600">
                <Lightbulb className="h-4 w-4" />
                Autism Awareness & Support
              </div>
              <h1 className="mt-6 max-w-xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                Understanding Autism, Celebrating Every Person on the Spectrum
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
                Autism Spectrum Disorder affects how people communicate, process sensory information, and interact socially. Every autistic person is unique—with distinct strengths, challenges, and ways of experiencing the world. ThrivePath is here to celebrate those differences while providing personalized support.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <button
                  onClick={handleNavigateToSignup}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-slate-700"
                >
                  Join Our Community
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={handleNavigateToLogin}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-slate-800 transition hover:border-slate-900 hover:text-slate-900"
                >
                  Explore ThrivePath
                  <ArrowUpRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-600">Support-Based Care</span>
                  <HeartPulse className="h-5 w-5 text-slate-900" />
                </div>
                <p className="mt-4 text-sm leading-relaxed text-slate-600">
                  We recognize all three support levels—from minimal guidance to 24/7 assistance. Every autistic individual deserves care tailored to their needs.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-600">Strength-Based Approach</span>
                  <Lightbulb className="h-5 w-5 text-slate-900" />
                </div>
                <p className="mt-4 text-sm leading-relaxed text-slate-600">
                  Autistic people have unique talents—special interests, deep focus, and creative thinking. We build on these natural strengths.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-16 grid gap-4 sm:grid-cols-3">
            {heroStats.map((stat) => (
              <motion.div
                key={stat.label}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                whileHover={{ translateY: -4 }}
                transition={{ duration: 0.3 }}
              >
                <span className="text-3xl font-semibold text-slate-950">{stat.value}</span>
                <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-slate-500">{stat.label}</p>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{stat.caption}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section id="programs" className="border-t border-slate-200 bg-white py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-12 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">Autism Spectrum Levels</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                  Understanding the Three Support Levels
                </h2>
              </div>
              <button className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition hover:text-slate-950">
                Learn more
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {therapyTracks.map((track) => {
                const Icon = track.icon;
                return (
                  <motion.article
                    key={track.title}
                    className="group flex h-full flex-col gap-5 rounded-3xl border border-slate-200 bg-slate-50/60 p-6 shadow-sm transition hover:border-slate-900"
                    whileHover={{ translateY: -8 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white">
                        <Icon className="h-5 w-5 text-slate-900" />
                      </div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Level</span>
                    </div>
                    <h3 className="text-xl font-semibold text-slate-950">{track.title}</h3>
                    <p className="text-sm leading-relaxed text-slate-600">{track.description}</p>
                    <ul className="flex flex-col gap-3 text-sm text-slate-700">
                      {track.focus.map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-800" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="approach" className="bg-[#f5f6f8] py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">Our approach</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                Celebrating diversity while providing compassionate, personalized support
              </h2>
            </div>
            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              {approachPillars.map((pillar) => (
                <motion.div
                  key={pillar.title}
                  className="flex h-full flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                  whileHover={{ translateY: -8 }}
                  transition={{ duration: 0.3 }}
                >
                  <h3 className="text-xl font-semibold text-slate-950">{pillar.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-600">{pillar.description}</p>
                  <ul className="mt-2 flex flex-col gap-3 text-sm text-slate-700">
                    {pillar.points.map((point) => (
                      <li key={point} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-900" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section id="journey" className="border-y border-slate-200 bg-white py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-xl">
                <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">The journey</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                  ThrivePath: Your Partner in Autism Support
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-slate-600">
                  From understanding the spectrum to celebrating milestones, ThrivePath connects families, therapists, and schools to provide integrated, compassionate care.
                </p>
              </div>
              <div className="flex-1">
                <div className="relative pl-8">
                  <div className="absolute left-2 top-2 bottom-2 w-px bg-slate-200" />
                  <div className="space-y-10">
                    {journeyMilestones.map((step, index) => (
                      <motion.div
                        key={step.title}
                        className="relative rounded-3xl border border-slate-200 bg-slate-50/80 p-6 shadow-sm"
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <span className="absolute -left-[34px] top-6 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-600">
                          {index + 1}
                        </span>
                        <h3 className="text-xl font-semibold text-slate-950">{step.title}</h3>
                        <p className="mt-3 text-sm leading-relaxed text-slate-600">{step.copy}</p>
                        <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">{step.meta}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="resources" className="border-t border-slate-200 bg-white py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">Learn more</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                  Understanding Autism & How We Support It
                </h2>
              </div>
              <button className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition hover:text-slate-950">
                Browse all resources
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {resourceHighlights.map((resource) => (
                <motion.article
                  key={resource.title}
                  className="flex h-full flex-col justify-between gap-6 rounded-3xl border border-slate-200 bg-slate-50/60 p-6 shadow-sm transition hover:border-slate-900"
                  whileHover={{ translateY: -8 }}
                  transition={{ duration: 0.3 }}
                >
                  <div>
                    <h3 className="text-xl font-semibold text-slate-950">{resource.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-slate-600">{resource.description}</p>
                  </div>
                  <button className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800 transition hover:text-slate-950">
                    {resource.action}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#f5f6f8] py-20">
          <div className="mx-auto max-w-5xl rounded-[32px] border border-slate-200 bg-white px-8 py-10 text-center shadow-xl">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Ready to support autistic individuals and their families?
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-sm leading-relaxed text-slate-600">
              Join ThrivePath to connect with therapists, track progress, celebrate milestones, and build inclusive communities that truly understand and support autism.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button
                onClick={handleNavigateToSignup}
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-slate-700"
              >
                Get started today
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={handleNavigateToLogin}
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-slate-800 transition hover:border-slate-900 hover:text-slate-900"
              >
                Sign in
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <p className="font-semibold text-slate-700">© {new Date().getFullYear()} ThrivePath. Supporting autism awareness and care worldwide.</p>
          <div className="flex flex-wrap gap-4">
            <a href="#" className="hover:text-slate-700">
              Privacy
            </a>
            <a href="#" className="hover:text-slate-700">
              Terms
            </a>
            <a href="#" className="hover:text-slate-700">
              Autism Resources
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
