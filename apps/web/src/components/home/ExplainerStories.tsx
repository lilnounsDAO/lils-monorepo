import { useCallback, useEffect, useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { twMerge } from "tailwind-merge";

interface Story {
  title: string;
  src: string;
  poster: string;
}

const STORIES: Story[] = [
  "What Is Lil Nouns?",
  "Why Join The DAO?",
  "How Does Lil Nouns Work?",
  "Start A Project With The Lils",
  "Join The Community",
].map((title, i) => ({
  title,
  src: `/videos/explainer/lil-explainer-${i + 1}.mp4`,
  poster: `/videos/explainer/lil-explainer-${i + 1}.jpg`,
}));

function useIsMobile() {
  const query = "(max-width: 767px)";
  const [mobile, setMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches,
  );
  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMobile(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return mobile;
}

function prefersReducedMotion() {
  return (
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
  );
}

/** Smooth 0..1 progress for the playing video (timeupdate alone is too choppy). */
function useVideoProgress(
  videoRef: React.RefObject<HTMLVideoElement>,
  key: number,
) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    setProgress(0);
    let frame = 0;
    const tick = () => {
      const video = videoRef.current;
      if (video?.duration) setProgress(video.currentTime / video.duration);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [videoRef, key]);
  return progress;
}

function ProgressBars({
  index,
  progress,
}: {
  index: number;
  progress: number;
}) {
  return (
    <div className="flex w-full gap-1">
      {STORIES.map((story, i) => (
        <div
          key={i}
          className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/35"
        >
          <div
            className="h-full rounded-full bg-white"
            style={{
              width: `${(i < index ? 1 : i > index ? 0 : progress) * 100}%`,
            }}
          />
        </div>
      ))}
    </div>
  );
}

const BLUR_STEPS = [0.5, 1, 1.5];
const EDGE_MASK =
  "linear-gradient(to right, transparent, black 6%, black 94%, transparent)";

/**
 * Progressive blur + fade over one edge of the track: stacked backdrop blurs,
 * each masked to a narrower band toward the outside, under a colour fade.
 */
function EdgeFade({
  side,
  tone,
}: {
  side: "left" | "right";
  tone: "light" | "dark";
}) {
  const toward = side === "left" ? "to left" : "to right";
  return (
    <div
      aria-hidden
      className={twMerge(
        "pointer-events-none absolute inset-y-0 z-[2] w-[calc((100%-var(--card))*0.3)]",
        side === "left" ? "left-0" : "right-0",
      )}
    >
      {BLUR_STEPS.map((blur, i) => {
        const start = i * 25;
        const mask = `linear-gradient(${toward}, transparent ${start}%, black ${start + 40}%)`;
        return (
          <div
            key={blur}
            className="absolute inset-0"
            style={{
              backdropFilter: `blur(${blur}px)`,
              WebkitBackdropFilter: `blur(${blur}px)`,
              maskImage: mask,
              WebkitMaskImage: mask,
            }}
          />
        );
      })}
      <div
        className={twMerge(
          "absolute inset-0",
          side === "left" ? "bg-gradient-to-l" : "bg-gradient-to-r",
          // Dark tone sits over the ambient glow, so it fades via a mask on
          // the track instead of painting a colour.
          tone === "light"
            ? "from-transparent to-background-primary"
            : "hidden",
        )}
      />
    </div>
  );
}

/**
 * Looping carousel: the active card is centred and its neighbours peek in on
 * both sides, wrapping around (video 5 sits to the left of video 1).
 * `children` renders the active card's content.
 */
function StoryTrack({
  index,
  onSelect,
  tone,
  className,
  children,
}: {
  index: number;
  /** Enables stepping: side cards, arrow buttons and drag/swipe. */
  onSelect?: (index: number) => void;
  tone: "light" | "dark";
  className?: string;
  children: React.ReactNode;
}) {
  const count = STORIES.length;
  const wrap = (i: number) => (i + count) % count;
  const [dragX, setDragX] = useState(0);
  const dragStart = useRef<number | null>(null);
  const dragged = useRef(false);

  const dragHandlers = onSelect && {
    onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => {
      dragStart.current = event.clientX;
      dragged.current = false;
    },
    onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => {
      if (dragStart.current === null) return;
      const dx = event.clientX - dragStart.current;
      if (!dragged.current && Math.abs(dx) > 6) {
        dragged.current = true;
        event.currentTarget.setPointerCapture(event.pointerId);
      }
      if (dragged.current) setDragX(dx);
    },
    onPointerUp: () => {
      if (dragStart.current === null) return;
      if (Math.abs(dragX) > 60) onSelect(wrap(index + (dragX < 0 ? 1 : -1)));
      dragStart.current = null;
      setDragX(0);
    },
    onPointerCancel: () => {
      dragStart.current = null;
      setDragX(0);
    },
    // A drag shouldn't also count as a tap on whatever it ended over.
    onClickCapture: (event: React.MouseEvent) => {
      if (!dragged.current) return;
      dragged.current = false;
      event.stopPropagation();
      event.preventDefault();
    },
  };
  const dragging = dragX !== 0;

  // overflow-clip (not hidden) so focus can't scroll the track off-centre.
  return (
    <div
      className={twMerge(
        "relative w-full select-none overflow-clip [--card:70%] [--gap:0.75rem]",
        onSelect && "cursor-grab touch-pan-y active:cursor-grabbing",
        className,
      )}
      style={
        tone === "dark"
          ? {
              maskImage: EDGE_MASK,
              WebkitMaskImage: EDGE_MASK,
            }
          : undefined
      }
      {...dragHandlers}
    >
      {/* Sizer: gives the track the active card's height. */}
      <div className="invisible mx-auto aspect-video w-[var(--card)]" />
      {STORIES.map((story, i) => {
        const offset = ((i - index + count + 2) % count) - 2; // -2..2
        const active = offset === 0;
        const visible = Math.abs(offset) <= 1;
        return (
          <div
            key={story.src}
            data-story-target={visible || undefined}
            className={twMerge(
              "absolute left-[calc((100%-var(--card))/2)] top-0 aspect-video w-[var(--card)] overflow-hidden rounded-xl bg-black",
              // Cards wrapping round the far side jump while invisible.
              visible
                ? "transition-[transform,opacity] duration-500 ease-out"
                : "pointer-events-none opacity-0 transition-opacity duration-300",
              dragging && "transition-none",
              !active &&
                visible &&
                (tone === "dark" ? "opacity-90" : "opacity-70"),
            )}
            style={{
              transform: `translateX(calc(${offset} * (100% + var(--gap)) + ${dragX}px)) scale(${active ? 1 : 0.9})`,
            }}
            onClick={!active && onSelect ? () => onSelect(i) : undefined}
            aria-hidden={!active}
          >
            {active ? (
              children
            ) : (
              <>
                <img
                  src={story.poster}
                  alt=""
                  draggable={false}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                <span className="absolute left-3 right-3 top-3 truncate text-left text-xs font-bold text-white drop-shadow">
                  {story.title}
                </span>
              </>
            )}
          </div>
        );
      })}
      <EdgeFade side="left" tone={tone} />
      <EdgeFade side="right" tone={tone} />
      {onSelect &&
        (["left", "right"] as const).map((side) => (
          <button
            key={side}
            type="button"
            onClick={() => onSelect(wrap(index + (side === "left" ? -1 : 1)))}
            aria-label={side === "left" ? "Previous video" : "Next video"}
            className={twMerge(
              "absolute top-1/2 z-[3] flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-gray-900 shadow-lg transition-transform hover:scale-110",
              side === "left"
                ? "left-[calc((100%-var(--card))/4)] -translate-x-1/2"
                : "right-[calc((100%-var(--card))/4)] translate-x-1/2",
            )}
          >
            {side === "left" ? (
              <ChevronLeft size={20} />
            ) : (
              <ChevronRight size={20} />
            )}
          </button>
        ))}
    </div>
  );
}

// Sits at the top so it never covers the subtitles burned into the videos.
function StoryCaption({
  index,
  progress,
  children,
}: {
  index: number;
  progress?: number;
  children?: React.ReactNode;
}) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col gap-2 bg-gradient-to-b from-black/70 to-transparent p-3 pb-10 text-left text-white">
      {progress !== undefined && (
        <ProgressBars index={index} progress={progress} />
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-medium text-white/70">
            {index + 1} of {STORIES.length}
          </div>
          <div className="truncate label-md">{STORIES[index]?.title}</div>
        </div>
        {children}
      </div>
    </div>
  );
}

const COLLABORATORS = [
  { handle: "Drewfromweb3", avatar: "/videos/explainer/drewfromweb3.jpg" },
  { handle: "lilnounsdao", avatar: "/videos/explainer/lilnounsdao.png" },
];

// IG-style collab byline: overlapping avatars, then "@a x @b".
function StoryAuthor({ subtitle }: { subtitle: string }) {
  const [first, second] = COLLABORATORS;
  return (
    <div className="flex min-w-0 items-center gap-2.5 text-white">
      <div className="relative h-8 w-12 shrink-0">
        {COLLABORATORS.map((person, i) => (
          <img
            key={person.handle}
            src={person.avatar}
            alt=""
            draggable={false}
            className={twMerge(
              "absolute top-0 h-8 w-8 rounded-full object-cover ring-2 ring-black",
              i === 0 ? "left-0" : "left-4",
            )}
          />
        ))}
      </div>
      <div className="min-w-0 leading-tight">
        <div className="truncate text-sm font-bold">
          {[first, second].map((person, i) => (
            <span key={person!.handle}>
              {i > 0 && <span className="font-normal text-white/70"> x </span>}
              <a
                href={`https://x.com/${person!.handle}`}
                target="_blank"
                rel="noopener noreferrer"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => event.stopPropagation()}
                className="hover:underline"
              >
                @{person!.handle}
              </a>
            </span>
          ))}
        </div>
        <div className="truncate text-[11px] text-white/70">{subtitle}</div>
      </div>
    </div>
  );
}

