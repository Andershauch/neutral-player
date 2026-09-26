"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

/// Egen kontrolbjælke, bygget fordi mux-players indbyggede UI ikke kan
/// styles/positioneres fra vores side (verificeret: mux-player gen-erklærer
/// sine egne CSS-variabler internt i skygge-DOM'en, og ::part()-selektorer
/// dækker enten for lidt eller kolliderer, når man prøver at give
/// undertekster og kontroller luft mellem sig). Vi bruger derfor kun det
/// "raa" <mux-video> — samme Mux/HLS-motor, men helt uden indbygget UI — og
/// tegner selv play/pause/spol/lyd/undertekster/hastighed/PIP/fuldskærm.
///
/// Farverne kommer fra organisationens tema (samme `--primary`/`--foreground`
/// tokens som resten af appen), plus tre nye temafelter dedikeret til denne
/// kontrolbjælke (`--np-player-control-*`), så en kunde kan style den sammen
/// med alt andet branding i /admin/profile/branding.

const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5, 2] as const;

let muxVideoDefinitionPromise: Promise<unknown> | null = null;
function ensureMuxVideoDefined(): Promise<unknown> {
  if (!muxVideoDefinitionPromise) {
    muxVideoDefinitionPromise = import("@mux/mux-video");
  }
  return muxVideoDefinitionPromise;
}

export interface CustomPlayerSubtitleTrack {
  languageCode: string;
  name: string;
  source: string;
}

export interface CustomMuxPlayerHandle {
  play: () => Promise<void> | void;
  getCurrentTime: () => number;
  setCurrentTime: (value: number) => void;
  getDuration: () => number;
}

export interface CustomMuxPlayerProps {
  variantId: string;
  playbackId: string;
  poster?: string;
  videoTitle?: string;
  subtitles?: CustomPlayerSubtitleTrack[];
  className?: string;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onSeeking?: () => void;
  onTimeUpdate?: () => void;
  onLoadedMetadata?: () => void;
  onCanPlay?: () => void;
  onLoadedData?: () => void;
  onError?: () => void;
}

interface CaptionOption {
  track: TextTrack;
  label: string;
  language: string;
}

