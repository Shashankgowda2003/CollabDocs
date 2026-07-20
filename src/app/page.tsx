"use client";

import { motion } from "framer-motion";
import Link from "next/link";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fadeUp: any = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  }),
};

const features = [
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
      </svg>
    ),
    title: "Real-Time Collaboration",
    desc: "Edit together with live cursors, instant sync via CRDT, and presence awareness.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
    title: "Block-Based Editor",
    desc: "Headings, code, quotes, callouts — every element is a reorderable, nestable block.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
      </svg>
    ),
    title: "AI-Powered",
    desc: "Summarize, rewrite, generate, and answer questions about your documents with AI.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Version History",
    desc: "Every edit tracked. Restore any previous snapshot with full document diffs.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
      </svg>
    ),
    title: "Offline Ready",
    desc: "Keep editing when disconnected. Changes sync automatically on reconnect.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    title: "Permissions & Sharing",
    desc: "Cascading role inheritance with overrides. Share via links or invitations.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 text-white overflow-hidden">
      {/* Nav */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto"
      >
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-blue-500/25">
            C
          </div>
          <span className="font-bold text-lg tracking-tight">CollabDocs</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-zinc-300 hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-100 transition-all shadow-lg shadow-white/10"
          >
            Get Started
          </Link>
        </div>
      </motion.nav>

      {/* Hero */}
      <section className="relative px-6 pt-20 pb-32 max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-zinc-700 bg-zinc-800/50 text-xs font-medium text-zinc-300 mb-6">
            <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            Now with AI-powered editing
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="text-5xl sm:text-6xl font-bold tracking-tight leading-[1.1]"
        >
          Documents that
          <br />
          <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            move at the speed of thought
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-6 text-lg text-zinc-400 max-w-xl mx-auto leading-relaxed"
        >
          A modern collaborative editor combining block-based editing,
          real-time sync, AI assistance, and team workspaces — all in one place.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href="/register"
            className="group relative inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-3.5 text-sm font-semibold text-white shadow-xl shadow-purple-500/25 hover:shadow-purple-500/40 transition-all"
          >
            Start building free
            <motion.svg
              className="h-4 w-4"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              animate={{ x: [0, 4, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </motion.svg>
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-zinc-700 px-8 py-3.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800/50 hover:border-zinc-600 transition-all"
          >
            Sign in
          </Link>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="relative px-6 pb-32 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-bold tracking-tight">
            Everything you need
          </h2>
          <p className="mt-3 text-zinc-400">
            Built for teams that ship together
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={fadeUp}
              whileHover={{ scale: 1.02, y: -2 }}
              className="group relative rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 hover:border-zinc-700 hover:bg-zinc-900/80 transition-all duration-300"
            >
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-700 flex items-center justify-center text-zinc-300 group-hover:from-blue-500/20 group-hover:to-purple-500/20 group-hover:text-blue-400 transition-all duration-500">
                {f.icon}
              </div>
              <h3 className="mt-4 text-sm font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative px-6 pb-32 max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-12"
        >
          <h2 className="text-3xl font-bold">Ready to build together?</h2>
          <p className="mt-3 text-zinc-400 max-w-md mx-auto">
            Join thousands of teams already collaborating on CollabDocs.
          </p>
          <Link
            href="/register"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-100 transition-all shadow-xl"
          >
            Create free account
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 px-6 py-8 text-center">
        <p className="text-xs text-zinc-500">
          &copy; {new Date().getFullYear()} CollabDocs. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