function StoryViewer({
  open,
  startIndex,
  startTime,
  onClose,
}: {
  open: boolean;
  startIndex: number;
  startTime: number;
  onClose: (index: number) => void;
}) {
  const [index, setIndex] = useState(startIndex);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const resumeAt = useRef(startTime);
  const progress = useVideoProgress(videoRef, index);

  useEffect(() => {
    if (!open) return;
    setIndex(startIndex);
    setPaused(false);
    resumeAt.current = startTime;
  }, [open, startIndex, startTime]);

  const go = useCallback((next: number) => {
    resumeAt.current = 0;
    setPaused(false);
    setIndex((next + STORIES.length) % STORIES.length);
  }, []);

  // Start each story once its element is ready (the dialog mounts it after
  // `open` flips); fall back to muted if the browser blocks sound.
  const startStory = (video: HTMLVideoElement) => {
    video.currentTime = resumeAt.current;
    video.play().catch(() => {
      setMuted(true);
      video.muted = true;
      video.play().catch(() => setPaused(true));
    });
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (paused) video.pause();
    else video.play().catch(() => undefined);
  }, [paused]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") go(index + 1);
      else if (event.key === "ArrowLeft") go(index - 1);
      else if (event.key === " ") {
        event.preventDefault();
        setPaused((value) => !value);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, index, go]);

  const mobile = useIsMobile();
  const [dragY, setDragY] = useState(0);
  const gesture = useRef<{
    x: number;
    y: number;
    held: boolean;
    timer: number;
  } | null>(null);

  // IG-style gestures: tap left third = back, elsewhere = next; hold to
  // pause; swipe sideways to step; swipe down to close.
  const mobileGestures = {
    onPointerDown: (event: React.PointerEvent) => {
      const state = {
        x: event.clientX,
        y: event.clientY,
        held: false,
        timer: 0,
      };
      state.timer = window.setTimeout(() => {
        state.held = true;
        setPaused(true);
      }, 220);
      gesture.current = state;
    },
    onPointerMove: (event: React.PointerEvent) => {
      const state = gesture.current;
      if (!state) return;
      const dx = event.clientX - state.x;
      const dy = event.clientY - state.y;
      if (Math.abs(dx) > 10 || Math.abs(dy) > 10)
        window.clearTimeout(state.timer);
      if (!state.held && dy > 0 && dy > Math.abs(dx)) setDragY(dy);
    },
    onPointerUp: (event: React.PointerEvent) => {
      const state = gesture.current;
      gesture.current = null;
      setDragY(0);
      if (!state) return;
      window.clearTimeout(state.timer);
      const dx = event.clientX - state.x;
      const dy = event.clientY - state.y;
      if (state.held) setPaused(false);
      else if (dy > 100 && dy > Math.abs(dx)) onClose(index);
      else if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1));
      else if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
        if (event.clientX > window.innerWidth / 3) go(index + 1);
        else if (index === 0 && videoRef.current)
          videoRef.current.currentTime = 0;
        else go(index - 1);
      }
    },
    onPointerCancel: () => {
      if (gesture.current) window.clearTimeout(gesture.current.timer);
      gesture.current = null;
      setDragY(0);
    },
  };

  const videoElement = (className: string) => (
    <video
      key={STORIES[index]?.src}
      ref={videoRef}
      src={STORIES[index]?.src}
      poster={STORIES[index]?.poster}
      muted={muted}
      playsInline
      preload="auto"
      draggable={false}
      onLoadedMetadata={(event) => startStory(event.currentTarget)}
      onEnded={() =>
        index === STORIES.length - 1 ? onClose(0) : go(index + 1)
      }
      className={className}
    />
  );

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(value) => !value && onClose(index)}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[300] bg-black data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed inset-0 z-[301] flex flex-col items-center justify-center gap-4 outline-none"
          aria-describedby={undefined}
          onOpenAutoFocus={(event) => event.preventDefault()}
          // Content fills the screen, so treat clicks on empty space as "outside".
          onClick={(event) => {
            const target = event.target as HTMLElement;
            if (!target.closest("[data-story-target], button, a"))
              onClose(index);
          }}
        >
          <DialogPrimitive.Title className="sr-only">
            Lil Nouns explainer series
          </DialogPrimitive.Title>

          {mobile ? (
            // Phone: full-screen story, IG style. The landscape video sits
            // centred over a blurred copy of its poster.
            <div
              data-story-target
              className="relative h-full w-full touch-none select-none overflow-hidden bg-black transition-transform duration-200"
              style={{
                transform: dragY
                  ? `translateY(${dragY}px) scale(${1 - Math.min(dragY, 300) / 1500})`
                  : undefined,
              }}
              {...mobileGestures}
            >
              <img
                src={STORIES[index]?.poster}
                alt=""
                aria-hidden
                draggable={false}
                className="absolute inset-0 h-full w-full scale-125 object-cover opacity-50 blur-2xl"
              />
              <div
                key={index}
                className="absolute inset-0 flex items-center duration-300 animate-in fade-in-0"
              >
                {videoElement("aspect-video w-full object-contain")}
              </div>

              <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/70 to-transparent px-3 pb-12 pt-[max(0.75rem,env(safe-area-inset-top))]">
                <ProgressBars index={index} progress={progress} />
                <div className="mt-3 flex items-center gap-2.5 text-white">
                  <div className="min-w-0 flex-1">
                    <StoryAuthor
                      subtitle={`${STORIES[index]?.title} · ${index + 1} of ${STORIES.length}`}
                    />
                  </div>
                  <button
                    type="button"
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={() => setMuted((value) => !value)}
                    className="rounded-full p-2"
                    aria-label={muted ? "Unmute" : "Mute"}
                  >
                    {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                  </button>
                  <DialogPrimitive.Close
                    onPointerDown={(event) => event.stopPropagation()}
                    className="rounded-full p-2"
                    aria-label="Close"
                  >
                    <X size={22} />
                  </DialogPrimitive.Close>
                </div>
              </div>

              {paused && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <span className="flex h-16 w-16 items-center justify-center rounded-full bg-black/40 text-white">
                    <Play size={28} className="ml-1 fill-current" />
                  </span>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Ambient glow: the current poster, blurred, fills the screen. */}
              <img
                key={STORIES[index]?.poster}
                src={STORIES[index]?.poster}
                alt=""
                aria-hidden
                draggable={false}
                className="pointer-events-none fixed inset-0 -z-[1] h-full w-full scale-110 object-cover opacity-40 blur-3xl duration-700 animate-in fade-in-0"
              />
              <div className="flex w-full max-w-[1000px] items-center gap-3 px-4 md:px-8">
                <div className="flex-1" data-story-target>
                  <ProgressBars index={index} progress={progress} />
                </div>
                <button
                  type="button"
                  onClick={() => setPaused((value) => !value)}
                  className="rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white"
                  aria-label={paused ? "Play" : "Pause"}
                >
                  {paused ? <Play size={18} /> : <Pause size={18} />}
                </button>
                <button
                  type="button"
                  onClick={() => setMuted((value) => !value)}
                  className="rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white"
                  aria-label={muted ? "Unmute" : "Mute"}
                >
                  {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                <DialogPrimitive.Close
                  className="rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white"
                  aria-label="Close"
                >
                  <X size={20} />
                </DialogPrimitive.Close>
              </div>

              <StoryTrack
                index={index}
                onSelect={go}
                tone="dark"
                className="max-w-[1000px]"
              >
                {videoElement("h-full w-full object-cover")}
                {/* Tap left/right thirds to step, middle to pause. */}
                <button
                  type="button"
                  tabIndex={-1}
                  aria-hidden
                  className="absolute inset-y-0 left-0 w-1/3"
                  onClick={() => go(index - 1)}
                />
                <button
                  type="button"
                  aria-label={paused ? "Play" : "Pause"}
                  className="absolute inset-y-0 left-1/3 w-1/3"
                  onClick={() => setPaused((value) => !value)}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  aria-hidden
                  className="absolute inset-y-0 right-0 w-1/3"
                  onClick={() => go(index + 1)}
                />
                <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col gap-2 bg-gradient-to-b from-black/70 to-transparent p-4 pb-12 text-left">
                  <div className="pointer-events-auto w-fit">
                    <StoryAuthor
                      subtitle={`${index + 1} of ${STORIES.length}`}
                    />
                  </div>
                  <div className="truncate text-xl font-bold text-white">
                    {STORIES[index]?.title}
                  </div>
                </div>
              </StoryTrack>
            </>
          )}

          {/* Warm the next video so auto-advance starts instantly. */}
          {STORIES[index + 1] && (
            <link rel="prefetch" href={STORIES[index + 1]!.src} as="video" />
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/** Home page rail: muted autoplay preview that advances on its own; click to watch with sound. */
export default function ExplainerStories() {
  const [index, setIndex] = useState(0);
  const [viewer, setViewer] = useState<{ index: number; time: number } | null>(
    null,
  );
  const [inView, setInView] = useState(false);
  const [muted, setMuted] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progress = useVideoProgress(videoRef, index);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(Boolean(entry?.isIntersecting)),
      {
        threshold: 0.4,
      },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Preview plays only while visible, never behind the viewer.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (inView && !viewer && !prefersReducedMotion())
      video.play().catch(() => undefined);
    else video.pause();
  }, [inView, viewer, index]);

  // The whole rail is one button: it always starts the series at video 1.
  const openViewer = () =>
    setViewer({
      index: 0,
      time: index === 0 ? (videoRef.current?.currentTime ?? 0) : 0,
    });

  return (
    <div ref={containerRef} className="w-full max-w-[480px]">
      <div className="group relative w-full">
        <StoryTrack index={index} tone="light">
          <video
            key={STORIES[index]?.src}
            ref={videoRef}
            src={STORIES[index]?.src}
            poster={STORIES[index]?.poster}
            muted={muted}
            playsInline
            preload="metadata"
            draggable={false}
            onEnded={() => setIndex((i) => (i + 1) % STORIES.length)}
            className="pointer-events-none h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
          <StoryCaption index={index} progress={progress}>
            <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-white p-2 text-xs font-bold text-gray-900 transition-transform group-hover:scale-105 sm:px-3 sm:py-1.5">
              <Play size={12} className="fill-current" />
              <span className="hidden sm:inline">Watch series</span>
            </span>
          </StoryCaption>
        </StoryTrack>
        {/* Siblings, not children, of one another so neither button nests. */}
        <button
          type="button"
          onClick={openViewer}
          className="absolute inset-0 z-[3] cursor-pointer"
          aria-label="Watch the Lil Nouns explainer series"
        />
        <button
          type="button"
          onClick={() => setMuted((value) => !value)}
          className="absolute bottom-3 right-[calc(15%+0.75rem)] z-[4] flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
          aria-label={muted ? "Unmute preview" : "Mute preview"}
        >
          {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      </div>

      <StoryViewer
        open={viewer !== null}
        startIndex={viewer?.index ?? 0}
        startTime={viewer?.time ?? 0}
        onClose={(at) => {
          setViewer(null);
          setIndex(at);
        }}
      />
    </div>
  );
}