export function formatPlayerTime(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return "0:00";
  const seconds = Math.floor(totalSeconds);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

function isSubtitleLike(track: TextTrack): boolean {
  return track.kind === "subtitles" || track.kind === "captions";
}

const CustomMuxPlayer = forwardRef<CustomMuxPlayerHandle, CustomMuxPlayerProps>(function CustomMuxPlayer(
  {
    variantId,
    playbackId,
    poster,
    videoTitle,
    subtitles,
    className,
    onPlay,
    onPause,
    onEnded,
    onSeeking,
    onTimeUpdate,
    onLoadedMetadata,
    onCanPlay,
    onLoadedData,
    onError,
  },
  forwardedRef
) {
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<(HTMLVideoElement & { requestPictureInPicture?: () => Promise<unknown> }) | null>(null);
  const hideControlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [playing, setPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedEnd, setBufferedEnd] = useState(0);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPipActive, setIsPipActive] = useState(false);
  const [pipSupported, setPipSupported] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [captionOptions, setCaptionOptions] = useState<CaptionOption[]>([]);
  const [activeCaptionIndex, setActiveCaptionIndex] = useState<number | null>(null);
  const [captionsMenuOpen, setCaptionsMenuOpen] = useState(false);
  const [speedMenuOpen, setSpeedMenuOpen] = useState(false);

  useImperativeHandle(forwardedRef, () => ({
    play: () => videoRef.current?.play(),
    getCurrentTime: () => videoRef.current?.currentTime ?? 0,
    setCurrentTime: (value: number) => {
      if (videoRef.current) videoRef.current.currentTime = value;
    },
    getDuration: () => videoRef.current?.duration ?? 0,
  }));

  // <mux-video> registreres kun client-side (den rører document/customElements
  // ved import), saa vi henter den i en effect i stedet for et top-level import.
  useEffect(() => {
    let cancelled = false;
    ensureMuxVideoDefined().then(() => {
      if (!cancelled) setMounted(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const scheduleHideControls = useCallback(() => {
    if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
    hideControlsTimerRef.current = setTimeout(() => {
      setShowControls((visible) => {
        // Vis dem ikke skjules, mens en menu er aaben, eller videoen er sat paa pause —
        // ellers forsvinder knapperne mens brugeren stadig kigger paa dem.
        if (captionsMenuOpen || speedMenuOpen || !videoRef.current || videoRef.current.paused) {
          return visible;
        }
        return false;
      });
    }, 3000);
  }, [captionsMenuOpen, speedMenuOpen]);

  const revealControls = useCallback(() => {
    setShowControls(true);
    scheduleHideControls();
  }, [scheduleHideControls]);

  useEffect(() => {
    return () => {
      if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
    };
  }, []);

  // Al lytning til den virkelige <mux-video>/<video> er samlet i én effect,
  // saa den koeres igen naar elementet rent faktisk findes (efter mounted).
  useEffect(() => {
    if (!mounted) return;
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => {
      setPlaying(true);
      setHasStarted(true);
      onPlay?.();
      revealControls();
    };
    const handlePause = () => {
      setPlaying(false);
      onPause?.();
      setShowControls(true);
    };
    const handleEnded = () => {
      setPlaying(false);
      onEnded?.();
      setShowControls(true);
    };
    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime || 0);
      onTimeUpdate?.();
    };
    const handleDurationChange = () => setDuration(Number.isFinite(video.duration) ? video.duration : 0);
    const handleProgress = () => {
      const ranges = video.buffered;
      setBufferedEnd(ranges.length > 0 ? ranges.end(ranges.length - 1) : 0);
    };
    const handleVolumeChange = () => {
      setMuted(video.muted);
      setVolume(video.volume);
    };
    const handleRateChange = () => setPlaybackRate(video.playbackRate);
    const handleSeeking = () => {
      onSeeking?.();
      revealControls();
    };
    const handleLoadedMetadata = () => {
      setDuration(Number.isFinite(video.duration) ? video.duration : 0);
      onLoadedMetadata?.();
    };
    const handleCanPlay = () => onCanPlay?.();
    const handleLoadedData = () => onLoadedData?.();
    const handleErrorEvt = () => onError?.();

    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("durationchange", handleDurationChange);
    video.addEventListener("progress", handleProgress);
    video.addEventListener("volumechange", handleVolumeChange);
    video.addEventListener("ratechange", handleRateChange);
    video.addEventListener("seeking", handleSeeking);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("loadeddata", handleLoadedData);
    video.addEventListener("error", handleErrorEvt);

    setPipSupported(typeof document !== "undefined" && "pictureInPictureEnabled" in document);

    const textTracks = video.textTracks;
    const syncCaptions = () => {
      const list: CaptionOption[] = [];
      for (let i = 0; i < textTracks.length; i += 1) {
        const track = textTracks[i];
        if (isSubtitleLike(track)) {
          list.push({ track, label: track.label || track.language || "Undertekster", language: track.language });
        }
      }
      setCaptionOptions(list);
      const showingIndex = list.findIndex((option) => option.track.mode === "showing");
      setActiveCaptionIndex(showingIndex === -1 ? null : showingIndex);
    };
    syncCaptions();
    textTracks.addEventListener("addtrack", syncCaptions);
    textTracks.addEventListener("removetrack", syncCaptions);
    textTracks.addEventListener("change", syncCaptions);

    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("durationchange", handleDurationChange);
      video.removeEventListener("progress", handleProgress);
      video.removeEventListener("volumechange", handleVolumeChange);
      video.removeEventListener("ratechange", handleRateChange);
      video.removeEventListener("seeking", handleSeeking);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("loadeddata", handleLoadedData);
      video.removeEventListener("error", handleErrorEvt);
      textTracks.removeEventListener("addtrack", syncCaptions);
      textTracks.removeEventListener("removetrack", syncCaptions);
      textTracks.removeEventListener("change", syncCaptions);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, playbackId]);

  // Loefter browserens native undertekster op over vores kontrolbjaelke.
  // <mux-video> har (i modsaetning til det gamle mux-player-skin) IKKE sin
  // egen konkurrerende stylesheet der generklaerer denne custom property, saa
  // her virker det rent faktisk at injicere en <style> i dens aabne shadow
  // root — bekraeftet visuelt mod en rigtig build foer denne kode blev skrevet.
  useEffect(() => {
    if (!mounted) return;
    const video = videoRef.current;
    const shadowRoot = (video as unknown as { shadowRoot?: ShadowRoot | null } | null)?.shadowRoot;
    if (!shadowRoot) return;
    if (shadowRoot.querySelector("style[data-np-caption-lift]")) return;

    const style = document.createElement("style");
    style.setAttribute("data-np-caption-lift", "");
    style.textContent = `
      video::-webkit-media-text-track-container {
        transform: translateY(-64px);
        transition: transform 0.15s ease;
      }
      video::cue {
        background: rgba(0, 0, 0, 0.75);
      }
    `;
    shadowRoot.appendChild(style);
  }, [mounted]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handleEnterPip = () => setIsPipActive(true);
    const handleLeavePip = () => setIsPipActive(false);
    video.addEventListener("enterpictureinpicture", handleEnterPip);
    video.addEventListener("leavepictureinpicture", handleLeavePip);
    return () => {
      video.removeEventListener("enterpictureinpicture", handleEnterPip);
      video.removeEventListener("leavepictureinpicture", handleLeavePip);
    };
  }, [mounted]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play();
    } else {
      video.pause();
    }
  };

  const skip = (deltaSeconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    const max = Number.isFinite(video.duration) ? video.duration : Infinity;
    video.currentTime = Math.min(Math.max(0, video.currentTime + deltaSeconds), max);
    revealControls();
  };

  const handleSeekInput = (value: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = value;
    setCurrentTime(value);
    revealControls();
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    if (!video.muted && video.volume === 0) video.volume = 1;
  };

  const handleVolumeInput = (value: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = value;
    video.muted = value === 0;
  };

  const selectCaption = (index: number | null) => {
    captionOptions.forEach((option, i) => {
      option.track.mode = index === i ? "showing" : "disabled";
    });
    setActiveCaptionIndex(index);
    setCaptionsMenuOpen(false);
  };

  const selectPlaybackRate = (rate: number) => {
    const video = videoRef.current;
    if (video) video.playbackRate = rate;
    setSpeedMenuOpen(false);
  };

  const togglePip = async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (video.requestPictureInPicture) {
        await video.requestPictureInPicture();
      }
    } catch {
      // PIP kan afvises af browseren (fx hvis brugeren ikke har interageret endnu) — ikke fatalt.
    }
  };

  const toggleFullscreen = async () => {
    const container = containerRef.current;
    if (!container) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await container.requestFullscreen();
      }
    } catch {
      // Fuldskaerm kan afvises af browseren — ikke fatalt.
    }
  };

  const handleContainerKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    // Lad range-inputs og knapper haandtere deres egne taster (pil-tasterne
    // skal fx flytte fokus paa lydstyrke-slideren, ikke spole videoen).
    if (target.tagName === "INPUT" || target.tagName === "BUTTON") {
      if (event.key !== " " && event.key !== "Spacebar") return;
    }
    switch (event.key) {
      case " ":
      case "Spacebar":
      case "k":
        event.preventDefault();
        togglePlay();
        revealControls();
        break;
      case "ArrowLeft":
        event.preventDefault();
        skip(-5);
        break;
      case "ArrowRight":
        event.preventDefault();
        skip(5);
        break;
      case "m":
        toggleMute();
        break;
      case "f":
        void toggleFullscreen();
        break;
      case "c":
        if (captionOptions.length > 0) {
          selectCaption(activeCaptionIndex === null ? 0 : null);
        }
        break;
      default:
        break;
    }
  };

  const uploadedSubtitles = (subtitles || []).filter((subtitle) => subtitle.source === "uploaded");
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration > 0 ? (bufferedEnd / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className={`np-custom-player relative h-full w-full overflow-hidden bg-black outline-none ${className || ""}`}
      onMouseMove={revealControls}
      onClick={() => revealControls()}
      onKeyDown={handleContainerKeyDown}
      tabIndex={0}
      role="group"
      aria-label={videoTitle || "Videoafspiller"}
    >
      {mounted ? (
        <mux-video
          ref={videoRef}
          playback-id={playbackId}
          stream-type="on-demand"
          poster={poster}
          crossorigin="anonymous"
          playsinline=""
          className="h-full w-full object-contain"
          style={{ width: "100%", height: "100%" }}
        >
          {uploadedSubtitles.map((subtitle) => (
            <track
              key={subtitle.languageCode}
              kind="subtitles"
              srcLang={subtitle.languageCode}
              label={subtitle.name}
              src={`/api/variants/${variantId}/subtitles/${subtitle.languageCode}`}
            />
          ))}
        </mux-video>
      ) : null}

      {!playing && (
        <button
          type="button"
          aria-label={hasStarted ? "Afspil" : "Afspil video"}
          onClick={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
          className="np-custom-player-center-play absolute left-1/2 top-1/2 z-10 flex h-[78px] w-[78px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full transition-transform hover:scale-105 active:scale-95"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
      )}

      <div
        className={`np-custom-player-controls absolute inset-x-0 bottom-0 z-10 flex flex-col gap-1.5 px-3 pb-2.5 pt-6 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative flex h-3 items-center">
          <div className="absolute inset-x-0 h-1 rounded-full bg-white/25" />
          <div className="absolute left-0 h-1 rounded-full bg-white/40" style={{ width: `${bufferedPercent}%` }} />
          <div
            className="absolute left-0 h-1 rounded-full"
            style={{ width: `${progressPercent}%`, background: "var(--np-player-accent)" }}
          />
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={currentTime}
            onChange={(e) => handleSeekInput(Number(e.target.value))}
            aria-label="Spol i videoen"
            className="np-custom-player-range np-custom-player-seek relative z-10 h-3 w-full cursor-pointer appearance-none bg-transparent"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <ControlButton label={playing ? "Pause" : "Afspil"} onClick={togglePlay}>
            {playing ? <PauseIcon /> : <PlayIcon />}
          </ControlButton>
          <ControlButton label="Spol 10 sekunder tilbage" onClick={() => skip(-10)}>
            <SeekIcon direction="back" />
          </ControlButton>
          <ControlButton label="Spol 10 sekunder frem" onClick={() => skip(10)}>
            <SeekIcon direction="forward" />
          </ControlButton>

          <span className="np-custom-player-time px-1.5 text-[11px] font-semibold tabular-nums text-white/90">
            {formatPlayerTime(currentTime)} / {formatPlayerTime(duration)}
          </span>

          <ControlButton label={muted || volume === 0 ? "Slå lyd til" : "Slå lyd fra"} onClick={toggleMute}>
            {muted || volume === 0 ? <MutedIcon /> : <VolumeIcon />}
          </ControlButton>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={muted ? 0 : volume}
            onChange={(e) => handleVolumeInput(Number(e.target.value))}
            aria-label="Lydstyrke"
            className="np-custom-player-range np-custom-player-volume hidden h-3 w-16 cursor-pointer appearance-none bg-transparent sm:block"
          />

          <div className="flex-1" />

          {captionOptions.length > 0 && (
            <div className="relative">
              {captionsMenuOpen && (
                <div
                  role="menu"
                  className="np-custom-player-menu absolute bottom-full right-0 mb-2 min-w-[9rem] rounded-xl p-1 text-xs"
                >
                  <MenuItem label="Fra" checked={activeCaptionIndex === null} onClick={() => selectCaption(null)} />
                  {captionOptions.map((option, index) => (
                    <MenuItem
                      key={`${option.language}-${index}`}
                      label={option.label}
                      checked={activeCaptionIndex === index}
                      onClick={() => selectCaption(index)}
                    />
                  ))}
                </div>
              )}
              <ControlButton
                label="Undertekster"
                active={activeCaptionIndex !== null}
                aria-expanded={captionsMenuOpen}
                onClick={() => {
                  setSpeedMenuOpen(false);
                  setCaptionsMenuOpen((v) => !v);
                }}
              >
                <CaptionsIcon />
              </ControlButton>
            </div>
          )}

          <div className="relative">
            {speedMenuOpen && (
              <div role="menu" className="np-custom-player-menu absolute bottom-full right-0 mb-2 min-w-[6rem] rounded-xl p-1 text-xs">
                {PLAYBACK_RATES.map((rate) => (
                  <MenuItem key={rate} label={`${rate}x`} checked={playbackRate === rate} onClick={() => selectPlaybackRate(rate)} />
                ))}
              </div>
            )}
            <ControlButton
              label="Afspilningshastighed"
              aria-expanded={speedMenuOpen}
              onClick={() => {
                setCaptionsMenuOpen(false);
                setSpeedMenuOpen((v) => !v);
              }}
            >
              <span className="text-[11px] font-black">{playbackRate}x</span>
            </ControlButton>
          </div>

          {pipSupported && (
            <ControlButton label={isPipActive ? "Luk Billede-i-billede" : "Billede-i-billede"} onClick={togglePip}>
              <PipIcon />
            </ControlButton>
          )}

          <ControlButton label={isFullscreen ? "Luk fuldskærm" : "Fuldskærm"} onClick={toggleFullscreen}>
            {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
          </ControlButton>
        </div>
      </div>
    </div>
  );
});

export default CustomMuxPlayer;

function ControlButton({
  label,
  onClick,
  children,
  active,
  ...rest
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  active?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`np-custom-player-button flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white transition-colors ${
        active ? "np-custom-player-button-active" : ""
      }`}
      {...rest}
    >
      {children}
    </button>
  );
}

function MenuItem({ label, checked, onClick }: { label: string; checked: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={checked}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left font-semibold text-white hover:bg-white/15 ${
        checked ? "np-custom-player-menu-item-active" : ""
      }`}
    >
      {label}
    </button>
  );
}

function PlayIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
    </svg>
  );
}

function SeekIcon({ direction }: { direction: "back" | "forward" }) {
  const flip = direction === "back" ? "scale(-1,1)" : undefined;
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ transform: flip }} aria-hidden="true">
      <path d="M4 9V5l-2 2" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M4 12a8 8 0 1 0 2.5-5.8"
        strokeLinecap="round"
      />
      <text x="7" y="17" fontSize="8" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="bold">
        10
      </text>
    </svg>
  );
}

function VolumeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M4 9v6h4l5 5V4L8 9H4z" />
      <path d="M16.5 12a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4z" />
    </svg>
  );
}

function MutedIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M4 9v6h4l5 5V4L8 9H4z" />
      <path d="m16.6 8.4-1.4 1.4 1.4 1.4-1.4 1.4 1.4 1.4 1.4-1.4 1.4 1.4 1.4-1.4-1.4-1.4 1.4-1.4-1.4-1.4-1.4 1.4z" />
    </svg>
  );
}

function CaptionsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M7 13h3M7 10h5M14 13h3M14 10h3" strokeLinecap="round" />
    </svg>
  );
}

function PipIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <rect x="12" y="11" width="7" height="5" rx="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FullscreenIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M4 9V5h4M20 9V5h-4M4 15v4h4M20 15v4h-4" />
    </svg>
  );
}

function FullscreenExitIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M9 4v4H5M15 4v4h4M9 20v-4H5M15 20v-4h4" />
    </svg>
  );
}
